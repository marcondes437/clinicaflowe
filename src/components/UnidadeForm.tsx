"use client";

import { useActionState } from "react";
import { criarUnidade } from "@/lib/actions";
import styles from "./FormCard.module.css";

const estado0 = {} as { ok?: string; erro?: string };

export default function UnidadeForm() {
  const [state, action, pending] = useActionState(criarUnidade, estado0);
  return (
    <form action={action} className={styles.form}>
      {state?.erro && <div className={`cx-alert cx-alert-error ${styles.full}`}>{state.erro}</div>}
      {state?.ok && <div className={`cx-alert cx-alert-ok ${styles.full}`}>{state.ok}</div>}
      <div className="cx-field"><label>Nome *</label><input name="nome" required /></div>
      <div className="cx-field"><label>Endereço</label><input name="endereco" /></div>
      <div className="cx-field"><label>Cidade</label><input name="cidade" /></div>
      <div className="cx-field"><label>Estado</label><input name="estado" maxLength={2} /></div>
      <div className="cx-field"><label>Telefone</label><input name="telefone" /></div>
      <div className="cx-field"><label>E-mail</label><input name="email" type="email" /></div>
      <div className="cx-field"><label>Horário de funcionamento</label><input name="horario_funcionamento" placeholder="Seg a Sex, 7h às 19h" /></div>
      <div className={styles.footer}>
        <button className="cx-btn cx-btn-primary" disabled={pending}>{pending ? "Salvando..." : "Cadastrar unidade"}</button>
      </div>
    </form>
  );
}
