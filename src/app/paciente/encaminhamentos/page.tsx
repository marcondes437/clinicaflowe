import Panel from "@/components/Panel";
import { requireRole } from "@/lib/auth";
import { getPacienteDoUsuario } from "@/lib/paciente";
import { createClient } from "@/lib/supabase/server";
import { responderEncaminhamento } from "@/lib/actions";
export const dynamic = "force-dynamic";
export default async function EncaminhamentosPaciente() {
  const user = await requireRole(["paciente"]);
  const paciente = await getPacienteDoUsuario(user.id);
  const supabase = await createClient();
  const { data, error } = paciente ? await supabase.from("encaminhamentos")
    .select("id,tipo,descricao,prioridade,status,confirmacao_paciente,created_at,especialidades(nome)")
    .eq("paciente_id", paciente.id).order("created_at", { ascending: false }) : { data: [], error: null };
  return <Panel titulo="Meus encaminhamentos" descricao="Confirme ou cancele quando o encaminhamento estiver agendado.">
    {error && <p role="alert">Não foi possível carregar: {error.message}</p>}
    {(data ?? []).map(e => <article className="cx-card" key={e.id} style={{ padding: "1rem", marginBottom: "1rem" }}>
      <strong>{e.tipo} · {(e.especialidades as unknown as {nome:string}|null)?.nome ?? "Sem especialidade"}</strong>
      <p>{e.descricao}</p><p>Situação: {e.status} · Prioridade: {e.prioridade}{e.confirmacao_paciente && ` · Resposta: ${e.confirmacao_paciente}`}</p>
      {e.status === "agendado" && !e.confirmacao_paciente && <div className="cx-actions">
        {["confirmado","cancelado"].map(resposta => <form key={resposta} action={responderEncaminhamento}>
          <input type="hidden" name="id" value={e.id}/><input type="hidden" name="resposta" value={resposta}/>
          <button className="cx-btn cx-btn-ghost">{resposta === "confirmado" ? "Confirmar" : "Cancelar"}</button>
        </form>)}
      </div>}
    </article>)}
    {!error && !data?.length && <p>Nenhum encaminhamento registrado.</p>}
  </Panel>;
}
