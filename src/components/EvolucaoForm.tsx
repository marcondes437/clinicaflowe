"use client";

import { useActionState } from "react";
import { registrarEvolucao } from "@/lib/actions";

const estado0 = {} as { ok?: string; erro?: string };

export default function EvolucaoForm({ pacienteId, consultaId }: { pacienteId: string; consultaId?: string }) {
  const [state, action, pending] = useActionState(registrarEvolucao, estado0);

  return (
    <form action={action} style={{ marginTop: "1rem" }}>
      {state?.erro && <div className="cx-alert cx-alert-error">{state.erro}</div>}
      {state?.ok && <div className="cx-alert cx-alert-ok">{state.ok}</div>}
      <input type="hidden" name="paciente_id" value={pacienteId} />
      {consultaId && <input type="hidden" name="consulta_id" value={consultaId} />}
      <div className="cx-field">
        <label>Nova evolução</label>
        <textarea name="descricao" rows={3} required placeholder="Descreva o atendimento, conduta e orientações." />
      </div>
      <button className="cx-btn cx-btn-primary" disabled={pending}>
        {pending ? "Registrando..." : "Registrar evolução"}
      </button>
    </form>
  );
}
