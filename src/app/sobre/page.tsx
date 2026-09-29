import Link from "next/link";
import styles from "./page.module.css";

const VALORES = [
  {
    titulo: "Missão",
    icon: "✓",
    texto: "Prestar serviços médicos e fisioterápicos, exames e atendimentos com excelência, ética, acolhimento e dedicação à saúde integral.",
  },
  {
    titulo: "Visão",
    icon: "◌",
    texto: "Ser reconhecida pela excelência em atendimento, com inovação, tecnologia e cuidado humano em todas as especialidades.",
  },
  {
    titulo: "Valores",
    icon: "✦",
    texto: "Confiança, acolhimento, profissionalismo, atualização contínua e respeito ao paciente em cada etapa da assistência.",
  },
];

const DIRECAO = [
  {
    nome: "Dra. Alessandra Molina",
    cargo: "Direção da Clínica",
    crf: "CRF 15479F",
    bio: "Alessandra é médica com formação em clínica geral e atuação em cardiologia e medicina preventiva. Especialista em atendimento humanizado e cuidado contínuo.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=80",
  },
  {
    nome: "Dr. Marcos Molina",
    cargo: "Direção da Clínica",
    crf: "CRM 50.270",
    bio: "Marcos é cardiologista, professor e especialista em prevenção cardiovascular. Atua com foco em diagnóstico e em uma abordagem técnica e acolhedora.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80",
  },
];

const ESPECIALIDADES = [
  "Cardiologia",
  "Clínica Geral",
  "Dermatologia",
  "Ginecologia",
  "Endocrinologia",
  "Neurologia",
];

export default function SobrePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <div className={`cx-container ${styles.topBarInner}`}>
            <div className={styles.brandWrap}>
              <Link href="/" className={styles.logo}>
                <img src="/fotos/logo-transparente.png" alt="ClinicaFlow" className={styles.logoImage} />
              </Link>
              <span className={styles.brandSub}>ClinicaFlow</span>
            </div>
            <div className={styles.utilityBar}>
              <span>0800-778-7100</span>
              <span>SAC (15) 3273-7101</span>
              <Link href="/agendamento-online" className={styles.scheduleButton}>Agendamento online</Link>
              <form action="/procurar-clinica" method="get" className={styles.headerSearch}>
                <label htmlFor="about-search" className={styles.srOnly}>Buscar clínica</label>
                <input id="about-search" name="busca" type="search" placeholder="Buscar clínica" />
                <button type="submit" aria-label="Buscar clínica">⌕</button>
              </form>
            </div>
          </div>
        </div>
        <div className={styles.mainBar}>
          <div className={`cx-container ${styles.mainBarInner}`}>
            <nav className={styles.nav}>
              <Link href="/">Início</Link>
              <Link href="/sobre">Sobre</Link>
              <Link href="/#especialidades">Especialidades</Link>
              <Link href="/#unidades">Unidades</Link>
              <Link href="/procurar-clinica">Buscar clínica</Link>
            </nav>
            <div className={styles.headerActions}>
              <Link href="/portal-paciente" className={styles.portalLink}>Portal do cliente</Link>
              <Link href="/portal-medico" className={styles.portalLink}>Portal do médico</Link>
              <Link href="/procurar-clinica" className="cx-btn cx-btn-primary">Buscar clínica</Link>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.heroSection}>
          <div className={`cx-container ${styles.heroInner}`}>
            <div className={styles.titleWrap}>
              <div className={styles.brandBadge}>
                <img src="/fotos/logo-transparente.png" alt="" />
              </div>
              <h1>ClinicaFlow</h1>
            </div>

            <div className={styles.heroGrid}>
              <div className={styles.textColumn}>
                <p>
                  Há mais de 35 anos, somos referência em especialidades médicas e fisioterápicas,
                  com acolhimento, qualidade e atenção personalizada a cada paciente.
                </p>
                <p>
                  Nosso objetivo é oferecer um atendimento completo, com profissionais altamente
                  qualificados, tecnologia moderna e um ambiente seguro e acolhedor.
                </p>
                <p>
                  A ClinicaFlow nasceu para transformar a experiência de cuidar da saúde,
                  integrando excelência técnica ao compromisso com a humanização.
                </p>
                <p>
                  Trabalhamos com foco na prevenção, no diagnóstico e no acompanhamento contínuo,
                  sempre respeitando a individualidade de cada pessoa e sua rotina.
                </p>
              </div>

              <div className={styles.mediaColumn}>
                <div className={styles.videoCard}>
                  <div className={styles.videoOverlay} />
                  <div className={styles.videoBadge}>Localização</div>
                  <div className={styles.mapEmbed}>
                    <iframe
                      title="Mapa da clínicaFlow"
                      src="https://www.google.com/maps?q=Avenida%20Paulista%2C%20S%C3%A3o%20Paulo%20SP&z=14&output=embed"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="cx-container">
            <h2 className={styles.sectionTitle}>Veja mais sobre nós</h2>
            <div className={styles.valuesGrid}>
              {VALORES.map((item) => (
                <article key={item.titulo} className={styles.valueCard}>
                  <div className={styles.valueIcon}>{item.icon}</div>
                  <h3>{item.titulo}</h3>
                  <p>{item.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.sectionTeam}>
          <div className="cx-container">
            <h2 className={styles.teamHeading}>Conheça um pouco da nossa direção clínica</h2>
            <div className={styles.teamGrid}>
              {DIRECAO.map((m) => (
                <article key={m.nome} className={styles.personCard}>
                  <div className={styles.personPhotoWrap}>
                    <img src={m.avatar} alt={m.nome} className={styles.personPhoto} />
                  </div>
                  <h3>{m.nome}</h3>
                  <p className={styles.personCargo}>{m.cargo}</p>
                  <p className={styles.personCrf}>{m.crf}</p>
                  <p className={styles.personBio}>{m.bio}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.sectionSpecialties}>
          <div className="cx-container">
            <h2 className={styles.specialtyHeading}>Conheça nossas Especialidades</h2>
            <div className={styles.specialityGrid}>
              {ESPECIALIDADES.map((nome) => (
                <div key={nome} className={styles.specialityItem}>
                  {nome}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
