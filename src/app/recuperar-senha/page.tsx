"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "../login/auth.module.css";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/nova-senha`,
    });
    if (error) setErro(error.message);
    else setMsg("Se o e-mail existir, enviamos um link para redefinir a senha.");
  }

  return (
    <div className={styles.wrap}>
      <aside className={styles.side}>
        <Link href="/" className={styles.brand}><span className={styles.brandMark}>✚</span> ClinicxFlow</Link>
        <div>
          <h2>Recupere seu acesso com segurança.</h2>
          <p>Enviamos um link temporário para o e-mail cadastrado.</p>
        </div>
        <span />
      </aside>
      <main className={styles.panel}>
        <form className={styles.form} onSubmit={onSubmit}>
          <h1>Recuperar senha</h1>
          <p className={styles.sub}>Informe o e-mail usado no cadastro.</p>
          {erro && <div className="cx-alert cx-alert-error">{erro}</div>}
          {msg && <div className="cx-alert cx-alert-ok">{msg}</div>}
          <div className="cx-field">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className={`cx-btn cx-btn-primary ${styles.full}`}>Enviar link</button>
          <div className={styles.links}>
            <Link href="/portal-paciente">Voltar ao login</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
