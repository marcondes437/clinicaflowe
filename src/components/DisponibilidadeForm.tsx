"use client";

import { useActionState } from "react";
import { criarDisponibilidade } from "@/lib/actions";
import styles from "./FormCard.module.css";

type Opcao = { id: string; nome: string };
const estadoInicial = {} as { ok?: string; erro?: string };

export default function DisponibilidadeForm({ profissionais }: { profissionais: Opcao[] }) {
  const [state, action, pending] = useActionState(criarDisponibilidade, estadoInicial);

  return (
    <form action={action} className={styles.form}>
      {state.erro && <div className={`cx-alert cx-alert-error ${styles.full}`}>{state.erro}</div>}
      {state.ok && <div className={`cx-alert cx-alert-ok ${styles.full}`}>{state.ok}</div>}

      <div className="cx-field">
        <label>Profissional *</label>
        <select name="profissional_id" required defaultValue="">
          <option value="" disabled>Selecione</option>
          {profissionais.map((profissional) => (
            <option key={profissional.id} value={profissional.id}>{profissional.nome}</option>
          ))}
        </select>
      </div>

      <div className="cx-field">
        <label>Data e horário disponíveis *</label>
        <input name="data_hora" type="datetime-local" required />
      </div>

      <div className={styles.footer}>
        <button className="cx-btn cx-btn-primary" disabled={pending || profissionais.length === 0}>
          {pending ? "Salvando..." : "Liberar horário"}
        </button>
      </div>
    </form>
  );
}
