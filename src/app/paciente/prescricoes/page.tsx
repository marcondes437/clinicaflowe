import Panel from "@/components/Panel";
import { requireRole } from "@/lib/auth";
import { getPacienteDoUsuario } from "@/lib/paciente";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function Prescricoes() {
  const user = await requireRole(["paciente"]);
  const paciente = await getPacienteDoUsuario(user.id);
  const supabase = await createClient();
  const { data, error } = paciente ? await supabase.from("prescricoes")
    .select("id,orientacoes,status,created_at,prescricao_itens(medicamento,dosagem,frequencia,duracao,quantidade)")
    .eq("paciente_id", paciente.id).order("created_at", { ascending: false }) : { data: [], error: null };
  return <Panel titulo="Minhas prescrições">
    {error && <p role="alert">Não foi possível carregar: {error.message}</p>}
    {(data ?? []).map(p => <article className="cx-card" key={p.id} style={{ padding: "1rem", marginBottom: "1rem" }}>
      <strong>{new Date(p.created_at).toLocaleDateString("pt-BR")} · {p.status}</strong>
      <ul>{(p.prescricao_itens ?? []).map(i => <li key={i.medicamento}>{i.medicamento} — {[i.dosagem,i.frequencia,i.duracao,i.quantidade].filter(Boolean).join(" · ")}</li>)}</ul>
      {p.orientacoes && <p>Orientações: {p.orientacoes}</p>}
    </article>)}
    {!error && !data?.length && <p>Nenhuma prescrição disponível.</p>}
  </Panel>;
}
