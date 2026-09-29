"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import styles from "./SpecialtiesSection.module.css";

type Specialty = { id: string; nome: string; descricao: string | null };
const images: Record<string, string> = {
  cardiologia: "/fotos/cardiologi.jpg",
  "clinica geral": "/fotos/clinicageral.jpg",
  dermatologia: "/fotos/especialidade-dermatologia.png",
  enfermagem: "/fotos/enfermagem.jpg",
  ginecologia: "/fotos/ginecologia.jpg",
  nutricao: "/fotos/nutrição.png",
  odontologia: "/fotos/especialidade-odontologia.jpg",
  ortopedia: "/fotos/especialidade-ortopedia.png",
  pediatria: "/fotos/especialidade-pediatria.png",
};
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export default function SpecialtiesSection({ specialties }: { specialties: Specialty[] }) {

  const [active, setActive] = useState(0);

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  const current = active % Math.max(specialties.length, 1);
  const move = (direction: number) => setActive(value => (value + direction + specialties.length) % Math.max(specialties.length, 1));

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (hovered || focused || reducedMotion || specialties.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive(value => (value + 1) % specialties.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [hovered, focused, reducedMotion, specialties.length, current]);
  return <section id="especialidades" className={styles.section} aria-labelledby="specialties-title">
    <div className="cx-container">
      <div className={styles.heading}>
        <div><span className={styles.eyebrow}><span aria-hidden="true" />Nossas especialidades</span><h2 id="specialties-title">Cada pessoa é única.<br /><span>O cuidado também.</span></h2></div>
        <p>Encontre a especialidade que você procura e dê o próximo passo no cuidado com a sua saúde.</p>
      </div>

      {specialties.length > 0 && <div className={styles.carousel} role="region" aria-roledescription="carrossel" aria-label="Especialidades"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
        onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
      <div className={styles.grid}>
        {specialties.map((specialty, index) => {
          let offset = (index - current + specialties.length) % specialties.length;
          if (offset > specialties.length / 2) offset -= specialties.length;
          return <article className={`${styles.card} ${offset === 0 ? styles.active : ""}`} key={specialty.id}
            style={{ "--offset": offset, zIndex: 10 - Math.abs(offset) } as CSSProperties}
            aria-hidden={offset !== 0} inert={offset !== 0} role="group" aria-roledescription="slide" aria-label={`${index + 1} de ${specialties.length}: ${specialty.nome}`}>
          <div className={styles.photo}>
            <img src={images[normalize(specialty.nome)] ?? "/fotos/clinicageral.jpg"} alt={`Imagem ilustrativa de atendimento em ${specialty.nome}`} loading="lazy" />
            <span className={styles.photoLabel}>Cuidado especializado</span>
          </div>
          <div className={styles.body}>
            <div className={styles.title}><h3>{specialty.nome}</h3><span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5Z" /></svg></span></div>
            <p>{specialty.descricao || "Conheça as opções de atendimento e encontre o cuidado para a sua rotina."}</p>
            <Link href="/agendamento-online" aria-label={`Buscar atendimento em ${specialty.nome}`} className={styles.link}>Buscar atendimento<span className={styles.arrow} aria-hidden="true">↗</span></Link>
          </div>
        </article>;
        })}
      </div>

      </div>}
      {specialties.length === 0 && <div className={styles.empty}><h3>Novas especialidades em breve</h3><p>Entre em contato com uma unidade para conhecer as opções de atendimento.</p><Link href="/#unidades">Conhecer unidades →</Link></div>}
    </div>
  </section>;
}
