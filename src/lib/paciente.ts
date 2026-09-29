import { createClient } from "@/lib/supabase/server";

export async function getPacienteDoUsuario(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pacientes")
    .select("id, nome_completo, celular, email, data_nascimento")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("Falha ao consultar cadastro de paciente", error.code);
    throw new Error("Não foi possível carregar seu cadastro. Tente novamente.");
  }
  return data;
}
