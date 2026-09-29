"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { criarConsulta } from "@/lib/actions";
import styles from "./FormCard.module.css";

type Opcao = { id: string; nome: string };
type Horario = {
  especialidade_id: string;
  unidade_id: string;
  data_hora: string;
  vagas: number;
};
const estado0 = {} as { ok?: string; erro?: string };

export default function ConsultaForm({
  pacientes,
  especialidades,
  unidades,
  horarios,
  pacienteFixo,
}: {
  pacientes?: Opcao[];
  especialidades: Opcao[];
  unidades: Opcao[];
  horarios: Horario[];
  pacienteFixo?: string;
}) {
  const [state, action, pending] = useActionState(criarConsulta, estado0);
  const [especialidade, setEspecialidade] = useState("");
  const [unidade, setUnidade] = useState("");

  const unidadesDisponiveis = useMemo(() => {
    const ids = new Set(
      horarios
        .filter((h) => !especialidade || h.especialidade_id === especialidade)
        .map((h) => h.unidade_id)
    );
    return unidades.filter((item) => ids.has(item.id));
  }, [especialidade, horarios, unidades]);

  const horariosDisponiveis = useMemo(
    () =>
      horarios.filter(
        (h) => h.especialidade_id === especialidade && h.unidade_id === unidade
      ),
    [especialidade, horarios, unidade]
  );

  if (state.ok) return <div>
    <p className="cx-alert cx-alert-ok" role="status">{state.ok}</p>
    {pacienteFixo && <Link href="/paciente" className="cx-btn cx-btn-primary">Ver minha consulta</Link>}
    <button type="button" className="cx-btn cx-btn-ghost" onClick={() => window.location.reload()}>Agendar outra consulta</button>
  </div>;

  return (
    <form action={action} className={styles.form}>
      {state?.erro && <div className={`cx-alert cx-alert-error ${styles.full}`} role="alert">{state.erro}</div>}

      {pacienteFixo ? (
        <input type="hidden" name="paciente_id" value={pacienteFixo} />
      ) : (
        <div className="cx-field">
          <label>Paciente *</label>
          <select name="paciente_id" required defaultValue="">
            <option value="" disabled>Selecione</option>
            {(pacientes ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
      )}

      <div className="cx-field">
        <label htmlFor="consulta-especialidade">Especialidade *</label>
        <select
          id="consulta-especialidade"
          name="especialidade_id"
          required
          value={especialidade}
          onChange={(event) => {
            setEspecialidade(event.target.value);
            setUnidade("");
          }}
        >
          <option value="">Selecione a especialidade</option>
          {especialidades.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </div>

      <div className="cx-field">
        <label htmlFor="consulta-unidade">Unidade *</label>
        <select
          id="consulta-unidade"
          name="unidade_id"
          required
          value={unidade}
          onChange={(event) => setUnidade(event.target.value)}
          disabled={!especialidade}
        >
          <option value="">Selecione a unidade</option>
          {unidadesDisponiveis.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
      </div>

      <div className="cx-field">
        <label htmlFor="consulta-horario">Horário disponível *</label>
        <select id="consulta-horario" name="data_hora" required defaultValue="" key={`${especialidade}:${unidade}`} disabled={!unidade}>
          <option value="">Selecione o horário</option>
          {horariosDisponiveis.map((h) => (
            <option key={h.data_hora} value={h.data_hora}>
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "America/Sao_Paulo",
              }).format(new Date(h.data_hora))}
              {h.vagas > 1 ? ` · ${h.vagas} vagas` : ""}
            </option>
          ))}
        </select>
      </div>

      <p className={styles.full} style={{ color: "var(--cx-muted)", margin: 0 }}>
        Você escolhe a especialidade e um horário disponível na agenda médica (Brasília). O médico é atribuído automaticamente e seu nome aparece somente após a confirmação.
      </p>

      <div className={`cx-field ${styles.full}`}>
        <label>Motivo / queixa</label>
        <input name="motivo" placeholder="Ex.: consulta de rotina" />
      </div>

      {especialidade && unidadesDisponiveis.length === 0 && <p className={styles.full} role="status">Nenhum horário disponível para esta especialidade no momento.</p>}
      <div className={styles.footer}>
        <button className="cx-btn cx-btn-primary" disabled={pending || horariosDisponiveis.length === 0}>
          {pending ? "Agendando..." : "Agendar consulta"}
        </button>
      </div>
    </form>
  );
}
