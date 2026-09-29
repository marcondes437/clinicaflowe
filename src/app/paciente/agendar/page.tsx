import Panel from "@/components/Panel";
import ConsultaForm from "@/components/ConsultaForm";
import { redirect } from "next/navigation";
import { cadastroPacientePendente } from "@/lib/cadastro-paciente";
import { requireRole } from "@/lib/auth";
import { getOpcoes } from "@/lib/queries";
import { getPacienteDoUsuario } from "@/lib/paciente";

export const dynamic = "force-dynamic";

export default async function AgendarPage() {
  const user = await requireRole(["paciente"]);
  const paciente = await getPacienteDoUsuario(user.id);
  if (cadastroPacientePendente(paciente)) redirect("/paciente/dados?primeiro=1&continuar=agendar");
  const opcoes = await getOpcoes({ paciente: true });

  if (!paciente) {
    return (
      <Panel titulo="Agendar consulta">
        <div className="cx-alert cx-alert-error">
          Seu cadastro de paciente ainda não foi criado. Fale com a recepção da unidade.
        </div>
      </Panel>
    );
  }

  return (
    <Panel titulo="Agendar consulta" descricao="Escolha a especialidade e um horário. O médico será definido automaticamente.">
      {opcoes.erroAgenda ? <p className="cx-alert cx-alert-error" role="alert">Não foi possível carregar a agenda. Tente novamente em instantes ou entre em contato com a clínica.</p> : <ConsultaForm
        pacienteFixo={paciente.id}
        especialidades={opcoes.especialidades}
        unidades={opcoes.unidades}
        horarios={opcoes.horarios}
      />}
    </Panel>
  );
}
