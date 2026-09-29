import Panel from "@/components/Panel";
import ProfissionalForm from "@/components/ProfissionalForm";
import { createClient } from "@/lib/supabase/server";
import { getOpcoes } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ProfissionaisPage() {
  const supabase = await createClient();
  const { especialidades, unidades } = await getOpcoes();

  const { data: profissionais } = await supabase
    .from("profissionais")
    .select("id, nome, registro_profissional, telefone, email, status, especialidades(nome), unidades(nome)")
    .order("nome");

  return (
    <>
      <Panel titulo="Profissionais" descricao="Equipe cadastrada e vinculada às unidades.">
        <table className="cx-table">
          <thead><tr><th>Nome</th><th>Registro</th><th>Especialidade</th><th>Unidade</th><th>Contato</th><th>Status</th></tr></thead>
          <tbody>
            {(profissionais ?? []).map((p) => (
              <tr key={p.id}>
                <td><strong>{p.nome}</strong></td>
                <td>{p.registro_profissional ?? "—"}</td>
                <td>{(p.especialidades as unknown as { nome: string } | null)?.nome ?? "—"}</td>
                <td>{(p.unidades as unknown as { nome: string } | null)?.nome ?? "—"}</td>
                <td>{p.telefone ?? p.email ?? "—"}</td>
                <td><span className="cx-badge cx-badge-ok">{p.status}</span></td>
              </tr>
            ))}
            {!profissionais?.length && <tr><td colSpan={6}>Nenhum profissional cadastrado.</td></tr>}
          </tbody>
        </table>
      </Panel>

      <Panel titulo="Cadastrar profissional">
        <ProfissionalForm especialidades={especialidades} unidades={unidades} />
      </Panel>
    </>
  );
}
