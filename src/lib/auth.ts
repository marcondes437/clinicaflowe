import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/display-name";
import {
  getPrimaryRole,
  HOME_BY_ROLE,
  normalizeRoles,
  type AppRole,
} from "@/lib/roles";

export type SessionUser = {
  id: string;
  email: string | null;
  nome: string;
  roles: AppRole[];
  primaryRole: AppRole;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) return null;

  const [{ data: roles, error: rolesError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("profiles").select("nome").eq("id", userId).maybeSingle(),
  ]);
  if (rolesError || profileError || !roles?.length) redirect("/portal-paciente?erro=acesso");

  const list = normalizeRoles((roles ?? []).map((r) => r.role));
  const primaryRole = getPrimaryRole(list);
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;

  return {
    id: userId,
    email,
    nome: getDisplayName(profile?.nome, data?.claims?.user_metadata),
    roles: list,
    primaryRole,
  };
}

export async function requireRole(allowed: AppRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/portal-paciente");
  if (!user.roles.some((r) => allowed.includes(r))) {
    redirect(HOME_BY_ROLE[user.primaryRole]);
  }
  return user;
}
