import Panel from "@/components/Panel";
import StatCards from "@/components/StatCards";
import GraficoConsultas from "@/components/GraficoConsultas";
import { getIndicadores } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { moeda } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GestorDashboard() {
  const indicadores = await getIndicadores();
  const supabase = await createClient();
  const { data } = await supabase.from("consultas").select("status");

  const contagem = new Map<string, number>();
  (data ?? []).forEach((c) => contagem.set(c.status, (contagem.get(c.status) ?? 0) + 1));

  return (
    <>
      <StatCards
        stats={[
          { label: "Pacientes ativos", value: indicadores.pacientes },
          { label: "Consultas hoje", value: indicadores.consultasHoje },
          { label: "Concluídas", value: indicadores.concluidas },
          { label: "Canceladas", value: indicadores.canceladas },
          { label: "Faturamento", value: moeda(indicadores.faturamento) },
        ]}
      />
      <Panel titulo="Consultas por status">
        <GraficoConsultas dados={[...contagem.entries()].map(([nome, total]) => ({ nome, total }))} />
      </Panel>
    </>
  );
}
