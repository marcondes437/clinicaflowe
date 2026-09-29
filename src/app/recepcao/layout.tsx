import AppShell from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { NAV_BY_ROLE } from "@/lib/nav";

export default async function RecepcaoLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["recepcionista"]);
  return (
    <AppShell role="recepcionista" nome={user.nome} email={user.email} nav={NAV_BY_ROLE.recepcionista}
      titulo="Recepção" descricao="Cadastro de pacientes, agendamentos e confirmações.">
      {children}
    </AppShell>
  );
}
