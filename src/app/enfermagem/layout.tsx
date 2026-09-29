import AppShell from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { NAV_BY_ROLE } from "@/lib/nav";

export default async function EnfermagemLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["enfermeiro", "tecnico_enfermagem"]);
  return (
    <AppShell role="enfermeiro" nome={user.nome} email={user.email} nav={NAV_BY_ROLE.enfermeiro}
      titulo="Enfermagem" descricao="Atendimentos do dia e registros de acompanhamento.">
      {children}
    </AppShell>
  );
}
