import Link from "next/link";
import styles from "./AgendamentoOnlineForm.module.css";

export default function AgendamentoOnlineForm() {
  return (
    <div className={styles.form}>
      <div className={styles.grid}>
        <div className={styles.field}>
          <strong>1. Entre ou crie sua conta</strong>
          <span>O cadastro pede somente nome, e-mail e senha.</span>
        </div>
        <div className={styles.field}>
          <strong>2. Escolha a especialidade</strong>
          <span>Selecione também a unidade e um horário disponível.</span>
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <strong>3. Veja o profissional confirmado</strong>
          <span>O sistema encontra automaticamente um médico livre e mostra o nome após o agendamento.</span>
        </div>
      </div>
      <p className={styles.note}>Se você já possui conta, entre para acessar seus dados salvos.</p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/portal-paciente?redirect=/paciente/agendar" className="cx-btn cx-btn-primary">Entrar e agendar</Link>
        <Link href="/cadastro?redirect=/paciente/agendar" className="cx-btn cx-btn-ghost">Criar conta</Link>
      </div>
    </div>
  );
}
