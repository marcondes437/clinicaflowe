import styles from "./Panel.module.css";

export default function Panel({
  titulo,
  descricao,
  acao,
  children,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={`cx-card ${styles.panel}`}>
      <div className={styles.head}>
        <div>
          <h2>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
        {acao}
      </div>
      <div className={styles.scroll}>{children}</div>
    </section>
  );
}
