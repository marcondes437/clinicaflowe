import Link from "next/link";
import styles from "./HomeCareSections.module.css";

type IconKind = "cross" | "exam" | "heart" | "calendar";
function CareIcon({ kind }: { kind: IconKind }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "cross" && <path d="M12 5h8v7h7v8h-7v7h-8v-7H5v-8h7Z" />}
    {kind === "exam" && <><path d="M12 4h8m-6 0v10L6 25a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3l-8-11V4M10 20h12" /><path d="M14 24h4" /></>}
    {kind === "heart" && <><path d="M16 27S4 20 4 11a6 6 0 0 1 12-1 6 6 0 0 1 12 1c0 9-12 16-12 16Z" /><path d="M8 16h5l2-4 3 8 2-4h4" /></>}
    {kind === "calendar" && <><rect x="5" y="7" width="22" height="21" rx="2" /><path d="M11 4v6m10-6v6M5 14h22m-16 7 3 3 7-7" /></>}
  </svg>;
}
function Arrow() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5" /></svg>;
}

const services: { icon: IconKind; title: string; description: string; href: string; action: string }[] = [
  { icon: "cross", title: "Pronto atendimento", description: "Confira quais unidades oferecem o serviço e os horários de atendimento.", href: "/procurar-clinica", action: "Encontrar uma unidade" },
  { icon: "exam", title: "Exames", description: "Veja os exames e fale com a unidade para saber sobre preparo e agendamento.", href: "#exames", action: "Consultar exames" },
  { icon: "heart", title: "Cardiologia", description: "Procura um cardiologista? Consulte as opções de agendamento.", href: "/agendamento-online", action: "Agendar uma consulta" },
  { icon: "calendar", title: "Check-up", description: "Conheça as opções para suas consultas e exames de rotina.", href: "#checkups", action: "Conhecer os check-ups" },
];
const checkups = [
  { title: "Check-up essencial", description: "Consulta clínica e exames de rotina." },
  { title: "Check-up cardíaco", description: "Consulta com cardiologista e avaliação dos exames necessários." },
  { title: "Saúde da mulher", description: "Consulta ginecológica e acompanhamento de rotina." },
];
const exams = ["Hemograma completo", "Eletrocardiograma", "Raio-X", "Ultrassonografia", "Teste ergométrico", "Exames laboratoriais"];

export function HomeCareServices() {
  return <section className={styles.services} aria-labelledby="care-title">
    <div className="cx-container">
      <div className={styles.heading}>
        <div><span className={styles.label}>Consultas e atendimento</span><h2 id="care-title">Como podemos te ajudar hoje?</h2></div>
        <p>Encontre o serviço que você procura.</p>
      </div>
      <div className={styles.serviceGrid}>
        {services.map(service => <article className={styles.service} key={service.title}>
          <div className={styles.icon}><CareIcon kind={service.icon} /></div>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
          <Link href={service.href}>{service.action}<Arrow /></Link>
        </article>)}
      </div>
    </div>
  </section>;
}

export function HomeExams() {
  return <section id="exames" className={styles.exams} aria-labelledby="exams-title">
    <div className="cx-container">
      <div className={styles.heading}>
        <div><span className={styles.label}>Exames e prevenção</span><h2 id="exams-title">Vai fazer seus exames?</h2></div>
        <p>Consulte as opções abaixo. A unidade informa os horários, os valores e o preparo.</p>
      </div>
      <div className={styles.examLayout}>
        <div id="checkups" className={styles.checkups}>
          <h3>Check-ups</h3>
          <p className={styles.intro}>Uma consulta é o primeiro passo para organizar seus exames de rotina.</p>
          <div className={styles.checkupList}>
            {checkups.map(checkup => <article key={checkup.title}>
              <h4>{checkup.title}</h4><p>{checkup.description}</p>
            </article>)}
          </div>
          <Link className={styles.action} href="/agendamento-online">Agendar uma consulta<Arrow /></Link>
        </div>
        <div className={styles.examDirectory}>
          <h3>Exames</h3>
          <ul className={styles.examList}>
            {exams.map(exam => <li key={exam}>{exam}</li>)}
          </ul>
          <div className={styles.examContact}>
            <p>Já tem um pedido de exame? Fale com a unidade para confirmar a disponibilidade e agendar.</p>
            <Link className={styles.action} href="/procurar-clinica">Ver unidades e contatos<Arrow /></Link>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
