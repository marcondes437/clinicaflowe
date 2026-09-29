"use client";

import { useState, type FormEvent } from "react";
import { registerPresentialInterest } from "@/app/atendimento-presencial/actions";
import styles from "./PresentialCare.module.css";

export default function PresentialCare() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");
    try {
      const result = await registerPresentialInterest(formData);
      setMessage(result.message);
      if (result.success) { setName(""); setEmail(""); }
    } catch {
      setMessage("Não foi possível enviar. Verifique sua conexão e tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="contato" className={styles.section} aria-labelledby="presential-title">
      <div className="cx-container">
        <div className={styles.grid}>
          <form className={styles.form} onSubmit={handleSubmit} aria-busy={pending}>
            <input type="hidden" name="consent" value="true" />
            <div className={styles.heading}>
              <span className={styles.icon} aria-hidden="true">
                <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 15 13-11 13 11M7 12v15h18V12M22 9V5h4v8" /><path d="M14 13h4v4h4v4h-4v4h-4v-4h-4v-4h4z" /></svg>
              </span>
              <div><h2 id="presential-title">Atendimento presencial</h2><p>Seja notificado quando uma especialidade chegar à sua cidade.</p></div>
            </div>
            <div className={styles.field}>
              <label htmlFor="presential-name">Nome</label>
              <input id="presential-name" name="name" autoComplete="name" placeholder="Digite seu nome" required minLength={2} maxLength={120} disabled={pending} value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="presential-email">E-mail</label>
              <input id="presential-email" name="email" type="email" autoComplete="email" placeholder="Digite seu endereço de e-mail" required maxLength={254} disabled={pending} value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <p className={styles.consent}>Ao clicar em <strong>Enviar</strong>, você aceita receber novidades da ClinicaFlow.</p>
            <button className={styles.submit} type="submit" disabled={pending || name.trim().length < 2 || !email.trim()}>{pending ? "Enviando…" : "Enviar"}</button>
            <p className={styles.message} role="status">{message}</p>
          </form>
          <div className={styles.portrait}>
            <img src="/fotos/ginecologia.jpg" alt="Médica acolhendo uma paciente durante atendimento presencial" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
}
