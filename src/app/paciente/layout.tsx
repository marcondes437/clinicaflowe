import AppShell from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { NAV_BY_ROLE } from "@/lib/nav";

export default async function PacienteLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["paciente"]);
  return (
    <AppShell role="paciente" nome={user.nome} email={user.email} nav={NAV_BY_ROLE.paciente}
      titulo={`Olá, ${user.nome.split(" ")[0]}`} descricao="Acompanhe suas consultas e cuide da sua saúde em um só lugar.">
      <a href="/paciente/dados" className="cx-btn cx-btn-ghost">Completar ou atualizar meus dados</a>
      {children}
    </AppShell>
  );
}
