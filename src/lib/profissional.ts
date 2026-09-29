import { createClient } from "@/lib/supabase/server";

export async function getProfissionalDoUsuario(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("profissionais").select("id, nome").eq("user_id", userId).maybeSingle();
  return data;
}
