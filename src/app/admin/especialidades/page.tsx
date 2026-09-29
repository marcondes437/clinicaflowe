import Panel from "@/components/Panel";
import EspecialidadeForm from "@/components/EspecialidadeForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EspecialidadesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("especialidades").select("*").order("nome");

  return (
    <>
      <Panel titulo="Especialidades" descricao="Catálogo exibido também no site público.">
        <table className="cx-table">
          <thead><tr><th>Nome</th><th>Descrição</th><th>Status</th></tr></thead>
          <tbody>
            {(data ?? []).map((e) => (
              <tr key={e.id}>
                <td><strong>{e.nome}</strong></td>
                <td>{e.descricao ?? "—"}</td>
                <td><span className="cx-badge cx-badge-ok">{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel titulo="Nova especialidade"><EspecialidadeForm /></Panel>
    </>
  );
}
