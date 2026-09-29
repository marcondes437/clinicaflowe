import AppShell from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { NAV_BY_ROLE } from "@/lib/nav";

export default async function MedicoLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["medico"]);
  return (
    <AppShell role="medico" nome={user.nome} email={user.email} nav={NAV_BY_ROLE.medico}
      titulo="Área clínica" descricao="Sua agenda, seus pacientes e registros de atendimento.">
      {children}
    </AppShell>
  );
}
