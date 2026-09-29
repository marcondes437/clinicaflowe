import Link from "next/link";
import AgendamentoOnlineForm from "@/components/AgendamentoOnlineForm";
import styles from "./page.module.css";

export default function AgendamentoOnlinePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <img src="/fotos/logo-transparente.png" alt="ClinicaFlow" />
          <span>ClinicaFlow</span>
        </Link>
        <Link href="/" className={styles.back}>Voltar para a home</Link>
      </header>

      <section className={styles.content}>
        <div className={styles.intro}>
          <span>Agendamento online</span>
          <h1>Agende pela especialidade</h1>
          <p>Você escolhe o tipo de atendimento e o horário. O sistema encontra o médico disponível.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Como funciona</h2>
            <p>Um fluxo simples e sem precisar escolher o profissional.</p>
          </div>
          <AgendamentoOnlineForm />
        </div>
      </section>
    </main>
  );
}
