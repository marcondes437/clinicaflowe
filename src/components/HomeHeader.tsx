"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./HomeHeader.module.css";

export default function HomeHeader() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const handleScroll = () => setCompact(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${compact ? styles.compact : ""}`}>
      <div className={styles.topBar}>
        <div className={styles.container}>
          <nav className={styles.topNav} aria-label="Navegação institucional">
            <Link href="/sobre" className={styles.institutional}>Institucional</Link>
            <Link href="/portal-paciente">Pacientes</Link>
            <Link href="/portal-medico">Corpo clínico</Link>
            <a href="/#unidades">Nossas unidades</a>
            <a href="/#faq">Dúvidas frequentes</a>
          </nav>
          <Link href="/agendamento-online" className={styles.topAction}>Agendamento online <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
      <div className={`${styles.container} ${styles.mainBar}`}>
        <Link href="/" className={styles.logo} aria-label="ClinicaFlow — página inicial">
          <img src="/fotos/logo-transparente.png" alt="ClinicaFlow" width="174" height="66" />
        </Link>
        <nav className={styles.nav} aria-label="Navegação principal">
          <Link href="/sobre">A clínica</Link>
          <Link href="/procurar-clinica">Serviços médicos</Link>
          <a href="/#especialidades">Especialidades</a>
          <a href="/#exames">Exames</a>
          <a href="/#contato">Fale conosco</a>
        </nav>
        <div className={styles.actions}>
          <form action="/procurar-clinica" method="get" className={styles.search} role="search">
            <button type="submit" aria-label="Pesquisar clínica">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></svg>
            </button>
            <input name="busca" type="search" placeholder="Pesquisar" aria-label="Pesquisar clínica" />
          </form>
          <Link href="/portal-paciente" className={styles.patient}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="7" r="3.5" /><path d="M5 20v-2a7 7 0 0 1 14 0v2a20 20 0 0 1-14 0Z" /></svg>
            Área do paciente
          </Link>
        </div>
      </div>
    </header>
  );
}
