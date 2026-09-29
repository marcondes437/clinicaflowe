"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginRequest } from "@/lib/login-request";
import { authErrorMessage } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/roles";
import styles from "./PortalLogin.module.css";
import PatientPortal from "./PatientPortal";
import GoogleIcon from "./GoogleIcon";

type PortalLoginProps = {
  role: Extract<AppRole, "medico" | "paciente">;
};

const PORTAL = {
  paciente: {
    label: "Portal do cliente",
    title: "Bem-vindo ao seu cuidado",
    description: "Acompanhe suas consultas, histórico e informações de saúde em um só lugar.",
    image: "/fotos/clinicageral.jpg",
    emailLabel: "E-mail",
    help: "Primeiro acesso? Fale com a recepção da sua unidade.",
    destination: "/paciente",
  },
  medico: {
    label: "Portal do médico",
    title: "Sua prática clínica em um só lugar",
    description: "Consulte sua agenda, acompanhe seus pacientes e registre cada atendimento com segurança.",
    image: "/fotos/enfermagem.jpg",
    emailLabel: "E-mail profissional",
    help: "Acesso exclusivo para profissionais cadastrados pela ClinicaFlow.",
    destination: "/medico",
  },
} as const;

export default function PortalLogin({ role }: PortalLoginProps) {
  const searchParams = useSearchParams();
  const portal = PORTAL[role];
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [confirmacaoPendente, setConfirmacaoPendente] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (carregando) return;
    setErro(null);
    setAviso(null);
    setConfirmacaoPendente(false);
    setCarregando(true);

    try {
      const supabase = createClient();
      const { data, error } = await loginRequest(supabase.auth.signInWithPassword({ email: email.trim(), password: senha }));

      if (error || !data.user) {
        setErro(authErrorMessage(error));
        setConfirmacaoPendente(error?.code === "email_not_confirmed");
        setCarregando(false);
        return;
      }

      const { data: roles, error: rolesError } = await loginRequest(supabase.from("user_roles").select("role").eq("user_id", data.user.id));
      if (rolesError) throw new Error("Não foi possível verificar seu acesso. Tente novamente.");
      if (!roles?.length) throw new Error("Sua conta foi autenticada, mas o cadastro de acesso está incompleto. Solicite à clínica a regularização do cadastro.");
      const temAcesso = (roles ?? []).some((item) => item.role === role);

      if (!temAcesso) {
        await loginRequest(supabase.auth.signOut());
        setErro(`Este acesso é exclusivo para ${role === "medico" ? "médicos" : "pacientes"}.`);
        setCarregando(false);
        return;
      }

      const requested = searchParams.get("redirect");
      const destination = requested && (requested === portal.destination || requested.startsWith(`${portal.destination}/`)) ? requested : portal.destination;
      window.location.assign(destination);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível concluir o login. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function reenviarConfirmacao() {
    if (carregando) return;
    setCarregando(true);
    setErro(null);
    setAviso(null);
    try {
      const { error } = await loginRequest(createClient().auth.resend({
        type: "signup", email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(portal.destination)}` },
      }));
      if (error) setErro(authErrorMessage(error));
      else setAviso("Confirmação solicitada. Confira seu e-mail e a caixa de spam.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível reenviar a confirmação.");
    } finally { setCarregando(false); }
  }

  async function loginComGoogle() {
    if (carregando) return;
    setErro(null);
    setCarregando(true);
    try {
      const supabase = createClient();
      const { data, error } = await loginRequest(supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          skipBrowserRedirect: true,
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(portal.destination)}`,
        },
      }));

      if (error) {
        setErro("Não foi possível iniciar o login com Google.");
        setCarregando(false);
        return;
      }
      if (!data.url) throw new Error("Não foi possível abrir o Google. Tente novamente.");
      window.location.assign(data.url);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível iniciar o login com Google. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  const loginForm = (
    <form onSubmit={onSubmit} className={styles.form}>
      {(erro || searchParams.get("erro")) && <div className={styles.error} role="alert">{erro || (searchParams.get("erro") === "acesso"
        ? "Sua sessão foi identificada, mas não foi possível carregar seu cadastro de acesso. Tente novamente; se persistir, fale com a clínica."
        : searchParams.get("erro") === "conexao" ? "A conexão demorou mais que o esperado. Tente entrar novamente."
        : "Não foi possível validar o link de acesso. Se você confirmou o e-mail, tente entrar com sua senha; se necessário, solicite um novo link.")}</div>}
      {aviso && <div className={styles.success} role="status">{aviso}</div>}
      {confirmacaoPendente && <button type="button" disabled={carregando} onClick={reenviarConfirmacao}>Reenviar confirmação de e-mail</button>}
      <label htmlFor={`${role}-email`}>{portal.emailLabel}</label>
      <input
        id={`${role}-email`}
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="seu@email.com"
      />

      <div className={styles.passwordLabel}>
        <label htmlFor={`${role}-senha`}>Senha</label>
        <Link href="/recuperar-senha">Esqueci minha senha</Link>
      </div>
      <input
        id={`${role}-senha`}
        type="password"
        autoComplete="current-password"
        required
        value={senha}
        onChange={(event) => setSenha(event.target.value)}
        placeholder="Digite sua senha"
      />

      <button type="submit" disabled={carregando}>
        {carregando ? "Entrando..." : role === "paciente" ? "Continuar" : "Entrar no portal"}
      </button>
      <div className={styles.divider}><span>ou</span></div>
      <button type="button" className={styles.googleButton} onClick={loginComGoogle} disabled={carregando}>
        <GoogleIcon className={styles.googleIcon} />
        <span>Continuar com o Google</span>
      </button>
    </form>
  );

  return (
    <PatientPortal
      role={role}
      accessIntro={role === "medico" ? "Acesse com seu e-mail profissional cadastrado pela clínica." : undefined}
    >
      {loginForm}
    </PatientPortal>
  );
}