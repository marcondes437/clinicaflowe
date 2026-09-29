import Link from "next/link";
import styles from "./DoctorSpace.module.css";

export default function DoctorSpace() {
  return (
    <section className={styles.section} aria-labelledby="doctor-space-title">
      <div className={`cx-container ${styles.composition}`}>
        <div className={styles.firstPhoto}>
          <img src="/fotos/ginecologia.jpg" alt="Médica orientando uma paciente durante a consulta" width="739" height="415" loading="lazy" />
        </div>
        <div className={styles.card}>
          <span className={styles.eyebrow}>Para quem cuida</span>
          <h2 id="doctor-space-title">Espaço médico<br />ClinicaFlow</h2>
          <p>Mais conexão para cuidar melhor. Acesse sua agenda, acompanhe seus pacientes e organize sua rotina em um só lugar.</p>
          <Link href="/portal-medico" className={styles.button}>
            Acessar área médica
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
          </Link>
        </div>
        <div className={styles.secondPhoto}>
          <img src="/fotos/clinicageral.jpg" alt="Médico recebendo uma paciente no consultório" width="739" height="415" loading="lazy" />
        </div>
      </div>
    </section>
  );
}
