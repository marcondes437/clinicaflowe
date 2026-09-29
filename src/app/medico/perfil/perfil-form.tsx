"use client";
import { useActionState } from "react";
import { salvarPerfilMedico } from "@/lib/actions";
export default function PerfilForm({ telefone, horario }: {telefone:string; horario:string}) {
  const [state, action, pending] = useActionState(salvarPerfilMedico, {} as {erro?:string;ok?:string});
  return <form action={action} className="cx-grid">
    <label className="cx-field">Telefone<input name="telefone" defaultValue={telefone}/></label>
    <label className="cx-field">Horário de trabalho<input name="horario_trabalho" defaultValue={horario}/></label>
    {state.erro && <p role="alert">{state.erro}</p>}{state.ok && <p role="status">{state.ok}</p>}
    <button className="cx-btn cx-btn-primary" disabled={pending}>Salvar perfil</button>
  </form>;
}
