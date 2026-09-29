import { dataHora } from "@/lib/format";
import StatusConsulta from "../StatusConsulta";
import styles from "./HistoricoTimeline.module.css";
import type { ConsultaRow } from "../ConsultasTable";

export default function HistoricoTimeline({ consultas }: { consultas: ConsultaRow[] }) {
  if (!consultas.length) {
    return <p className={styles.vazio}>Seu histórico aparece aqui depois da primeira consulta.</p>;
  }

  return (
    <ol className={styles.linha}>
      {consultas.map((c) => (
        <li key={c.id} className={styles.item}>
          <span className={styles.marcador} aria-hidden="true" />
          <div className={styles.conteudo}>
            <div className={styles.topo}>
              <span className={styles.data}>{dataHora(c.data_hora)}</span>
              <StatusConsulta id={c.id} status={c.status} disabled />
            </div>
            <p className={styles.medico}>
              {c.profissionais?.nome ?? "Profissional não informado"}
              {c.especialidades?.nome ? ` · ${c.especialidades.nome}` : ""}
            </p>
            {c.motivo && <p className={styles.motivo}>{c.motivo}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

