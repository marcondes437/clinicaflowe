"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./HomeCarousel.module.css";

const SLIDES = [
  { image: "/fotos/carrossel/pexels-7089401.jpg", position: "70% 40%", alt: "Médica conversando com uma paciente no consultório", eyebrow: "Bem-vindo à ClinicaFlow", title: "Cuidar de você é o que nos move.", text: "Consultas, exames e um atendimento próximo. Encontre o cuidado que combina com cada momento da sua vida." },
  { image: "/fotos/carrossel/pexels-5998458.jpg", position: "60% 65%", alt: "Pediatra atendendo uma criança no consultório", eyebrow: "Cuidado para toda a família", title: "Presença e carinho em cada fase.", text: "Da infância à vida adulta, encontre especialidades para acompanhar quem você ama." },
  { image: "/fotos/carrossel/pexels-34158998.jpg", position: "65% 45%", alt: "Profissional de saúde ouvindo uma paciente", eyebrow: "Atenção em cada detalhe", title: "Você merece ser ouvido e bem cuidado.", text: "Conheça nossas especialidades e encontre um atendimento pensado para as suas necessidades." },
  { image: "/fotos/carrossel/pexels-6627926.jpg", position: "65% 40%", alt: "Profissionais de saúde revisando documentos de atendimento", eyebrow: "Um passo de cada vez", title: "Mais atenção à sua saúde, todos os dias.", text: "Organize suas consultas e exames com facilidade e mantenha o cuidado presente na sua rotina." },
  { image: "/fotos/carrossel/pexels-8844392.jpg", position: "65% 72%", alt: "Consulta de orientação sobre hábitos saudáveis", eyebrow: "Bem-estar na sua rotina", title: "Boas escolhas começam com cuidado.", text: "Encontre acompanhamento especializado para cuidar da alimentação e do seu bem-estar." },
  { image: "/fotos/carrossel/pexels-5452269.jpg", position: "70% 30%", alt: "Dois médicos conversando e consultando um tablet", eyebrow: "Conectados ao seu cuidado", title: "Mais facilidade para seguir em frente.", text: "Escolha sua especialidade, encontre uma unidade e dê o próximo passo no seu atendimento." },
];

export function ClinicLogo({ light = false }: { light?: boolean }) {
  return <span className={`${styles.logo} ${light ? styles.logoLight : ""}`}><img src="/fotos/logo-transparente.png" alt="ClinicaFlow" /></span>;
}

export default function HomeCarousel() {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => setActive(current => (current + 1) % SLIDES.length), 5000);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);
  const slide = SLIDES[active];
  function select(index: number) { setActive((index + SLIDES.length) % SLIDES.length); }

  return <section className={styles.carousel} aria-label="Destaques da ClinicaFlow" aria-roledescription="carrossel">
    <div className={`cx-container ${styles.layout}`}>
      <div className={styles.content}>
        <div aria-live={reducedMotion ? "polite" : "off"} aria-atomic="true">
          <h1>{slide.title}</h1>
          <p className={styles.description}>{slide.text}</p>
        </div>
        <form action="/procurar-clinica" method="get" className={styles.heroSearch} role="search">
          <input name="busca" type="search" placeholder="Busque por especialidade ou profissional" aria-label="Buscar especialidade ou profissional" />
          <button type="submit" aria-label="Buscar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></svg></button>
        </form>
        <div className={styles.actions}>
          <Link href="/agendamento-online" className={styles.primary}>Agendar consulta <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4m8-4v4M4 11h16m-12 5 2 2 5-5" /></svg></Link>
          <a href="#especialidades" className={styles.secondary}>Encontrar especialidade <span aria-hidden="true">→</span></a>
        </div>
      </div>
      <div className={styles.visual}>
        <div className={styles.imageFrame} role="img" aria-label={slide.alt} style={{ backgroundImage: `url("${slide.image}")`, backgroundPosition: slide.position }} />
      </div>
      <div className={styles.controls}>
        <div className={styles.dots} aria-label="Selecionar destaque">{SLIDES.map((item, index) => <button type="button" key={item.title} onClick={() => select(index)} aria-label={`Destaque ${index + 1}: ${item.eyebrow}`} aria-current={index === active ? "true" : undefined}><span /></button>)}</div>
      </div>
    </div>
  </section>;
}
