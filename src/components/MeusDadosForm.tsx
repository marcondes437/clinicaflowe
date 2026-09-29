"use client";

import { useActionState } from "react";
import Link from "next/link";
import { salvarMeusDados } from "@/lib/actions";
import styles from "./FormCard.module.css";

const campos = [
  ["nome_completo", "Nome completo", "text"],
  ["data_nascimento", "Data de nascimento", "date"],
  ["celular", "Celular", "tel"],
  ["cpf", "CPF", "text"], ["cep", "CEP", "text"],
  ["endereco", "Endereço", "text"], ["cidade", "Cidade", "text"],
  ["estado", "Estado (UF)", "text"],
  ["contato_emergencia", "Contato de emergência", "text"],
  ["tipo_sanguineo", "Tipo sanguíneo", "text"],
  ["alergias", "Alergias", "text"],
  ["doencas", "Doenças ou condições de saúde", "text"],
  ["deficiencias", "Deficiências ou necessidades de acessibilidade", "text"],
] as const;

export default function MeusDadosForm({ dados, continuar = "/paciente" }: { dados: Record<string, string | null>; continuar?: string }) {
  const [state, action, pending] = useActionState(salvarMeusDados, {} as { erro?: string; ok?: string });
  return <form action={action} className={styles.form}>
    {state.erro && <p className="cx-alert cx-alert-error" role="alert">{state.erro}</p>}
    {state.ok && <p className="cx-alert cx-alert-ok" role="status">{state.ok}</p>}
    {state.ok && <Link href={continuar} className="cx-btn cx-btn-primary">Continuar para {continuar === "/paciente/agendar" ? "o agendamento" : "meu painel"}</Link>}
    {campos.map(([name, label, type]) => <div className="cx-field" key={name}>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={dados[name] ?? ""} required={["nome_completo", "celular", "data_nascimento"].includes(name)} maxLength={name === "estado" ? 2 : undefined} />
    </div>)}
    <div className={styles.footer}><button className="cx-btn cx-btn-primary" disabled={pending}>{pending ? "Salvando..." : "Salvar meus dados"}</button></div>
  </form>;
}
