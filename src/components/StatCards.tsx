import styles from "./StatCards.module.css";

export type Stat = { label: string; value: string | number; hint?: string };

export default function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className={styles.grid}>
      {stats.map((s) => (
        <div key={s.label} className={`cx-card ${styles.card}`}>
          <div className={styles.label}>{s.label}</div>
          <div className={styles.value}>{s.value}</div>
          {s.hint && <div className={styles.hint}>{s.hint}</div>}
        </div>
      ))}
    </div>
  );
}
