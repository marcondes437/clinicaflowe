import Panel from "@/components/Panel";
import ConsultasTable, { type ConsultaRow } from "@/components/ConsultasTable";
import { createClient } from "@/lib/supabase/server";
import { CONSULTA_SELECT } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AgendaGestor() {
  const supabase = await createClient();
  const { data } = await supabase.from("consultas").select(CONSULTA_SELECT).order("data_hora", { ascending: false }).limit(100);

  return (
    <Panel titulo="Agenda geral" descricao="Acompanhamento de todos os atendimentos.">
      <ConsultasTable consultas={(data ?? []) as unknown as ConsultaRow[]} podeAlterarStatus />
    </Panel>
  );
}
