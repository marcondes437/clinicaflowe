"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../login/auth.module.css";

export default function NovaSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) setErro(error.message);
    else {
      await supabase.auth.signOut();
      router.replace("/portal-paciente?senha=alterada");
      router.refresh();
    }
  }

  return (
    <div className={styles.wrap}>
      <aside className={styles.side}>
        <span className={styles.brand}><span className={styles.brandMark}>✚</span> ClinicxFlow</span>
        <div><h2>Defina uma nova senha.</h2></div>
        <span />
      </aside>
      <main className={styles.panel}>
        <form className={styles.form} onSubmit={onSubmit}>
          <h1>Nova senha</h1>
          {erro && <div className="cx-alert cx-alert-error">{erro}</div>}
          <div className="cx-field">
            <label htmlFor="senha">Nova senha</label>
            <input id="senha" type="password" minLength={6} required value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          <button className={`cx-btn cx-btn-primary ${styles.full}`}>Salvar</button>
        </form>
      </main>
    </div>
  );
}
