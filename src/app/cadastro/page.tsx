"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginRequest } from "@/lib/login-request";
import { authErrorMessage } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";
import PatientPortal from "@/components/PatientPortal";
import GoogleIcon from "@/components/GoogleIcon";
import styles from "@/components/PortalLogin.module.css";

function safeRedirect(value: string | null) {
  return value === "/paciente" || value?.startsWith("/paciente/") ? value : "/paciente";
}

function CadastroForm() {
  const params = useSearchParams();
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  function set(campo: keyof typeof form, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (carregando) return;
    setErro(null);
    setOk(null);
    setCarregando(true);

    try {
    const supabase = createClient();
    const destino = safeRedirect(params.get("redirect"));
    const { data, error } = await loginRequest(supabase.auth.signUp({
      email: form.email.trim(),
      password: form.senha,
      options: {
        data: { nome: form.nome.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destino)}`,
      },
    }));

    setCarregando(false);
    if (error) {
      setErro(authErrorMessage(error));
      return;
    }
    if (data.session) {
      window.location.assign(destino);
      return;
    }
    setOk("Para acessar o painel, confirme o link enviado ao seu e-mail. Confira também o spam. Se já possui uma conta, entre ou recupere sua senha.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível concluir o cadastro. Tente novamente.");
    } finally { setCarregando(false); }
  }

  async function cadastrarComGoogle() {
    if (carregando) return;
    setErro(null);
    setCarregando(true);
    try {
    const supabase = createClient();
    const destino = safeRedirect(params.get("redirect"));
    const { data, error } = await loginRequest(supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        skipBrowserRedirect: true,
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destino)}`,
      },
    }));

    if (error) {
      setErro("Não foi possível iniciar o cadastro com Google.");
      setCarregando(false);
      return;
    }
    if (!data.url) throw new Error("Não foi possível abrir o Google. Tente novamente.");
    window.location.assign(data.url);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível conectar ao Google.");
    } finally { setCarregando(false); }
  }

  return (
    <PatientPortal
      accessTitle="Criar conta"
      accessIntro="Cadastre-se para acessar sua área do paciente."
      accessLink={{ href: "/portal-paciente", label: "Já tenho conta" }}
    >
      <form onSubmit={onSubmit} className={styles.form}>
        {erro && <div className={styles.error} role="alert">{erro}</div>}
        {ok && <div className={styles.success} role="status">{ok}</div>}

        <label htmlFor="nome">Nome completo</label>
        <input id="nome" autoComplete="name" required value={form.nome} onChange={(e) => set("nome", e.target.value)} />

        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="seu@email.com" />

        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" autoComplete="new-password" required minLength={6} value={form.senha} onChange={(e) => set("senha", e.target.value)} placeholder="Crie uma senha" />

        <button type="submit" disabled={carregando}>
          {carregando ? "Criando..." : "Criar conta"}
        </button>
        <div className={styles.divider}><span>ou</span></div>
        <button type="button" className={styles.googleButton} onClick={cadastrarComGoogle} disabled={carregando}>
          <GoogleIcon className={styles.googleIcon} />
          <span>Continuar com o Google</span>
        </button>
      </form>
    </PatientPortal>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <CadastroForm />
    </Suspense>
  );
}
