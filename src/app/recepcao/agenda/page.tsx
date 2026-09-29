import Panel from "@/components/Panel";
import ConsultaForm from "@/components/ConsultaForm";
import ConsultasTable, { type ConsultaRow } from "@/components/ConsultasTable";
import { createClient } from "@/lib/supabase/server";
import { CONSULTA_SELECT, getOpcoes } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AgendaRecepcao() {
  const supabase = await createClient();
  const opcoes = await getOpcoes();
  const { data } = await supabase.from("consultas").select(CONSULTA_SELECT).order("data_hora", { ascending: false }).limit(80);

  return (
    <>
      <Panel titulo="Novo agendamento" descricao="Marque, remarque e confirme consultas.">
        <ConsultaForm
          pacientes={opcoes.pacientes}
          especialidades={opcoes.especialidades}
          unidades={opcoes.unidades}
          horarios={opcoes.horarios}
        />
      </Panel>
      <Panel titulo="Agendamentos recentes">
        <ConsultasTable consultas={(data ?? []) as unknown as ConsultaRow[]} podeAlterarStatus />
      </Panel>
    </>
  );
}
