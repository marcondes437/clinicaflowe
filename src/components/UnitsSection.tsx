"use client";

import { useEffect, useState } from "react";
import styles from "./UnitsSection.module.css";

type Unit = { id: string; nome: string; endereco: string | null; cidade: string | null; telefone: string | null; horario_funcionamento: string | null };

function Icon({ kind }: { kind: "pin" | "phone" | "care" }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{kind === "pin" ? <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.3" /></> : kind === "phone" ? <path d="m7 3 3 5-2 2a14 14 0 0 0 6 6l2-2 5 3-1 4C10 23 1 14 3 4Z" /> : <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" />}</svg>;
}

export default function UnitsSection({ units }: { units: Unit[] }) {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(2);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 680px)");
    const update = () => { setPerPage(media.matches ? 1 : 2); setPage(0); };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const pages = Math.ceil(units.length / perPage);
  const currentPage = Math.min(page, Math.max(0, pages - 1));
  const visible = showAll ? units : units.slice(currentPage * perPage, (currentPage + 1) * perPage);

  return <section id="unidades" className={styles.section} aria-labelledby="units-title">
    <div className={`cx-container ${styles.container}`}>
      <h2 id="units-title">Unidades</h2>
      <p className={styles.intro}>Conheça as unidades da ClinicaFlow e encontre a mais adequada para você. Confira os endereços e entre em contato para planejar seu atendimento.</p>
      {units.length === 0 ? <p>Nossas unidades estarão disponíveis em breve.</p> : <>
        <div className={styles.grid} aria-live="polite">
          {visible.map((unit) => {
            const index = units.findIndex((item) => item.id === unit.id);
            const address = [unit.endereco, unit.cidade].filter(Boolean).join(" · ");
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || unit.nome)}`;
            return <article key={unit.id} className={styles.card}>
              <div className={styles.photo}>
                <img src={index % 2 === 0 ? "/fotos/unidade-fachada.jpg" : "/fotos/unidade-recepcao.jpg"} alt="" width="1000" height="560" loading="lazy" />
                <span>Imagem ilustrativa</span>
              </div>
              <div className={styles.body}>
                <h3>{unit.nome}</h3>
                <p className={styles.row}><Icon kind="care" /><span>Consulte a unidade para informações sobre consultas, especialidades e exames disponíveis.</span></p>
                <div className={styles.row}><Icon kind="pin" />{address ? <a href={mapUrl} target="_blank" rel="noopener noreferrer">{address}</a> : <span>Endereço em atualização</span>}</div>
                <div className={styles.contacts}>
                  {unit.telefone ? <a className={styles.row} href={`tel:${unit.telefone.replace(/[^\d+]/g, "")}`}><Icon kind="phone" />{unit.telefone}</a> : <span>Telefone em atualização</span>}
                </div>
                <details className={styles.details}>
                  <summary>Conheça a unidade <span aria-hidden="true">→</span></summary>
                  <p><strong>Horário de atendimento</strong><br />{unit.horario_funcionamento || "Entre em contato com a unidade para confirmar os horários."}</p>
                  {address && <a href={mapUrl} target="_blank" rel="noopener noreferrer">Ver localização no mapa ↗</a>}
                </details>
              </div>
            </article>;
          })}
        </div>
        {!showAll && pages > 1 && <div className={styles.controls}>
          <div className={styles.arrows}>
            <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0} aria-label="Unidades anteriores">‹</button>
            <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pages - 1} aria-label="Próximas unidades">›</button>
          </div>
          <div className={styles.dots} aria-label="Páginas de unidades">{Array.from({ length: pages }, (_, i) => <button key={i} type="button" onClick={() => setPage(i)} aria-label={`Página ${i + 1} de unidades`} aria-current={i === currentPage ? "page" : undefined}><span /></button>)}</div>
        </div>}
        {units.length > perPage && <div className={styles.all}><button type="button" onClick={() => { setShowAll(!showAll); setPage(0); }}>{showAll ? "Ver menos unidades" : "Conheça todas as unidades"}</button></div>}
      </>}
    </div>
  </section>;
}
