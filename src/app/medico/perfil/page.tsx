import Panel from "@/components/Panel";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PerfilForm from "./perfil-form";
export const dynamic = "force-dynamic";
export default async function PerfilMedico() {
  const user = await requireRole(["medico"]);
  const supabase = await createClient();
  const { data: p } = await supabase.from("profissionais")
    .select("nome,telefone,horario_trabalho,unidades(nome),especialidades(nome)")
    .eq("user_id", user.id).maybeSingle();
  return <Panel titulo="Meu perfil profissional">
    {!p ? <p>Seu usuário precisa ser vinculado a um profissional pela administração.</p> : <>
      <p>Unidade: {(p.unidades as unknown as {nome:string}|null)?.nome ?? "Pendente"}</p>
      <p>Especialidade: {(p.especialidades as unknown as {nome:string}|null)?.nome ?? "Pendente"}</p>
      <p>Para alterar unidade ou especialidade, peça à administração para atualizar o cadastro e a agenda.</p>
      <PerfilForm telefone={p.telefone ?? ""} horario={p.horario_trabalho ?? ""}/>
    </>}
  </Panel>;
}
