# Script gerado para criar/atualizar os arquivos do redesign da area do paciente
# Rode este script DENTRO da pasta do projeto (clinica2-main\clinica2-main)
$ErrorActionPreference = 'Stop'

New-Item -ItemType Directory -Force -Path "src\components\paciente" | Out-Null
@'
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

'@ | Set-Content -Path "src\components\paciente\ConsultaTicket.tsx" -Encoding UTF8
Write-Host "Criado: src\components\paciente\ConsultaTicket.tsx"

New-Item -ItemType Directory -Force -Path "src\components\paciente" | Out-Null
@'
.ticket {
  display: grid;
  grid-template-columns: 1fr auto;
  background: #fffdf9;
  border: 1px solid var(--cx-line);
  border-radius: 18px;
  box-shadow: var(--cx-shadow);
  margin-bottom: 1.6rem;
  overflow: hidden;
}

.corpo { padding: 1.6rem 1.8rem; }

.eyebrow {
  font-size: 0.78rem;
  color: var(--cx-ocre, #c98a3e);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.linha { margin: 0.5rem 0 0.9rem; }

.dataGrande {
  font-family: "Georgia", "Source Serif 4", serif;
  font-size: 2.1rem;
  font-weight: 600;
  color: var(--cx-teal-900);
  margin-right: 0.6rem;
}

.hora {
  font-size: 1.2rem;
  color: var(--cx-muted);
}

.medico {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--cx-ink);
  margin: 0 0 0.2rem;
}

.especialidade {
  font-size: 0.9rem;
  color: var(--cx-muted);
  margin: 0;
}

.picote {
  border-left: 2px dashed var(--cx-line);
  position: relative;
}
.picote::before, .picote::after {
  content: "";
  position: absolute;
  left: -9px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--cx-bg);
}
.picote::before { top: -9px; }
.picote::after { bottom: -9px; }

.canhoto {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.6rem;
}

.vazio {
  background: #fffdf9;
  border: 1px dashed var(--cx-line);
  border-radius: 18px;
  padding: 2.4rem 2rem;
  text-align: center;
  margin-bottom: 1.6rem;
}
.vazioTitulo { font-size: 1.15rem; font-weight: 700; color: var(--cx-teal-900); margin: 0 0 0.35rem; }
.vazioTexto { color: var(--cx-muted); margin: 0 0 1.1rem; }

@media (max-width: 640px) {
  .ticket { grid-template-columns: 1fr; }
  .picote { border-left: none; border-top: 2px dashed var(--cx-line); }
  .picote::before, .picote::after { left: 50%; transform: translateX(-50%); }
  .picote::before { top: -9px; }
  .picote::after { bottom: -9px; }
}

'@ | Set-Content -Path "src\components\paciente\ConsultaTicket.module.css" -Encoding UTF8
Write-Host "Criado: src\components\paciente\ConsultaTicket.module.css"

New-Item -ItemType Directory -Force -Path "src\components\paciente" | Out-Null
@'
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

'@ | Set-Content -Path "src\components\paciente\HistoricoTimeline.tsx" -Encoding UTF8
Write-Host "Criado: src\components\paciente\HistoricoTimeline.tsx"

New-Item -ItemType Directory -Force -Path "src\components\paciente" | Out-Null
@'
.linha {
  list-style: none;
  margin: 0;
  padding: 0;
  border-left: 2px solid var(--cx-line);
}

.item {
  position: relative;
  padding: 0 0 1.4rem 1.4rem;
}
.item:last-child { padding-bottom: 0; }

.marcador {
  position: absolute;
  left: -7px;
  top: 0.35rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--cx-teal-500);
  border: 2px solid #fffdf9;
}

.topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.data { font-size: 0.85rem; color: var(--cx-muted); font-weight: 600; }

.medico { margin: 0.3rem 0 0; font-weight: 600; color: var(--cx-ink); }

.motivo { margin: 0.15rem 0 0; font-size: 0.88rem; color: var(--cx-muted); }

.vazio { color: var(--cx-muted); }

'@ | Set-Content -Path "src\components\paciente\HistoricoTimeline.module.css" -Encoding UTF8
Write-Host "Criado: src\components\paciente\HistoricoTimeline.module.css"

New-Item -ItemType Directory -Force -Path "src\app\paciente" | Out-Null
@'
import Link from "next/link";
import ConsultaTicket from "@/components/paciente/ConsultaTicket";
import HistoricoTimeline from "@/components/paciente/HistoricoTimeline";
import Panel from "@/components/Panel";
import { type ConsultaRow } from "@/components/ConsultasTable";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CONSULTA_SELECT } from "@/lib/queries";
import { getPacienteDoUsuario } from "@/lib/paciente";
import styles from "./painel.module.css";

export const dynamic = "force-dynamic";

export default async function PainelPaciente() {
  const user = await requireRole(["paciente"]);
  const paciente = await getPacienteDoUsuario(user.id);
  const supabase = await createClient();

  const agora = new Date().toISOString();
  const { data: proximas } = paciente
    ? await supabase.from("consultas").select(CONSULTA_SELECT).eq("paciente_id", paciente.id).gte("data_hora", agora).order("data_hora")
    : { data: [] };
  const { data: anteriores } = paciente
    ? await supabase.from("consultas").select(CONSULTA_SELECT).eq("paciente_id", paciente.id).lt("data_hora", agora).order("data_hora", { ascending: false }).limit(10)
    : { data: [] };

  const proximasLista = (proximas ?? []) as unknown as ConsultaRow[];
  const anterioresLista = (anteriores ?? []) as unknown as ConsultaRow[];
  const realizadas = anterioresLista.filter((c) => c.status === "concluida").length;

  return (
    <>
      <ConsultaTicket consulta={proximasLista[0] ?? null} />

      <div className={styles.resumo}>
        <span>{realizadas} atendimento{realizadas === 1 ? "" : "s"} realizado{realizadas === 1 ? "" : "s"}</span>
        <span className={styles.ponto} aria-hidden="true">·</span>
        <span>Cadastro: {paciente?.nome_completo ?? user.nome}</span>
        {proximasLista.length > 1 && (
          <>
            <span className={styles.ponto} aria-hidden="true">·</span>
            <span>+{proximasLista.length - 1} outra{proximasLista.length - 1 === 1 ? "" : "s"} consulta{proximasLista.length - 1 === 1 ? "" : "s"} marcada{proximasLista.length - 1 === 1 ? "" : "s"}</span>
          </>
        )}
      </div>

      <Panel
        titulo="Histórico"
        descricao="Suas consultas anteriores, mais recentes primeiro."
        acao={<Link href="/paciente/agendar" className="cx-btn cx-btn-ghost">Agendar outra</Link>}
      >
        <HistoricoTimeline consultas={anterioresLista} />
      </Panel>
    </>
  );
}

'@ | Set-Content -Path "src\app\paciente\page.tsx" -Encoding UTF8
Write-Host "Criado: src\app\paciente\page.tsx"

New-Item -ItemType Directory -Force -Path "src\app\paciente" | Out-Null
@'
.resumo {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  color: var(--cx-muted);
  font-size: 0.9rem;
  margin-bottom: 1.6rem;
}

.ponto { color: var(--cx-line); }

'@ | Set-Content -Path "src\app\paciente\painel.module.css" -Encoding UTF8
Write-Host "Criado: src\app\paciente\painel.module.css"

Write-Host ''
Write-Host 'Concluido! Agora adicione a linha --cx-ocre: #c98a3e; no :root do src/app/globals.css manualmente.'