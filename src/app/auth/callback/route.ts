import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost ? `${forwardedProtocol}://${forwardedHost}` : url.origin;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/paciente";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) return NextResponse.redirect(new URL(next, origin));
      console.error("Falha ao trocar código OAuth", error.message);
    } catch (error) {
      console.error("Falha inesperada no callback OAuth", error);
    }
  }

  const errorUrl = new URL("/portal-paciente", origin);
  errorUrl.searchParams.set("erro", "oauth");
  return NextResponse.redirect(errorUrl);
}
