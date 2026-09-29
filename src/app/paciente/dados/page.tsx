import Panel from "@/components/Panel";
import MeusDadosForm from "@/components/MeusDadosForm";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function MeusDadosPage({ searchParams }: { searchParams: Promise<{ primeiro?: string; continuar?: string }> }) {
  const params = await searchParams;
  const user = await requireRole(["paciente"]);
  const supabase = await createClient();

  const { data: paciente, error } = await supabase
    .from("pacientes")
    .select("id, nome_completo, celular, data_nascimento")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return <Panel titulo="Meus dados"><p className="cx-alert cx-alert-error" role="alert">Não foi possível carregar seu cadastro: {error.message}</p></Panel>;
  }

  // Dados adicionais são opcionais para renderizar a página. Assim uma migration/policy antiga
  // não deixa o paciente preso fora do formulário de atualização.
  let detalhes: Record<string, string | null> | null = null;
  let avisoDetalhes: string | null = null;
  if (paciente) {
    const resultado = await supabase
      .from("pacientes_dados_sensiveis")
      .select("cpf, cep, endereco, cidade, estado, contato_emergencia, tipo_sanguineo, alergias, doencas, deficiencias")
      .eq("paciente_id", paciente.id)
      .maybeSingle();
    detalhes = resultado.data as Record<string, string | null> | null;
    if (resultado.error) avisoDetalhes = "Alguns dados adicionais não puderam ser carregados. Você ainda pode preencher e salvar o formulário.";
  }

  return <Panel titulo="Meus dados" descricao="Complete seu cadastro. As informações ficam salvas para seus próximos acessos.">
    {params.primeiro === "1" && <p>Antes de continuar, confirme seu nome, celular e data de nascimento.</p>}
    {avisoDetalhes && <p className="cx-alert" role="status">{avisoDetalhes}</p>}
    <MeusDadosForm
      dados={{ nome_completo: user.nome, ...paciente, ...(detalhes ?? {}) }}
      continuar={params.continuar === "agendar" ? "/paciente/agendar" : "/paciente"}
    />
  </Panel>;
}
