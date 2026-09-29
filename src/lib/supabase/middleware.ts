import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import { supabaseFetch } from "./fetch";

type CookieToSet = { name: string; value: string; options?: CookieOptions };
import {
  getPrimaryRole,
  HOME_BY_ROLE,
  normalizeRoles,
  ROLE_ROUTES,
} from "@/lib/roles";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const protectedPrefixes = Object.values(ROLE_ROUTES);
  const isProtected = protectedPrefixes.some((p) => path === p || path.startsWith(p + "/"));

  // Public login pages and the OAuth callback must not wait for session refresh.
  // Protected routes still validate the session and permissions below.
  if (!isProtected) return response;

  try {
    const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();

    const supabase = createServerClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        global: { fetch: supabaseFetch },
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: CookieToSet[], headers?: Record<string, string>) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
            Object.entries(headers ?? {}).forEach(([key, value]) =>
              response.headers.set(key, value)
            );
          },
        },
      }
    );

    const { data } = await supabase.auth.getClaims();
    const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;

    if (!userId && isProtected) return redirectToLogin(request, path);

    if (userId && (isProtected || path === "/cadastro")) {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError || !roles?.length) return redirectToLogin(request, path, "acesso");

      const userRoles = normalizeRoles((roles ?? []).map((r) => r.role));
      const primary = getPrimaryRole(userRoles);

      if (path === "/cadastro") {
        const url = request.nextUrl.clone();
        url.pathname = HOME_BY_ROLE[primary];
        return NextResponse.redirect(url);
      }

      const allowed = userRoles.some((role) => {
        const base = ROLE_ROUTES[role];
        return path === base || path.startsWith(base + "/");
      });

      if (!allowed) {
        const url = request.nextUrl.clone();
        url.pathname = HOME_BY_ROLE[primary];
        return NextResponse.redirect(url);
      }
    }
  } catch (error) {
    console.error("Falha ao atualizar a sessão no middleware", error);
    if (isProtected) return redirectToLogin(request, path, "conexao");
  }

  return response;
}

function redirectToLogin(request: NextRequest, path: string, error?: string) {
  const url = request.nextUrl.clone();
  url.pathname = path === "/medico" || path.startsWith("/medico/") ? "/portal-medico" : "/portal-paciente";
  url.searchParams.set("redirect", path);
  if (error) url.searchParams.set("erro", error);
  return NextResponse.redirect(url);
}
