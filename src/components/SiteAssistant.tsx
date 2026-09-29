"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { readAssistantEvents } from "@/lib/assistant-stream";
import styles from "./SiteAssistant.module.css";

type Message = { role: "user" | "assistant"; content: string };
const greeting: Message = { role: "assistant", content: "Olá! Sou a assistente virtual da ClínicaFlow. Como posso ajudar você hoje?" };
const publicPages = ["/", "/sobre", "/procurar-clinica", "/agendamento-online", "/portal-medico", "/recuperar-senha"];
const routes = ["/agendamento-online", "/cadastro", "/portal-paciente", "/portal-medico", "/recuperar-senha", "/#unidades", "/#especialidades", "/#exames", "/#faq"];
function MessageText({ text, close }: { text: string; close: () => void }) {
  return <>{text.split(/(\/(?:[a-z-]+|#[a-z-]+))/g).map((part, i) => routes.includes(part) ? <Link key={i} href={part} onClick={close}>{part}</Link> : part)}</>;
}
function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    chat: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.5-4A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8 10h8M8 14h5" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    arrow: <path d="M12 19V5m-6 6 6-6 6 6" />,
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export default function SiteAssistant({ aiEnabled }: { aiEnabled: boolean }) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  const pending = useRef<AbortController | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(aiEnabled);
  const isPublicPage = publicPages.includes(pathname);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      input.current?.focus();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);
  useEffect(() => { if (log.current) log.current.scrollTop = messages.length === 1 ? 0 : log.current.scrollHeight; }, [messages, loading]);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => { setMode(aiEnabled); }, [aiEnabled]);
  useEffect(() => {
    if (!input.current) return;
    input.current.style.height = "auto";
    input.current.style.height = `${Math.min(input.current.scrollHeight, 120)}px`;
  }, [draft, open]);
  function close() { setOpen(false); trigger.current?.focus(); }
  async function send(text: string) {
    if (!text.trim() || busy.current) return;
    busy.current = true;
    const next: Message[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next); setDraft(""); setLoading(true); setError("");
    const controller = new AbortController();
    pending.current = controller;
    let answer = "";
    try {
      const response = await fetch("/api/assistente", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10).map(message => ({ ...message, content: message.content.slice(0, 1200) })) }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Não foi possível enviar sua mensagem.");
      }
      if (response.headers.get("content-type")?.includes("text/event-stream") && response.body) {
        setMode(true);
        let completed = false;
        for await (const event of readAssistantEvents(response.body)) {
          if (event.type === "error") throw new Error(event.error);
          if (event.type === "delta") {
            answer += event.text;
            setMessages([...next, { role: "assistant", content: answer }]);
          }
          if (event.type === "done") completed = true;
        }
        if (!completed) throw new Error("A conexão foi interrompida. Tente novamente.");
      } else {
        const data = await response.json();
        setMode(data.mode === "ai");
        setMessages([...next, { role: "assistant", content: data.answer }]);
      }
    } catch (e) {
      setError(controller.signal.aborted ? "Resposta interrompida por você." : e instanceof Error && e.name !== "TimeoutError" ? e.message : "A resposta demorou. Tente novamente.");
      if (answer) setMessages([...next, { role: "assistant", content: `${answer}\n\n[Resposta interrompida]` }]);
      else setMessages(messages);
      setDraft(text);
    } finally { pending.current = null; busy.current = false; setLoading(false); input.current?.focus(); }
  }
  return <>
    <button ref={trigger} hidden={!isPublicPage} className={styles.launcher} type="button" onClick={() => setOpen(true)} aria-label="Fale com nossa assistente" aria-haspopup="dialog" aria-expanded={open} aria-controls="clinicflow-assistant">
      <span className={styles.launcherIcon}><Icon name="chat" /></span><span><strong>Posso ajudar?</strong><small>Converse com nossa assistente</small></span>
    </button>
    <dialog id="clinicflow-assistant" ref={dialog} hidden={!isPublicPage} className={styles.panel} aria-labelledby="assistant-title" onCancel={close} onClose={() => setOpen(false)}>
      <header className={styles.header}>
        <div className={styles.avatar}><Icon name="chat" /><span /></div>
        <div className={styles.heading}><span className={styles.eyebrow}>CLÍNICAFLOW</span><h2 id="assistant-title">Sua assistente virtual</h2><p>{mode ? "Com inteligência artificial" : "Ajuda para navegar e agendar"}</p></div>
        <button className={styles.close} type="button" onClick={close} aria-label="Fechar assistente"><Icon name="close" /></button>
      </header>
      <div className={styles.log} ref={log} role="log" aria-live="polite" aria-busy={loading} aria-relevant="additions text" aria-label="Conversa com a assistente">
        {messages.map((message, i) => <div key={i} className={`${styles.message} ${message.role === "user" ? styles.user : ""}`}><small>{message.role === "user" ? "Você" : "Assistente ClínicaFlow"}</small><p>{message.role === "assistant" ? <MessageText text={message.content} close={close} /> : message.content}</p></div>)}
        {loading && <div className={styles.thinking} role="status"><span aria-hidden="true"><i /><i /><i /></span>Preparando sua resposta…</div>}
      </div>
      <div className={styles.composer}>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <form className={styles.form} onSubmit={e => { e.preventDefault(); send(draft); }}>
          <textarea ref={input} rows={1} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(draft); } }} maxLength={1200} placeholder="Escreva sua dúvida…" aria-label="Sua pergunta para a assistente" />
          {loading ? <button type="button" onClick={() => pending.current?.abort()} aria-label="Interromper resposta" title="Interromper resposta"><Icon name="stop" /></button> : <button type="submit" disabled={!draft.trim()} aria-label="Enviar mensagem" title="Enviar mensagem"><Icon name="arrow" /></button>}
        </form>
      </div>
    </dialog>
  </>;
}
