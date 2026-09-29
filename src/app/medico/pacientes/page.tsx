import Link from "next/link";
import Panel from "@/components/Panel";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfissionalDoUsuario } from "@/lib/profissional";

export const dynamic = "force-dynamic";

export default async function PacientesDoMedico() {
  const user = await requireRole(["medico"]);
  const profissional = await getProfissionalDoUsuario(user.id);
  const supabase = await createClient();

  if (!profissional) return <Panel titulo="Meus pacientes"><p>Aguarde o vínculo do seu cadastro pela administração.</p></Panel>;

  let query = supabase.from("consultas").select("pacientes(id, nome_completo, celular)");
  if (profissional) query = query.eq("profissional_id", profissional.id);
  const { data } = await query;

  const mapa = new Map<string, { id: string; nome_completo: string; celular: string | null; cidade: string | null }>();
  (data ?? []).forEach((c) => {
    const p = c.pacientes as unknown as { id: string; nome_completo: string; celular: string | null; cidade: string | null } | null;
    if (p) mapa.set(p.id, p);
  });

  return (
    <Panel titulo="Pacientes vinculados aos meus atendimentos">
      <table className="cx-table">
        <thead><tr><th>Nome</th><th>Celular</th><th>Cidade</th><th></th></tr></thead>
        <tbody>
          {[...mapa.values()].map((p) => (
            <tr key={p.id}>
              <td><strong>{p.nome_completo}</strong></td>
              <td>{p.celular ?? "—"}</td>
              <td>{p.cidade ?? "—"}</td>
              <td><Link href={`/medico/pacientes/${p.id}`} style={{ color: "var(--cx-teal-700)", fontWeight: 600 }}>Abrir prontuário</Link></td>
            </tr>
          ))}
          {!mapa.size && <tr><td colSpan={4}>Nenhum paciente vinculado ainda.</td></tr>}
        </tbody>
      </table>
    </Panel>
  );
}
