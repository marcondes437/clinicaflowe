import Link from "next/link";
import { dataHora } from "@/lib/format";
import styles from "./ConsultaTicket.module.css";
import type { ConsultaRow } from "../ConsultasTable";

export default function ConsultaTicket({ consulta }: { consulta: ConsultaRow | null }) {
  if (!consulta) {
    return (
      <div className={styles.vazio}>
        <p className={styles.vazioTitulo}>Nenhuma consulta agendada</p>
        <p className={styles.vazioTexto}>Que tal marcar a primeira? Leva menos de um minuto.</p>
        <Link href="/paciente/agendar" className="cx-btn cx-btn-accent">
          Agendar consulta
        </Link>
      </div>
    );
  }

  const [data, hora] = dataHora(consulta.data_hora).split(" ");

  return (
    <div className={styles.ticket}>
      <div className={styles.corpo}>
        <span className={styles.eyebrow}>Próxima consulta</span>
        <div className={styles.linha}>
          <div>
            <span className={styles.dataGrande}>{data}</span>
            <span className={styles.hora}>{hora}</span>
          </div>
        </div>
        <p className={styles.medico}>{consulta.profissionais?.nome ?? "Profissional a definir"}</p>
        <p className={styles.especialidade}>
          {consulta.especialidades?.nome} · {consulta.unidades?.nome}
        </p>
      </div>
      <div className={styles.picote} aria-hidden="true" />
      <div className={styles.canhoto}>
        <Link href="/paciente/agendar" className="cx-btn cx-btn-ghost">
          Reagendar
        </Link>
      </div>
    </div>
  );
}

