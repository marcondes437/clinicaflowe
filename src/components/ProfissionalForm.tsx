"use client";

import { useActionState } from "react";
import { criarProfissional } from "@/lib/actions";
import styles from "./FormCard.module.css";

type Opcao = { id: string; nome: string };
const estado0 = {} as { ok?: string; erro?: string };

export default function ProfissionalForm({ especialidades, unidades }: { especialidades: Opcao[]; unidades: Opcao[] }) {
  const [state, action, pending] = useActionState(criarProfissional, estado0);

  return (
    <form action={action} className={styles.form}>
      {state?.erro && <div className={`cx-alert cx-alert-error ${styles.full}`}>{state.erro}</div>}
      {state?.ok && <div className={`cx-alert cx-alert-ok ${styles.full}`}>{state.ok}</div>}
      <div className="cx-field"><label>Nome *</label><input name="nome" required /></div>
      <div className="cx-field"><label>Registro profissional</label><input name="registro_profissional" placeholder="CRM / COREN / CRO" /></div>
      <div className="cx-field">
        <label>Especialidade</label>
        <select name="especialidade_id" defaultValue=""><option value="">Selecione</option>
          {especialidades.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </div>
      <div className="cx-field">
        <label>Unidade</label>
        <select name="unidade_id" defaultValue=""><option value="">Selecione</option>
          {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
      </div>
      <div className="cx-field"><label>Telefone</label><input name="telefone" /></div>
      <div className="cx-field"><label>E-mail</label><input name="email" type="email" /></div>
      <div className="cx-field"><label>ID da conta do médico (Supabase Auth)</label><input name="user_id" placeholder="UUID da conta já cadastrada" pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" /></div>
      <div className={`cx-field ${styles.full}`}><label>Descrição profissional</label><textarea name="descricao" rows={2} /></div>
      <div className={styles.footer}>
        <button className="cx-btn cx-btn-primary" disabled={pending}>{pending ? "Salvando..." : "Cadastrar profissional"}</button>
      </div>
    </form>
  );
}
