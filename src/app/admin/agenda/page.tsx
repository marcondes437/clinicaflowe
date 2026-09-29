import Panel from "@/components/Panel";
import ConsultaForm from "@/components/ConsultaForm";
import DisponibilidadeForm from "@/components/DisponibilidadeForm";
import ConsultasTable, { type ConsultaRow } from "@/components/ConsultasTable";
import { createClient } from "@/lib/supabase/server";
import { CONSULTA_SELECT, getOpcoes } from "@/lib/queries";
import { criarRegraAgenda, gerarHorariosAgenda } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AgendaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const opcoes = await getOpcoes();

  let query = supabase.from("consultas").select(CONSULTA_SELECT).order("data_hora", { ascending: false }).limit(100);
  if (status) query = query.eq("status", status);
  const { data: consultas } = await query;
  const { data: regras } = await supabase.from("agenda_regras").select("*, profissionais(nome), unidades(nome), especialidades(nome)").order("created_at", {ascending:false});

  return (
    <>
      <Panel
        titulo="Agenda e consultas"
        descricao="Filtre por status e atualize a situação de cada atendimento."
        acao={
          <form style={{ display: "flex", gap: "0.5rem" }}>
            <select name="status" defaultValue={status ?? ""} style={{ padding: "0.5rem", borderRadius: 10, border: "1px solid var(--cx-line)" }}>
              <option value="">Todos os status</option>
              <option value="agendada">Agendada</option>
              <option value="confirmada">Confirmada</option>
              <option value="em_atendimento">Em atendimento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
              <option value="faltou">Faltou</option>
            </select>
            <button className="cx-btn cx-btn-ghost">Filtrar</button>
          </form>
        }
      >
        <ConsultasTable consultas={(consultas ?? []) as unknown as ConsultaRow[]} podeAlterarStatus linkPaciente="/admin/pacientes" />
      </Panel>

      <Panel titulo="Novo agendamento">
        <ConsultaForm
          pacientes={opcoes.pacientes}
          especialidades={opcoes.especialidades}
          unidades={opcoes.unidades}
          horarios={opcoes.horarios}
        />
      </Panel>

      <Panel titulo="Disponibilidade médica" descricao="Libere horários da agenda de cada profissional.">
        <DisponibilidadeForm profissionais={opcoes.profissionais} />
      </Panel>
      <Panel titulo="Regras recorrentes de agenda" descricao="Configure dias, horários, intervalos e depois gere a grade disponível.">
        <form action={criarRegraAgenda} className="cx-grid">
          <label className="cx-field">Profissional<select name="profissional_id" required><option value="">Selecione</option>{opcoes.profissionais.map((p)=><option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
          <label className="cx-field">Dia da semana<select name="dia_semana"><option value="1">Segunda</option><option value="2">Terça</option><option value="3">Quarta</option><option value="4">Quinta</option><option value="5">Sexta</option><option value="6">Sábado</option><option value="0">Domingo</option></select></label>
          <label className="cx-field">Início<input name="hora_inicio" type="time" required /></label><label className="cx-field">Fim<input name="hora_fim" type="time" required /></label>
          <label className="cx-field">Intervalo (min)<input name="intervalo_minutos" type="number" min="5" defaultValue="30" required /></label><label className="cx-field">Pausa início<input name="pausa_inicio" type="time" /></label><label className="cx-field">Pausa fim<input name="pausa_fim" type="time" /></label>
          <div><button className="cx-btn cx-btn-primary">Salvar regra</button></div>
        </form>
        <table className="cx-table"><thead><tr><th>Profissional</th><th>Dia</th><th>Horário</th><th>Intervalo</th><th>Gerar vagas</th></tr></thead><tbody>{(regras??[]).map((r)=><tr key={r.id}><td>{(r.profissionais as unknown as {nome:string}|null)?.nome}</td><td>{["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][r.dia_semana]}</td><td>{r.hora_inicio}–{r.hora_fim}</td><td>{r.intervalo_minutos} min</td><td><form action={gerarHorariosAgenda} className="cx-actions"><input type="hidden" name="regra_id" value={r.id}/><input type="date" name="inicio" required/><input type="date" name="fim" required/><button className="cx-btn cx-btn-ghost">Gerar</button></form></td></tr>)}</tbody></table>
      </Panel>
    </>
  );
}
