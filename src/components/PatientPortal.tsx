import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./PatientPortal.module.css";

type PatientPortalProps = {
  children: ReactNode;
  role?: "paciente" | "medico";
  accessTitle?: string;
  accessIntro?: string;
  accessLink?: { href: string; label: string };
};

export default function PatientPortal({
  children,
  role = "paciente",
  accessTitle = "Realizar login",
  accessIntro = "Acesse com seu e-mail cadastrado.",
  accessLink = { href: "/cadastro", label: "Me cadastrar" },
}: PatientPortalProps) {
  const isDoctor = role === "medico";
  const link = isDoctor ? { href: "/#contato", label: "Solicitar acesso à clínica" } : accessLink;
  return <div className={`${styles.page} ${isDoctor ? styles.doctorPage : ""}`}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="ClinicaFlow — página inicial">
        <img src="/fotos/logo-transparente.png" alt="" width="60" height="60" />
        <span>ClinicaFlow<small>Seu cuidado, sempre perto</small></span>
      </Link>
      <nav className={styles.nav} aria-label={isDoctor ? "Serviços do médico" : "Serviços do paciente"}>
        <Link href={isDoctor ? "/medico/pacientes" : "/paciente/historico"}>{isDoctor ? "Meus pacientes" : "Histórico de atendimentos"}</Link>
        <Link href={isDoctor ? "/medico" : "/paciente"}>Minha agenda</Link>
        <Link href="/#contato">Fale conosco</Link>
      </nav>
    </header>

    <main className={styles.main}>
      <div className={styles.photograph} aria-hidden="true" />
      <div className={styles.content}>
        <section className={styles.welcome} aria-labelledby="patient-welcome">
          <span className={styles.eyebrow}>{isDoctor ? "Portal do médico" : "Portal do paciente"}</span>
          <h1 id="patient-welcome">VOCÊ</h1>
          <p>{isDoctor ? "faz a diferença em cada cuidado." : "é a nossa primeira escolha."}</p>
          <span className={styles.caption}>{isDoctor ? "Sua agenda e seus pacientes, sempre por perto." : "Cuidado para cada fase da sua vida."}</span>
        </section>
        <section className={styles.access} aria-labelledby="patient-login-title">
          <div className={styles.card}>
            <h2 id="patient-login-title">{accessTitle}</h2>
            <p className={styles.intro}>{accessIntro}</p>
            {children}
          </div>
          <Link href={link.href} className={styles.register}>{link.label}</Link>
          <Link href="/" className={styles.back}>← Voltar para a página inicial</Link>
        </section>
      </div>
      <footer className={styles.footer}>© {new Date().getFullYear()} ClinicaFlow. Todos os direitos reservados.</footer>
    </main>
  </div>;
}
