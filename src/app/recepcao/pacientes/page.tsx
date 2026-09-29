import Panel from "@/components/Panel";
import PacienteForm from "@/components/PacienteForm";
import { createClient } from "@/lib/supabase/server";
import { dataCurta } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PacientesRecepcao({
  searchParams,
}: { searchParams: Promise<{ busca?: string }> }) {
  const { busca } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("pacientes").select("*").order("nome_completo");
  if (busca) query = query.ilike("nome_completo", `%${busca}%`);
  const { data } = await query;

  return (
    <>
      <Panel
        titulo="Pacientes"
        acao={
          <form style={{ display: "flex", gap: "0.5rem" }}>
            <input name="busca" defaultValue={busca ?? ""} placeholder="Buscar por nome"
              style={{ padding: "0.55rem 0.8rem", border: "1px solid var(--cx-line)", borderRadius: 10 }} />
            <button className="cx-btn cx-btn-ghost">Buscar</button>
          </form>
        }
      >
        <table className="cx-table">
          <thead><tr><th>Nome</th><th>CPF</th><th>Nascimento</th><th>Celular</th></tr></thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id}>
                <td><strong>{p.nome_completo}</strong></td>
                <td>{p.cpf ?? "—"}</td>
                <td>{dataCurta(p.data_nascimento)}</td>
                <td>{p.celular ?? p.telefone ?? "—"}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={4}>Nenhum paciente encontrado.</td></tr>}
          </tbody>
        </table>
      </Panel>

      <Panel titulo="Cadastrar novo paciente"><PacienteForm /></Panel>
    </>
  );
}
