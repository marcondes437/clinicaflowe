import Panel from "@/components/Panel";
import UnidadeForm from "@/components/UnidadeForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UnidadesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("unidades").select("*").order("nome");

  return (
    <>
      <Panel titulo="Unidades" descricao="Locais de atendimento do ClinicxFlow.">
        <table className="cx-table">
          <thead><tr><th>Nome</th><th>Endereço</th><th>Cidade</th><th>Horário</th><th>Telefone</th><th>Status</th></tr></thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id}>
                <td><strong>{u.nome}</strong></td>
                <td>{u.endereco ?? "—"}</td>
                <td>{u.cidade ?? "—"}</td>
                <td>{u.horario_funcionamento ?? "—"}</td>
                <td>{u.telefone ?? "—"}</td>
                <td><span className="cx-badge cx-badge-ok">{u.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel titulo="Nova unidade"><UnidadeForm /></Panel>
    </>
  );
}
