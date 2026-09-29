import Link from "next/link";
import styles from "./HomeFooter.module.css";

const mapUrl = "https://www.google.com/maps?q=Av.+S%C3%A3o+Paulo,+154,+Mogi+das+Cruzes,+SP";

export default function HomeFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <div>
            <span className={styles.eyebrow}>Conte com a gente</span>
            <h2>Seu próximo passo é cuidar de você.</h2>
            <p>Estamos por perto para ajudar você a se sentir melhor.</p>
          </div>
          <Link href="/agendamento-online" className={styles.schedule}>Agendar uma consulta <span aria-hidden="true">↗</span></Link>
        </div>
        <div className={styles.columns}>
          <div className={styles.brand}>
            <Link href="/" className={styles.brandLink} aria-label="ClinicaFlow — página inicial">
              <img src="/fotos/logo-transparente.png" alt="ClinicaFlow" width="174" height="66" />
            </Link>
            <p>Saúde, tecnologia e inovação com um atendimento personalizado que você merece.</p>
            <nav className={styles.brandNav} aria-label="Links úteis do rodapé">
              <Link href="/sobre">Conheça a clínica <span aria-hidden="true">↗</span></Link>
              <Link href="/portal-paciente">Área do paciente <span aria-hidden="true">↗</span></Link>
            </nav>
          </div>
          <section aria-labelledby="footer-contact">
            <h2 id="footer-contact">Contato</h2>
            <div className={styles.phones}>
              <span className={styles.label}>Ligue para nossa equipe</span>
              <a href="tel:+551148472314">(11) 4847-2314</a>
              <a href="tel:+551147982522">(11) 4798-2522</a>
              <a href="tel:+551126027500">(11) 2602-7500</a>
            </div>
            <a className={styles.whatsapp} href="https://wa.me/5511941979206" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a9 9 0 0 1-13.4 7.8L3 21l1.7-4.6A9 9 0 1 1 21 11.5Z" /><path d="M8 7.5c0 4.5 4 8 8 8l1-2.5-3-1-1 1a8 8 0 0 1-2.5-2.5l1-1-1-3Z" /></svg>
              <span>Fale pelo WhatsApp<small>(11) 94197-9206</small></span>
              <span aria-hidden="true">↗</span>
            </a>
          </section>
          <section className={styles.location} aria-labelledby="footer-location">
            <h2 id="footer-location">Localização</h2>
            <address>Av. São Paulo, 154 - Jardim Armenia,<br />Mogi das Cruzes - SP, 08780-570</address>
            <h3 className={styles.hoursTitle}>Horário de atendimento</h3>
            <dl className={styles.hours}>
              <div><dt>Segunda a sexta</dt><dd>9h às 20h</dd></div>
              <div><dt>Sábado</dt><dd>9h às 14h</dd></div>
            </dl>
          </section>
          <div className={styles.map}>
            <iframe title="Localização da ClinicaFlow — Mogi das Cruzes" src={`${mapUrl}&output=embed`} width="375" height="196" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">Ver no Google Maps <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} ClinicaFlow. Todos os direitos reservados.</p>
          <span>Saúde com cuidado. Tecnologia com propósito.</span>
        </div>
      </div>
    </footer>
  );
}
