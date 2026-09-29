import Panel from "@/components/Panel";
import ConsultasTable, { type ConsultaRow } from "@/components/ConsultasTable";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CONSULTA_SELECT } from "@/lib/queries";
import { getPacienteDoUsuario } from "@/lib/paciente";
import { dataHora } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HistoricoPaciente() {
  const user = await requireRole(["paciente"]);
  const paciente = await getPacienteDoUsuario(user.id);
  const supabase = await createClient();

  const { data: consultas } = paciente
    ? await supabase.from("consultas").select(CONSULTA_SELECT).eq("paciente_id", paciente.id).order("data_hora", { ascending: false })
    : { data: [] };
  const { data: evolucoes } = paciente
    ? await supabase.from("evolucoes").select("id, descricao, created_at").eq("paciente_id", paciente.id).order("created_at", { ascending: false })
    : { data: [] };

  return (
    <>
      <Panel titulo="Histórico de atendimentos">
        <ConsultasTable consultas={(consultas ?? []) as unknown as ConsultaRow[]} />
      </Panel>
      <Panel titulo="Registros disponibilizados pela equipe">
        {(evolucoes ?? []).map((e) => (
          <article key={e.id} style={{ borderLeft: "3px solid var(--cx-teal-300)", paddingLeft: "0.9rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>{dataHora(e.created_at)}</div>
            <p style={{ margin: "0.2rem 0 0" }}>{e.descricao}</p>
          </article>
        ))}
        {!evolucoes?.length && <p style={{ color: "var(--cx-muted)" }}>Nenhum registro disponível.</p>}
      </Panel>
    </>
  );
}
