import { createClient } from "@/lib/supabase/server";
import HomeCarousel from "@/components/HomeCarousel";
import ScrollReveal from "@/components/ScrollReveal";
import HomeHeader from "@/components/HomeHeader";
import PresentialCare from "@/components/PresentialCare";
import HomeFooter from "@/components/HomeFooter";
import DoctorSpace from "@/components/DoctorSpace";
import UnitsSection from "@/components/UnitsSection";
import SpecialtiesSection from "@/components/SpecialtiesSection";
import { HomeCareServices, HomeExams } from "@/components/HomeCareSections";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type HomeSpecialty = { id: string; nome: string; descricao: string | null };
type HomeUnit = { id: string; nome: string; endereco: string | null; cidade: string | null; telefone: string | null; horario_funcionamento: string | null };

const BENEFICIOS = [
  { icon: "◎", t: "Prontuário eletrônico", d: "Histórico clínico, evoluções e indicadores organizados por paciente." },
  { icon: "▤", t: "Agenda inteligente", d: "Visões diária, semanal e mensal com status de cada atendimento." },
  { icon: "⚕", t: "Atendimento humanizado", d: "Fluxos pensados para recepção, enfermagem e corpo clínico." },
  { icon: "◈", t: "Indicadores em tempo real", d: "Painéis conectados ao banco, sem números inventados." },
  { icon: "⛨", t: "Segurança por cargo", d: "Permissões aplicadas na interface e no banco com RLS." },
  { icon: "⌂", t: "Multiunidades", d: "Unidades, especialidades e equipes centralizadas." },
];

const UNIDADES_PARCEIRAS = [
  { nome: "Hospital Israelita Albert Einstein", imagem: "/fotos/unidade-einstein.svg" },
  { nome: "Hospital Sirio-Libanes", imagem: "/fotos/unidade-sirio-libanes.svg" },
  { nome: "Rede D'Or", imagem: "/fotos/unidade-rede-dor.svg" },
  { nome: "Fleury", imagem: "/fotos/unidade-fleury.svg" },
  { nome: "Sabin", imagem: "/fotos/unidade-sabin.svg" },
  { nome: "HCor", imagem: "/fotos/unidade-hcor.svg" },
  { nome: "Sao Luiz", imagem: "/fotos/unidade-sao-luiz.svg" },
  { nome: "Oswaldo Cruz", imagem: "/fotos/unidade-oswaldo-cruz.svg" },
  { nome: "Mater Dei", imagem: "/fotos/unidade-mater-dei.svg" },
  { nome: "Hermes Pardini", imagem: "/fotos/unidade-hermes-pardini.svg" },
];
const FAQ = [
  { q: "Como faço para agendar uma consulta?", a: "Crie sua conta na área do paciente, escolha a especialidade, o profissional e o horário disponível. O agendamento é gravado no banco em tempo real." },
  { q: "Preciso ir à unidade para cancelar?", a: "Não. Pelo painel do paciente você acompanha, remarca ou cancela consultas dentro das regras da unidade." },
  { q: "Quem pode ver meu prontuário?", a: "Apenas você e os profissionais autorizados. As permissões são aplicadas no banco de dados por políticas de segurança." },
  { q: "O ClinicxFlow atende empresas?", a: "Sim. Há atendimento empresarial com check-ups periódicos e relatórios consolidados para o RH." },
];

export default async function HomePage() {
  let especialidades: HomeSpecialty[] = [];
  let unidades: HomeUnit[] = [];

  try {
    const supabase = await createClient();
    const [specialtiesResult, unitsResult] = await Promise.all([
      supabase.from("especialidades").select("id, nome, descricao").eq("status", "ativo").order("nome").limit(9),
      supabase.from("unidades").select("id, nome, endereco, cidade, telefone, horario_funcionamento").eq("status", "ativo"),
    ]);
    especialidades = specialtiesResult.data ?? [];
    unidades = unitsResult.data ?? [];
  } catch (error) {
    console.error("Não foi possível carregar os dados públicos da clínica", error);
  }

  return (
    <>
      <HomeHeader />

      <HomeCarousel />

      <ScrollReveal>

      <section className={styles.partnersSection} aria-labelledby="unidades-parceiras">
        <div className="cx-container">
          <div className={styles.partnersIntro}>
            <span className={styles.eyebrow}>Rede de cuidado</span>
            <h2 id="unidades-parceiras">Unidades Parceiras</h2>
            <p>Conectamos você a instituições de saúde reconhecidas em todo o Brasil.</p>
          </div>
          <div className={styles.partnersViewport}>
            <div className={styles.partnersTrack}>
              {[0, 1].map((group) => (
                <div className={styles.partnersGroup} key={group} aria-hidden={group === 1}>
                  {UNIDADES_PARCEIRAS.map((unidade) => (
                    <div className={styles.partnerLogo} key={`${group}-${unidade.nome}`}>
                      <img src={unidade.imagem} alt={group === 0 ? unidade.nome : ""} loading="lazy" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HomeCareServices />

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="cx-container">
          <div className={styles.sectionHead}>
            <h2>Um sistema, todos os processos da unidade</h2>
            <p>Do primeiro contato ao acompanhamento clínico, tudo registrado e conectado.</p>
          </div>
          <div className={styles.grid3}>
            {BENEFICIOS.map((b) => (
              <article key={b.t} className={`cx-card ${styles.tile}`}>
                <div className={styles.tileIcon}>{b.icon}</div>
                <h3>{b.t}</h3>
                <p>{b.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SpecialtiesSection specialties={especialidades} />


      <HomeExams />

      <DoctorSpace />

      <UnitsSection units={unidades} />

      <section id="faq" className={styles.section}>
        <div className="cx-container">
          <div className={styles.sectionHead}>
            <h2>Perguntas frequentes</h2>
            <p>As dúvidas mais comuns de pacientes e equipes.</p>
          </div>
          {FAQ.map((f) => (
            <details key={f.q} className={`cx-card ${styles.faqItem}`}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <PresentialCare />
      </ScrollReveal>

      <HomeFooter />
    </>
  );
}



