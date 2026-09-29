import Link from "next/link";
import { ROLE_LABEL, type AppRole } from "@/lib/roles";
import LogoutButton from "./LogoutButton";
import styles from "./AppShell.module.css";

export type NavItem = { href: string; label: string };

export default function AppShell({
  role,
  nome,
  email,
  nav,
  titulo,
  descricao,
  children,
}: {
  role: AppRole;
  nome: string;
  email: string | null;
  nav: NavItem[];
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.shell} ${styles[role]}`}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <img className={styles.brandLogo} src="/fotos/logo-transparente.png" alt="" />
          <span>ClinicaFlow</span>
        </Link>
        <span className={styles.roleTag}>{ROLE_LABEL[role]}</span>

        <nav className={styles.nav}>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.spacer} />
        <div className={styles.userBox}>
          <strong>{nome}</strong>
          <span>{email}</span>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <h1>{titulo}</h1>
            {descricao && <p>{descricao}</p>}
          </div>
          <LogoutButton />
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
