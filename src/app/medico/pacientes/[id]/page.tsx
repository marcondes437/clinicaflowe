import { requireRole } from "@/lib/auth";
import { getProfissionalDoUsuario } from "@/lib/profissional";
import { notFound } from "next/navigation";
import Panel from "@/components/Panel";
import ConsultasTable, { type ConsultaRow } from "@/components/ConsultasTable";
import EvolucaoForm from "@/components/EvolucaoForm";
import { createClient } from "@/lib/supabase/server";
import { CONSULTA_SELECT } from "@/lib/queries";
import { dataCurta, dataHora } from "@/lib/format";
import { criarPrescricao, solicitarExame, criarEncaminhamento } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ProntuarioMedico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const user = await requireRole(["medico"]);
  const profissional = await getProfissionalDoUsuario(user.id);
  if (!profissional) notFound();
  const { data: vinculo } = await supabase.from("consultas").select("id").eq("paciente_id", id).eq("profissional_id", profissional.id).limit(1);
  if (!vinculo?.length) notFound();

  const { data: paciente } = await supabase.from("pacientes").select("*").eq("id", id).maybeSingle();
  if (!paciente) notFound();

  const [{ data: consultas }, { data: evolucoes }, {data: especialidades}] = await Promise.all([
    supabase.from("consultas").select(CONSULTA_SELECT).eq("profissional_id", profissional.id).eq("paciente_id", id).order("data_hora", { ascending: false }),
    supabase.from("evolucoes").select("id, descricao, created_at").eq("paciente_id", id).order("created_at", { ascending: false }),
    supabase.from("especialidades").select("id,nome").eq("status","ativo").order("nome"),
  ]);

  return (
    <>
      <Panel titulo={paciente.nome_completo} descricao={`Nascimento: ${dataCurta(paciente.data_nascimento)} · Celular: ${paciente.celular ?? "—"}`}>
        <p style={{ margin: 0, color: "var(--cx-muted)" }}>{paciente.observacoes ?? "Sem observações registradas."}</p>
      </Panel>

      <Panel titulo="Atendimentos">
        <ConsultasTable consultas={(consultas ?? []) as unknown as ConsultaRow[]} podeAlterarStatus />
      </Panel>

      <Panel titulo="Evolução clínica">
        {(evolucoes ?? []).map((e) => (
          <article key={e.id} style={{ borderLeft: "3px solid var(--cx-teal-300)", paddingLeft: "0.9rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>{dataHora(e.created_at)}</div>
            <p style={{ margin: "0.2rem 0 0" }}>{e.descricao}</p>
          </article>
        ))}
        {!evolucoes?.length && <p style={{ color: "var(--cx-muted)" }}>Nenhuma evolução registrada.</p>}
        <EvolucaoForm pacienteId={id} />
      </Panel>

      <Panel titulo="Prescrição"><form action={criarPrescricao} className="cx-grid"><input type="hidden" name="paciente_id" value={id}/><label className="cx-field">Medicamento<input name="medicamento" required/></label><label className="cx-field">Dosagem<input name="dosagem"/></label><label className="cx-field">Frequência<input name="frequencia"/></label><label className="cx-field">Duração<input name="duracao"/></label><label className="cx-field">Quantidade<input name="quantidade"/></label><label className="cx-field">Orientações<textarea name="orientacoes"/></label><div><button className="cx-btn cx-btn-primary">Emitir prescrição</button></div></form></Panel>
      <Panel titulo="Solicitar exame"><form action={solicitarExame} className="cx-grid"><input type="hidden" name="paciente_id" value={id}/><label className="cx-field">Exame<input name="tipo" required/></label><label className="cx-field">Categoria<select name="categoria"><option value="laboratorio">Laboratório</option><option value="imagem">Imagem</option><option value="ecg">ECG</option><option value="outro">Outro</option></select></label><label className="cx-field">Solicitação<textarea name="solicitacao"/></label><div><button className="cx-btn cx-btn-primary">Solicitar exame</button></div></form></Panel>
      <Panel titulo="Encaminhamento"><form action={criarEncaminhamento} className="cx-grid"><input type="hidden" name="paciente_id" value={id}/><label className="cx-field">Tipo<select name="tipo"><option value="especialidade">Especialidade</option><option value="exame">Exame</option><option value="cirurgia">Cirurgia</option><option value="tratamento">Tratamento</option></select></label><label className="cx-field">Especialidade<select name="especialidade_id"><option value="">Selecione</option>{(especialidades??[]).map(e=><option key={e.id} value={e.id}>{e.nome}</option>)}</select></label><label className="cx-field">Prioridade<select name="prioridade"><option value="normal">Normal</option><option value="prioritario">Prioritário</option><option value="urgente">Urgente</option></select></label><label className="cx-field">Descrição<textarea name="descricao" required/></label><div><button className="cx-btn cx-btn-primary">Encaminhar</button></div></form></Panel>
    </>
  );
}
