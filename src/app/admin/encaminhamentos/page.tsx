import Panel from "@/components/Panel";
import { createClient } from "@/lib/supabase/server";
import { analisarEncaminhamento } from "@/lib/actions";
export const dynamic = "force-dynamic";
export default async function EncaminhamentosAdmin() {
  const supabase = await createClient();
  const [{data, error},{data:vagas}] = await Promise.all([
    supabase.from("encaminhamentos").select("id,tipo,descricao,prioridade,status,confirmacao_paciente,vaga_externa_id,pacientes(nome_completo)")
      .order("created_at",{ascending:false}).limit(200),
    supabase.from("vagas_externas").select("id,municipio,procedimento,data")
      .eq("status","disponivel").order("data"),
  ]);
  return <Panel titulo="Encaminhamentos" descricao="Analise as solicitações e associe uma vaga quando houver disponibilidade.">
    {error && <p role="alert">Não foi possível carregar: {error.message}</p>}
    <table className="cx-table"><thead><tr><th>Paciente</th><th>Pedido</th><th>Prioridade</th><th>Resposta</th><th>Regulação</th></tr></thead><tbody>
      {(data??[]).map(e=><tr key={e.id}>
        <td>{(e.pacientes as unknown as {nome_completo:string}|null)?.nome_completo}</td><td>{e.tipo}: {e.descricao}</td>
        <td>{e.prioridade}</td><td>{e.confirmacao_paciente??"Aguardando"}</td>
        <td><form action={analisarEncaminhamento} className="cx-actions">
          <input type="hidden" name="id" value={e.id}/>
          <select name="status" defaultValue={e.status}>{["solicitado","em_analise","agendado","concluido","cancelado","negado"].map(s=><option key={s}>{s}</option>)}</select>
          <select name="vaga_externa_id" defaultValue={e.vaga_externa_id??""}><option value="">Sem vaga vinculada</option>
            {(vagas??[]).map(v=><option key={v.id} value={v.id}>{v.data} · {v.municipio} · {v.procedimento}</option>)}</select>
          <button className="cx-btn cx-btn-primary">Salvar</button>
        </form></td>
      </tr>)}
    </tbody></table>
  </Panel>;
}
