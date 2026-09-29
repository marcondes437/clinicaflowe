import AppShell from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { NAV_BY_ROLE } from "@/lib/nav";

export default async function GestorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["gestor"]);
  return (
    <AppShell role="gestor" nome={user.nome} email={user.email} nav={NAV_BY_ROLE.gestor}
      titulo="Gestão do ClinicxFlow" descricao="Indicadores, agenda e acompanhamento operacional.">
      {children}
    </AppShell>
  );
}
