import Panel from "@/components/Panel";
import StatCards from "@/components/StatCards";
import ConsultasTable, { type ConsultaRow } from "@/components/ConsultasTable";
import { createClient } from "@/lib/supabase/server";
import { CONSULTA_SELECT } from "@/lib/queries";
import { fimDoDia, inicioDoDia } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PainelRecepcao() {
  const supabase = await createClient();
  const { data: hoje } = await supabase
    .from("consultas").select(CONSULTA_SELECT)
    .gte("data_hora", inicioDoDia()).lte("data_hora", fimDoDia()).order("data_hora");

  const confirmadas = (hoje ?? []).filter((c) => c.status === "confirmada").length;
  const pendentes = (hoje ?? []).filter((c) => c.status === "agendada").length;

  return (
    <>
      <StatCards stats={[
        { label: "Consultas hoje", value: hoje?.length ?? 0 },
        { label: "Confirmadas", value: confirmadas },
        { label: "Aguardando confirmação", value: pendentes },
      ]} />
      <Panel titulo="Painel do dia" descricao="Confirme, cancele ou registre a chegada do paciente.">
        <ConsultasTable consultas={(hoje ?? []) as unknown as ConsultaRow[]} podeAlterarStatus linkPaciente="/recepcao/pacientes" />
      </Panel>
    </>
  );
}
