"use client";

import { alterarStatusConsulta } from "@/lib/actions";
import { STATUS_CONSULTA_LABEL } from "@/lib/roles";

const OPCOES = Object.keys(STATUS_CONSULTA_LABEL);

export default function StatusConsulta({
  id,
  status,
  disabled,
}: {
  id: string;
  status: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return <span className="cx-badge">{STATUS_CONSULTA_LABEL[status]}</span>;
  }

  return (
    <form action={alterarStatusConsulta}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        style={{ padding: "0.35rem 0.5rem", borderRadius: 8, border: "1px solid var(--cx-line)" }}
      >
        {OPCOES.map((s) => (
          <option key={s} value={s}>{STATUS_CONSULTA_LABEL[s]}</option>
        ))}
      </select>
    </form>
  );
}
