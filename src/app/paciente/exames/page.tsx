import Panel from "@/components/Panel";
import { requireRole } from "@/lib/auth";
import { getPacienteDoUsuario } from "@/lib/paciente";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function ExamesPaciente() {
  const user = await requireRole(["paciente"]);
  const paciente = await getPacienteDoUsuario(user.id);
  const supabase = await createClient();
  const { data, error } = paciente ? await supabase.from("exames")
    .select("id,tipo,categoria,status,data_agendada,created_at,resultados_exames(resultado,created_at),laudos(laudo,created_at)")
    .eq("paciente_id", paciente.id).order("created_at", { ascending: false }) : { data: [], error: null };
  return <Panel titulo="Meus exames e resultados">
    {error && <p role="alert">Não foi possível carregar: {error.message}</p>}
    {(data ?? []).map(e => <article className="cx-card" key={e.id} style={{ padding: "1rem", marginBottom: "1rem" }}>
      <strong>{e.tipo}</strong> · {e.categoria} · {e.status}
      {e.data_agendada && <p>Agendado para {new Date(e.data_agendada).toLocaleString("pt-BR")}</p>}
      {(e.resultados_exames ?? []).map(r => <p key={r.created_at}>Resultado: {r.resultado}</p>)}
      {(e.laudos ?? []).map(l => <p key={l.created_at}>Laudo: {l.laudo}</p>)}
    </article>)}
    {!error && !data?.length && <p>Nenhum exame solicitado.</p>}
  </Panel>;
}
