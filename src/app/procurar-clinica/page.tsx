import Link from "next/link";
import { ClinicLogo } from "@/components/HomeCarousel";
import styles from "./page.module.css";

const SERVICOS = [
  { label: "Teleconsultas", checked: true },
  { label: "Urgência e emergência", checked: true },
  { label: "Mudança da rede prestadora", checked: false },
];

const INFO = [
  {
    title: "Sobre a clínica",
    items: ["Nossa história", "Missão e visão", "Valores", "Atendimento humanizado"],
  },
  {
    title: "Especialidades",
    items: ["Clínica geral", "Cardiologia", "Dermatologia", "Ginecologia"],
  },
  {
    title: "Unidades",
    items: ["Atendimento em SP", "Agendamento online", "Consulta inicial", "Prontuário digital"],
  },
  {
    title: "Informações",
    items: ["Horários de atendimento", "Exames disponíveis", "Dúvidas frequentes", "Contato e WhatsApp"],
  },
  {
    title: "Importante",
    items: ["Vacinas", "Check-ups", "Telemedicina", "Acompanhamento contínuo"],
  },
];

export default function ProcurarClinicaPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <div className={`cx-container ${styles.topBarInner}`}>
            <div className={styles.brandWrap}>
              <Link href="/" className={styles.logo}>
                <img src="/fotos/logo-transparente.png" alt="ClinicaFlow" className={styles.logoImage} />
              </Link>
              <span className={styles.brandSub}>Saúde com qualidade</span>
            </div>

            <div className={styles.utilityBar}>
              <span>0800-778-7100</span>
              <span>SAC (15) 3273-7101</span>
              <span>Canais de atendimento</span>
            </div>
          </div>
        </div>

        <div className={styles.mainBar}>
          <div className={`cx-container ${styles.mainBarInner}`}>
            <nav className={styles.nav}>
              <Link href="/sobre">Sobre</Link>
              <Link href="/">Especialidades</Link>
              <Link href="/">Unidades</Link>
              <Link href="/">Notícias</Link>
              <Link href="/">Exames</Link>
              <Link href="/portal-paciente">Portal do cliente</Link>
              <Link href="/portal-medico">Portal do médico</Link>
              <Link href="/procurar-clinica">Encontre um médico</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className={styles.mainSection}>
        <div className={styles.backgroundPattern} aria-hidden="true" />

        <div className={`cx-container ${styles.contentWrap}`}>
          <h1>Guia Clinica</h1>
          <p>Informe aqui qual o tipo de atendimento você procura</p>

          <div className={styles.searchCard}>
            <div className={styles.tabs}>
              <button type="button" className={`${styles.tab} ${styles.active}`}>
                Busca rápida
              </button>
              <button type="button" className={styles.tab}>
                Busca detalhada
              </button>
            </div>

            <div className={styles.searchFieldWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input type="text" placeholder="Digite aqui o serviço que você procura" />
            </div>

            <div className={styles.optionsRow}>
              <div className={styles.optionField}>
                <label>Digite sua cidade ou bairro</label>
              </div>

              <div className={styles.checkboxList}>
                {SERVICOS.map((item) => (
                  <label key={item.label} className={styles.checkItem}>
                    <span>{item.label}</span>
                    <input type="checkbox" defaultChecked={item.checked} />
                  </label>
                ))}
              </div>
            </div>

            <button type="button" className={styles.searchButton}>Encontrar clínica mais próxima</button>
          </div>
        </div>
      </main>

      <section className={styles.infoGridSection}>
        <div className="cx-container">
          <div className={styles.infoGrid}>
            {INFO.map((group) => (
              <div key={group.title} className={styles.infoCol}>
                <h3>{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className="cx-container">
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <ClinicLogo light />
              <p>Saúde, tecnologia e inovação com um atendimento personalizado que você merece.</p>
              <strong>CLINICXFLOW - SISTEMA DE SERVIÇOS MÉDICOS</strong>
            </div>
            <div className={styles.footerContact}>
              <h4>Contato</h4>
              <p>Telefone: (11) 4847-2314<br />(11) 4798-2522<br />(11) 2602-7500<br />WhatsApp: (11) 94197-9206</p>
              <div className={styles.socials}><a href="#contato" aria-label="Facebook">f</a><a href="#contato" aria-label="Instagram">◎</a></div>
              <a href="#faq">Política de privacidade</a>
              <a href="#faq">Termos de uso</a>
            </div>
            <div className={styles.footerLocation}>
              <h4>Localização</h4>
              <p>Av. São Paulo, 154 - Jardim Armenia,<br />Mogi das Cruzes - SP, 08780-570</p>
              <h4>Horário de Atendimento</h4>
              <p>Segunda a Sexta: 9h00 às 20h00<br />Sábado: 9h00 às 14h00</p>
            </div>
            <div className={styles.mapFrame}>
              <iframe title="Localização da ClinicaFlow" src="https://www.google.com/maps?q=Av.+S%C3%A3o+Paulo,+154,+Mogi+das+Cruzes,+SP&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </div>
          <div className={styles.footerBottom}>© {new Date().getFullYear()} ClinicaFlow. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  );
}
