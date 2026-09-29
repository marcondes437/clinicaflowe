"use client";

import { useActionState } from "react";
import { criarEspecialidade } from "@/lib/actions";
import styles from "./FormCard.module.css";

const estado0 = {} as { ok?: string; erro?: string };

export default function EspecialidadeForm() {
  const [state, action, pending] = useActionState(criarEspecialidade, estado0);
  return (
    <form action={action} className={styles.form}>
      {state?.erro && <div className={`cx-alert cx-alert-error ${styles.full}`}>{state.erro}</div>}
      {state?.ok && <div className={`cx-alert cx-alert-ok ${styles.full}`}>{state.ok}</div>}
      <div className="cx-field"><label>Nome *</label><input name="nome" required /></div>
      <div className="cx-field"><label>Descrição</label><input name="descricao" /></div>
      <div className={styles.footer}>
        <button className="cx-btn cx-btn-primary" disabled={pending}>{pending ? "Salvando..." : "Adicionar especialidade"}</button>
      </div>
    </form>
  );
}
