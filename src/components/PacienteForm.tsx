"use client";

import { useActionState } from "react";
import { criarPaciente } from "@/lib/actions";
import styles from "./FormCard.module.css";

const estado0 = {} as { ok?: string; erro?: string };

export default function PacienteForm() {
  const [state, action, pending] = useActionState(criarPaciente, estado0);

  return (
    <form action={action} className={styles.form}>
      {state?.erro && <div className={`cx-alert cx-alert-error ${styles.full}`}>{state.erro}</div>}
      {state?.ok && <div className={`cx-alert cx-alert-ok ${styles.full}`}>{state.ok}</div>}

      <div className="cx-field"><label>Nome completo *</label><input name="nome_completo" required /></div>
      <div className="cx-field"><label>CPF</label><input name="cpf" placeholder="000.000.000-00" /></div>
      <div className="cx-field"><label>Data de nascimento</label><input name="data_nascimento" type="date" /></div>
      <div className="cx-field"><label>Telefone</label><input name="telefone" /></div>
      <div className="cx-field"><label>Celular</label><input name="celular" /></div>
      <div className="cx-field"><label>E-mail</label><input name="email" type="email" /></div>
      <div className="cx-field"><label>Endereço</label><input name="endereco" /></div>
      <div className="cx-field"><label>Cidade</label><input name="cidade" /></div>
      <div className="cx-field"><label>Estado</label><input name="estado" maxLength={2} /></div>
      <div className="cx-field"><label>CEP</label><input name="cep" /></div>
      <div className="cx-field"><label>Contato de emergência</label><input name="contato_emergencia" /></div>
      <div className={`cx-field ${styles.full}`}><label>Observações</label><textarea name="observacoes" rows={3} /></div>

      <div className={styles.footer}>
        <button className="cx-btn cx-btn-primary" disabled={pending}>
          {pending ? "Salvando..." : "Cadastrar paciente"}
        </button>
      </div>
    </form>
  );
}
