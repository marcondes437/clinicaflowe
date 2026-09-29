import AppShell from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { NAV_BY_ROLE } from "@/lib/nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["admin", "administrativo", "atendente"]);

  return (
    <AppShell
      role="admin"
      nome={user.nome}
      email={user.email}
      nav={NAV_BY_ROLE.admin}
      titulo="Administração do ClinicxFlow"
      descricao="Gestão completa de pessoas, unidades, agenda e indicadores."
    >
      {children}
    </AppShell>
  );
}
