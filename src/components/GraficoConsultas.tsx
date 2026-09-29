"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function GraficoConsultas({ dados }: { dados: { nome: string; total: number }[] }) {
  if (!dados.length) return <p style={{ color: "var(--cx-muted)" }}>Ainda não há consultas registradas.</p>;

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={dados} margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6eff1" />
          <XAxis dataKey="nome" tick={{ fontSize: 12 }} stroke="#5d757e" />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#5d757e" />
          <Tooltip />
          <Bar dataKey="total" fill="#0e8f9e" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
