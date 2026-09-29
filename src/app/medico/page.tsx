import DisponibilidadeForm from "@/components/DisponibilidadeForm";
import Panel from "@/components/Panel";
import StatCards from "@/components/StatCards";
import ConsultasTable, { type ConsultaRow } from "@/components/ConsultasTable";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CONSULTA_SELECT } from "@/lib/queries";
import { getProfissionalDoUsuario } from "@/lib/profissional";
import { fimDoDia, inicioDoDia } from "@/lib/format";
import { dataHora } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AgendaMedico({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const user = await requireRole(["medico"]);
  const profissional = await getProfissionalDoUsuario(user.id);
  const supabase = await createClient();

  if (!profissional) return <Panel titulo="Portal do médico"><p>Seu acesso ainda precisa ser vinculado ao cadastro profissional. Entre em contato com a administração da clínica.</p></Panel>;

  const base = () => supabase.from("consultas").select(CONSULTA_SELECT).order("data_hora");
  const { data: horarios, error: horariosError } = await supabase.rpc("minha_agenda_medica");
  const hojeQuery = profissional
    ? base().eq("profissional_id", profissional.id).gte("data_hora", inicioDoDia()).lte("data_hora", fimDoDia())
    : base().gte("data_hora", inicioDoDia()).lte("data_hora", fimDoDia());

  const { data: hoje } = await hojeQuery;
  const { data: proximas } = profissional
    ? await base().eq("profissional_id", profissional.id).gt("data_hora", fimDoDia()).limit(30)
    : await base().gt("data_hora", fimDoDia()).limit(30);

  const { mes } = await searchParams;
  const mesAtual = /^\d{4}-(0[1-9]|1[0-2])$/.test(mes ?? "") ? mes! : new Date().toISOString().slice(0,7);
  const inicioMes = `${mesAtual}-01T00:00:00-03:00`;
  const proximoMes = new Date(Date.UTC(Number(mesAtual.slice(0,4)),Number(mesAtual.slice(5,7)),1)).toISOString().slice(0,7);
  const fimMes = `${proximoMes}-01T00:00:00-03:00`;
  const { data: agendaMensal } = await supabase.from("consultas").select(CONSULTA_SELECT)
    .eq("profissional_id", profissional.id).gte("data_hora",inicioMes).lt("data_hora",fimMes)
    .order("data_hora");
  const diasMes = new Date(Number(mesAtual.slice(0,4)),Number(mesAtual.slice(5,7)),0).getDate();

  return (
    <>
      {!profissional && (
        <div className="cx-alert cx-alert-error">
          Seu usuário ainda não está vinculado a um cadastro de profissional. Peça ao administrador para
          preencher o campo <strong>user_id</strong> do seu registro em Profissionais.
        </div>
      )}

      <StatCards
        stats={[
          { label: "Atendimentos hoje", value: hoje?.length ?? 0 },
          { label: "Próximos agendados", value: proximas?.length ?? 0 },
          { label: "Profissional", value: profissional?.nome ?? user.nome },
        ]}
      />

      <Panel titulo="Minha agenda de hoje" descricao="Atualize o status conforme o atendimento avança.">
        <ConsultasTable consultas={(hoje ?? []) as unknown as ConsultaRow[]} podeAlterarStatus linkPaciente="/medico/pacientes" />
      </Panel>

      <Panel titulo="Calendário de consultas" acao={<form><label>Mês <input type="month" name="mes" defaultValue={mesAtual}/></label><button className="cx-btn cx-btn-ghost">Ver</button></form>}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0,1fr))", gap:"0.4rem", overflowX:"auto" }}>
          {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d=><strong key={d}>{d}</strong>)}
          {Array.from({length:new Date(Number(mesAtual.slice(0,4)),Number(mesAtual.slice(5,7))-1,1).getDay()},(_,i)=><span key={`v${i}`}/>)}
          {Array.from({length:diasMes},(_,i)=>{
            const dia=String(i+1).padStart(2,"0");
            const registros=(agendaMensal??[]).filter(c=>new Date(c.data_hora).toLocaleDateString("en-CA",{timeZone:"America/Sao_Paulo"})===`${mesAtual}-${dia}`);
            return <div key={dia} className="cx-card" style={{minHeight:90,padding:"0.5rem"}}><strong>{i+1}</strong>
              {registros.map(c=><div key={c.id} style={{fontSize:"0.8rem"}}>{new Date(c.data_hora).toLocaleTimeString("pt-BR", {timeZone:"America/Sao_Paulo",hour:"2-digit",minute:"2-digit"})} · {(c.pacientes as unknown as {nome_completo:string}|null)?.nome_completo??"Paciente"}</div>)}
            </div>;
          })}
        </div>
      </Panel>

      <Panel titulo="Disponibilizar horários" descricao="Publique os horários em que você pode atender. Os pacientes agendam pela sua especialidade. Horários de Brasília.">
        <DisponibilidadeForm profissionais={[profissional]} />
        {horariosError ? <p role="alert">Não foi possível carregar os horários publicados.</p> : <table className="cx-table">
          <thead><tr><th>Horário</th><th>Situação</th></tr></thead>
          <tbody>{(horarios ?? []).map((h: { data_hora: string; status: string }) => <tr key={h.data_hora}><td>{dataHora(h.data_hora)}</td><td>{({ disponivel: "Disponível", reservado: "Reservado", bloqueado: "Bloqueado" } as Record<string, string>)[h.status]}</td></tr>)}
          {!horarios?.length && <tr><td colSpan={2}>Nenhum horário futuro publicado.</td></tr>}</tbody>
        </table>}
      </Panel>

      <Panel titulo="Próximos atendimentos">
        <ConsultasTable consultas={(proximas ?? []) as unknown as ConsultaRow[]} linkPaciente="/medico/pacientes" />
      </Panel>
    </>
  );
}
