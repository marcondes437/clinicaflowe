import Panel from "@/components/Panel";
import ConsultasTable, { type ConsultaRow } from "@/components/ConsultasTable";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CONSULTA_SELECT } from "@/lib/queries";
import { inicioDoDia, fimDoDia } from "@/lib/format";
import { registrarExameRealizado } from "@/lib/actions";
export const dynamic = "force-dynamic";
export default async function Enfermagem() {
  const user = await requireRole(["enfermeiro", "tecnico_enfermagem"]);
  const supabase = await createClient();
  if (user.primaryRole === "tecnico_enfermagem") {
    const { data, error } = await supabase.from("exames")
      .select("id,tipo,status,pacientes(nome_completo)").eq("categoria","ecg")
      .order("created_at",{ascending:false}).limit(100);
    return <Panel titulo="Eletrocardiogramas">
      {error && <p role="alert">Não foi possível carregar: {error.message}</p>}
      <table className="cx-table"><thead><tr><th>Paciente</th><th>Exame</th><th>Status</th><th>Ação</th></tr></thead><tbody>
        {(data ?? []).map(e => <tr key={e.id}><td>{(e.pacientes as unknown as {nome_completo:string}|null)?.nome_completo}</td>
          <td>{e.tipo}</td><td>{e.status}</td><td>{["solicitado","agendado"].includes(e.status) &&
            <form action={registrarExameRealizado} className="cx-actions"><input type="hidden" name="exame_id" value={e.id}/>
              <input name="observacoes" placeholder="Observações"/><button className="cx-btn cx-btn-primary">Registrar ECG</button></form>}</td></tr>)}
      </tbody></table>
    </Panel>;
  }
  const { data, error } = await supabase.from("consultas").select(CONSULTA_SELECT)
    .gte("data_hora",inicioDoDia()).lte("data_hora",fimDoDia()).order("data_hora");
  return <Panel titulo="Atendimentos do dia">
    {error && <p role="alert">Não foi possível carregar: {error.message}</p>}
    <ConsultasTable consultas={(data ?? []) as unknown as ConsultaRow[]} podeAlterarStatus/>
  </Panel>;
}
