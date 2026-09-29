"use server";

import { createClient } from "@/lib/supabase/server";

export async function registerPresentialInterest(formData: FormData) {
  const rawName = formData.get("name");
  const rawEmail = formData.get("email");
  if (typeof rawName !== "string" || typeof rawEmail !== "string") {
    return { success: false, message: "Preencha seu nome e e-mail." };
  }
  const nome = rawName.trim();
  const email = rawEmail.trim().toLowerCase();
  if (nome.length < 2 || nome.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Informe seu nome e um endereço de e-mail válido." };
  }
  if (formData.get("consent") !== "true") {
    return { success: false, message: "É necessário aceitar o recebimento de novidades." };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("interessados_presencial").insert({ nome, email, consentimento: true });
    // A duplicate receives the same confirmation without exposing existing registrations.
    if (error && error.code !== "23505") {
      return { success: false, message: "Não foi possível salvar seu cadastro. Tente novamente em alguns instantes." };
    }
    return { success: true, message: "Interesse registrado! Seu e-mail está na nossa lista para receber novidades." };
  } catch {
    return { success: false, message: "Não foi possível conectar. Tente novamente em alguns instantes." };
  }
}
