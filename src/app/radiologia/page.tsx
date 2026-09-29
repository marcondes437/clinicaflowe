import Panel from "@/components/Panel";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { registrarLaudo, registrarExameRealizado } from "@/lib/actions";
export const dynamic = "force-dynamic";
export default async function Radiologia() {
  const user = await requireRole(["radiologista", "tecnico_radiologia"]);
  const tecnico = user.primaryRole === "tecnico_radiologia";
  const supabase = await createClient();
  const { data, error } = await supabase.from("exames")
    .select("id,tipo,status,pacientes(nome_completo)").eq("categoria", "imagem")
    .order("created_at", { ascending: false }).limit(100);
  return <Panel titulo={tecnico ? "Realizar exames de imagem" : "Laudos de radiologia"}>
    {error && <p role="alert">Não foi possível carregar: {error.message}</p>}
    <table className="cx-table"><thead><tr><th>Paciente</th><th>Exame</th><th>Status</th><th>Ação</th></tr></thead><tbody>
      {(data ?? []).map(e => <tr key={e.id}>
        <td>{(e.pacientes as unknown as {nome_completo:string}|null)?.nome_completo}</td><td>{e.tipo}</td><td>{e.status}</td>
        <td>{tecnico ? (["solicitado","agendado"].includes(e.status) && <form action={registrarExameRealizado} className="cx-actions">
          <input type="hidden" name="exame_id" value={e.id}/><input name="observacoes" placeholder="Observações do exame"/>
          <button className="cx-btn cx-btn-primary">Registrar realização</button></form>)
          : (e.status !== "cancelado" && <form action={registrarLaudo} className="cx-actions">
          <input type="hidden" name="exame_id" value={e.id}/><input name="laudo" placeholder="Laudo" required/>
          <button className="cx-btn cx-btn-primary">Salvar laudo</button></form>)}</td>
      </tr>)}
    </tbody></table>
  </Panel>;
}
