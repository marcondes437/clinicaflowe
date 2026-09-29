"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./ServicesWidget.module.css";

const publicPages = ["/", "/sobre", "/procurar-clinica", "/agendamento-online", "/portal-medico", "/recuperar-senha"];
const whatsapp = "https://wa.me/5511941979206";

function ServiceIcon({ kind }: { kind: "calendar" | "exam" | "chat" | "grid" | "phone" }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "calendar" && <><rect x="4" y="6" width="22" height="23" rx="4" /><path d="M10 3v6m10-6v6M4 13h22M10 19h4m-4 5h4" /><circle cx="24" cy="24" r="6" fill="white" /><path d="M24 21v6m-3-3h6" /></>}
    {kind === "exam" && <><path d="M12 3h8m-7 0v10L5 26a2 2 0 0 0 2 3h18a2 2 0 0 0 2-3l-8-13V3M10 20h12" /><path d="M15 24h2" /></>}
    {kind === "chat" && <g stroke="none">
      <path fill="currentColor" d="M16 2a14 14 0 0 0-12.1 21L2 30l7.2-1.9A14 14 0 1 0 16 2Z" />
      <path fill="#fff" d="M11.3 8.5c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.7.1-1 .5-.4.4-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.8c.2.3 2.6 4.2 6.4 5.7 3.2 1.3 3.8 1 4.5.9.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.8-.5l-2.5-1.2c-.3-.1-.6-.2-.8.2l-1.2 1.4c-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8l.6-.7.4-.6c.1-.2.1-.5 0-.7l-1.1-2.4Z" />
    </g>}
    {kind === "grid" && <g fill="currentColor" stroke="none"><rect x="3" y="3" width="11" height="11" rx="2" /><rect x="18" y="3" width="11" height="11" rx="2" /><rect x="3" y="18" width="11" height="11" rx="2" /><rect x="18" y="18" width="11" height="11" rx="2" /></g>}
    {kind === "phone" && <path d="m7 3 6 7-4 4a24 24 0 0 0 9 9l4-4 7 6-3 4C15 30 2 17 3 7Z" fill="currentColor" stroke="none" />}
  </svg>;
}

export default function ServicesWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (!publicPages.includes(pathname)) return null;

  function close() { setOpen(false); }

  return <aside className={styles.widget} aria-label="Agendamentos e serviços" onKeyDown={event => {
    if (event.key === "Escape" && open) { close(); trigger.current?.focus(); }
  }}>
    <button ref={trigger} type="button" className={styles.toggle} aria-expanded={open} aria-controls="services-panel" onClick={() => setOpen(current => !current)}>
      <img src="/fotos/logo-transparente.png" alt="" width="48" height="48" />
      <span>Agendamentos <span className={styles.accent}>e serviços</span></span>
      <svg className={`${styles.chevron} ${open ? styles.expanded : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>
    </button>
    <nav id="services-panel" className={styles.panel} hidden={!open} aria-label="Atalhos de atendimento">
      <div className={styles.grid}>
        <Link href="/agendamento-online" className={styles.card} onClick={close}><ServiceIcon kind="calendar" /><span>Agendar<strong>Consulta</strong></span></Link>
        <a href={`${whatsapp}?text=${encodeURIComponent("Olá! Gostaria de agendar exames.")}`} target="_blank" rel="noopener noreferrer" className={styles.card} onClick={close}><ServiceIcon kind="exam" /><span>Agendar<strong>Exames</strong></span></a>
        <a href={`${whatsapp}?text=${encodeURIComponent("Olá! Gostaria de agendar um atendimento.")}`} target="_blank" rel="noopener noreferrer" className={styles.card} onClick={close}><ServiceIcon kind="chat" /><span>Agendar por<strong>WhatsApp</strong></span></a>
        <Link href="/procurar-clinica" className={styles.card} onClick={close}><ServiceIcon kind="grid" /><span>Outros<strong>Serviços</strong></span></Link>
        <a href="tel:+551148472314" className={styles.card} onClick={close}><ServiceIcon kind="phone" /><span>Ligue<strong>(11) 4847-2314</strong></span></a>
        <div className={styles.decoration} aria-hidden="true"><i /><i /><i /><i /></div>
      </div>
    </nav>
  </aside>;
}
