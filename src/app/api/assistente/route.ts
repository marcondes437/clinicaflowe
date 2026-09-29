import { NextResponse } from "next/server";
import { ASSISTANT_KNOWLEDGE, basicAnswer } from "@/lib/assistant";
import { readAssistantEvents } from "@/lib/assistant-stream";

export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store" };
let windowStart = 0;
let requests = 0;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Origem não permitida." }, { status: 403, headers });
  let raw = "";
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Mensagem inválida." }, { status: 400, headers });
  try {
    const decoder = new TextDecoder();
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) { raw += decoder.decode(); break; }
      size += value.byteLength;
      if (size > 64000) {
        await reader.cancel();
        return NextResponse.json({ error: "Conversa muito longa. Inicie uma nova conversa." }, { status: 413, headers });
      }
      raw += decoder.decode(value, { stream: true });
    }
  } catch {
    return NextResponse.json({ error: "Mensagem inválida." }, { status: 400, headers });
  } finally { reader.releaseLock(); }
  let body;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Mensagem inválida." }, { status: 400, headers }); }
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 12 || messages.some(m => !m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || !m.content.trim() || m.content.length > 1200) || messages.at(-1).role !== "user") {
    return NextResponse.json({ error: "Envie uma pergunta com até 1.200 caracteres." }, { status: 400, headers });
  }
  if (Date.now() - windowStart > 60000) { windowStart = Date.now(); requests = 0; }
  if (++requests > 30) return NextResponse.json({ error: "Muitas mensagens neste momento. Tente novamente em um minuto." }, { status: 429, headers: { ...headers, "Retry-After": "60" } });
  if (!process.env.OPENAI_API_KEY?.trim()) return NextResponse.json({ answer: basicAnswer(messages.at(-1).content), mode: "basic" }, { headers });
  const abort = new AbortController();
  const signal = AbortSignal.any([request.signal, abort.signal, AbortSignal.timeout(55000)]);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL?.trim() || "gpt-6-astra", instructions: ASSISTANT_KNOWLEDGE, input: messages.map(m => ({ role: m.role, content: m.content })), max_output_tokens: 4096, store: false, stream: true }),
      signal,
    });
    if (!response.ok) throw new Error("Provider unavailable");
    if (!response.body) throw new Error("Empty response");
    const upstream = response.body;
    const encoder = new TextEncoder();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (event: object) => { if (!cancelled) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)); };
        let completed = false;
        let hasText = false;
        try {
          for await (const event of readAssistantEvents(upstream)) {
            if ((event.type === "response.output_text.delta" || event.type === "response.refusal.delta") && typeof event.delta === "string") {
              hasText ||= Boolean(event.delta);
              emit({ type: "delta", text: event.delta });
            }
            if (event.type === "response.completed") { completed = true; break; }
            if (["error", "response.failed", "response.incomplete"].includes(event.type)) throw new Error("Incomplete response");
          }
          if (!completed || !hasText) throw new Error("Incomplete response");
          emit({ type: "done" });
        } catch {
          emit({ type: "error", error: "A resposta foi interrompida. Tente enviar sua pergunta novamente." });
        } finally {
          abort.abort();
          if (!cancelled) controller.close();
        }
      },
      cancel() { cancelled = true; abort.abort(); },
    });
    return new Response(stream, { headers: { ...headers, "Content-Type": "text/event-stream; charset=utf-8", "X-Accel-Buffering": "no" } });
  } catch {
    return NextResponse.json({ error: "O assistente está indisponível agora. Tente novamente ou consulte os contatos da unidade." }, { status: 503, headers });
  }
}
