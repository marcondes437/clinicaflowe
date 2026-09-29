"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(fd: FormData, k: string) {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function salvarMeusDados(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Entre novamente para salvar seus dados." };
  const nome = str(formData, "nome_completo");
  const celular = str(formData, "celular");
  if (!nome || !celular) return { erro: "Preencha nome e celular." };
  const nascimento = str(formData, "data_nascimento");
  if (!nascimento || !/^\d{4}-\d{2}-\d{2}$/.test(nascimento) || !Number.isFinite(Date.parse(nascimento)) || nascimento > new Date().toISOString().slice(0, 10)) {
    return { erro: "Informe uma data de nascimento válida." };
  }
  const dados = Object.fromEntries(["nome_completo", "celular", "data_nascimento", "cpf", "cep", "endereco", "cidade", "estado", "contato_emergencia", "tipo_sanguineo", "alergias", "doencas", "deficiencias"].map(k => [k, str(formData, k)]));
  // Preferimos a RPC transacional quando a migration atual está aplicada.
  const { error: rpcError } = await supabase.rpc("salvar_meus_dados", { _dados: dados });

  if (rpcError) {
    // Compatibilidade com instalações que ainda não aplicaram a migration da RPC.
    // Uma RPC existente que falhou por permissão/esquema não deve ser ignorada.
    if (rpcError.code !== "PGRST202" && rpcError.code !== "42883") return { erro: `Não foi possível salvar: ${rpcError.message}` };
    // As operações continuam protegidas pelas policies RLS: o paciente só altera o próprio registro.
    const { data: existente, error: lookupError } = await supabase
      .from("pacientes")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (lookupError) return { erro: `Não foi possível localizar seu cadastro: ${lookupError.message}` };

    let pacienteId = existente?.id as string | undefined;
    if (pacienteId) {
      const { error: pacienteError } = await supabase.from("pacientes").update({
        nome_completo: nome, celular, data_nascimento: nascimento,
      }).eq("id", pacienteId).eq("user_id", user.id);
      if (pacienteError) return { erro: `Não foi possível atualizar seus dados: ${pacienteError.message}` };
    } else {
      const { data: criado, error: pacienteError } = await supabase.from("pacientes").insert({
        user_id: user.id, nome_completo: nome, celular, data_nascimento: nascimento, email: user.email ?? null,
      }).select("id").single();
      if (pacienteError || !criado) return { erro: `Não foi possível criar seu cadastro: ${pacienteError?.message ?? "erro desconhecido"}` };
      pacienteId = criado.id;
    }

    const cpf = dados.cpf ? String(dados.cpf).replace(/\D/g, "") || null : null;
    const { error: sensitiveError } = await supabase.from("pacientes_dados_sensiveis").upsert({
      paciente_id: pacienteId, cpf, cep: dados.cep, endereco: dados.endereco, cidade: dados.cidade,
      estado: dados.estado ? String(dados.estado).toUpperCase() : null, contato_emergencia: dados.contato_emergencia,
      tipo_sanguineo: dados.tipo_sanguineo, alergias: dados.alergias, doencas: dados.doencas, deficiencias: dados.deficiencias,
    }, { onConflict: "paciente_id" });
    if (sensitiveError) return { erro: `Os dados básicos foram salvos, mas os dados adicionais falharam: ${sensitiveError.message}` };

    // O profile é apenas uma cópia de apresentação; falha aqui não deve impedir o cadastro do paciente.
    await supabase.from("profiles").update({ nome, telefone: celular, updated_at: new Date().toISOString() }).eq("id", user.id);
  }

  revalidatePath("/paciente", "layout");
  revalidatePath("/paciente/dados");
  return { ok: "Informações salvas para seus próximos acessos." };
}

export async function criarPaciente(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: paciente, error } = await supabase.from("pacientes").insert({
    nome_completo: str(formData,"nome_completo") ?? "", data_nascimento:str(formData,"data_nascimento"), telefone:str(formData,"telefone"), celular:str(formData,"celular"), email:str(formData,"email"), observacoes:str(formData,"observacoes")
  }).select("id").single();
  if(error||!paciente) return {erro:error?.message||"Falha ao cadastrar."};
  const sensiveis={paciente_id:paciente.id,cpf:str(formData,"cpf"),endereco:str(formData,"endereco"),cidade:str(formData,"cidade"),estado:str(formData,"estado"),cep:str(formData,"cep"),contato_emergencia:str(formData,"contato_emergencia")};
  const {error:sensitiveError}=await supabase.from("pacientes_dados_sensiveis").insert(sensiveis);
  if(sensitiveError){await supabase.from("pacientes").delete().eq("id",paciente.id);return {erro:sensitiveError.message};}
  await audit(supabase,"cadastrar","pacientes",paciente.id); revalidatePath("/admin/pacientes"); revalidatePath("/recepcao/pacientes"); return {ok:"Paciente cadastrado com sucesso."};
}

export async function criarEspecialidade(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("especialidades").insert({
    nome: str(formData, "nome") ?? "",
    descricao: str(formData, "descricao"),
  });
  if (error) return { erro: error.message };
  revalidatePath("/admin/especialidades");
  revalidatePath("/");
  return { ok: "Especialidade cadastrada." };
}

export async function criarUnidade(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("unidades").insert({
    nome: str(formData, "nome") ?? "",
    endereco: str(formData, "endereco"),
    cidade: str(formData, "cidade"),
    estado: str(formData, "estado"),
    telefone: str(formData, "telefone"),
    email: str(formData, "email"),
    horario_funcionamento: str(formData, "horario_funcionamento"),
  });
  if (error) return { erro: error.message };
  revalidatePath("/admin/unidades");
  revalidatePath("/");
  return { ok: "Unidade cadastrada." };
}

export async function criarProfissional(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("profissionais").insert({
    user_id: str(formData, "user_id"),
    nome: str(formData, "nome") ?? "",
    registro_profissional: str(formData, "registro_profissional"),
    especialidade_id: str(formData, "especialidade_id"),
    unidade_id: str(formData, "unidade_id"),
    telefone: str(formData, "telefone"),
    email: str(formData, "email"),
    descricao: str(formData, "descricao"),
  });
  if (error) return { erro: error.message };
  revalidatePath("/admin/profissionais");
  revalidatePath("/");
  return { ok: "Profissional cadastrado." };
}

export async function criarConsulta(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const dataHora = str(formData, "data_hora");
  const especialidadeId = str(formData, "especialidade_id");
  const unidadeId = str(formData, "unidade_id");
  if (!dataHora || !especialidadeId || !unidadeId) {
    return { erro: "Selecione especialidade, unidade e um horário disponível." };
  }

  const pacienteId = str(formData, "paciente_id");
  if (!pacienteId) return { erro: "Selecione o paciente." };

  const { data, error } = await supabase.rpc("agendar_consulta_automaticamente", {
    _paciente_id: pacienteId,
    _especialidade_id: especialidadeId,
    _unidade_id: unidadeId,
    _data_hora: dataHora,
    _motivo: str(formData, "motivo"),
  });

  if (error) {
    if (error.message.includes("já possui uma consulta")) return { erro: "Você já tem uma consulta nesse horário. Escolha outro horário." };
    const indisponivel = error.message.toLowerCase().includes("indisponível");
    return {
      erro: indisponivel
        ? "Esse horário acabou de ser reservado. Atualize a página e escolha outro."
        : "Não foi possível agendar a consulta. Confira os dados e tente novamente.",
    };
  }

  const profissional = data?.[0]?.nome_profissional;
  revalidatePath("/admin/agenda");
  revalidatePath("/recepcao/agenda");
  revalidatePath("/medico");
  revalidatePath("/paciente");
  revalidatePath("/paciente/agendar");
  return {
    ok: profissional
      ? `Consulta agendada. Profissional responsável: ${profissional}.`
      : "Consulta agendada. O profissional responsável já aparece no seu painel.",
  };
}

export async function criarDisponibilidade(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const profissionalId = str(formData, "profissional_id");
  const dataHoraLocal = str(formData, "data_hora");

  if (!profissionalId || !dataHoraLocal) {
    return { erro: "Selecione o profissional e a data com horário." };
  }

  const { data: profissional, error: profissionalError } = await supabase
    .from("profissionais")
    .select("especialidade_id, unidade_id")
    .eq("id", profissionalId)
    .eq("status", "ativo")
    .maybeSingle();

  if (profissionalError || !profissional?.especialidade_id || !profissional.unidade_id) {
    return { erro: "O profissional precisa ter especialidade e unidade cadastradas." };
  }

  const dataHora = /(?:Z|[+-]\d{2}:\d{2})$/.test(dataHoraLocal)
    ? new Date(dataHoraLocal)
    : new Date(`${dataHoraLocal}:00-03:00`);

  if (Number.isNaN(dataHora.getTime()) || dataHora <= new Date()) {
    return { erro: "Informe um horário futuro válido." };
  }

  const { error } = await supabase.from("agenda_medica").insert({
    profissional_id: profissionalId,
    especialidade_id: profissional.especialidade_id,
    unidade_id: profissional.unidade_id,
    data_hora: dataHora.toISOString(),
  });

  if (error?.code === "23505") return { erro: "Esse horário já está na agenda do profissional." };
  if (error) return { erro: "Não foi possível liberar o horário." };

  revalidatePath("/admin/agenda");
  revalidatePath("/recepcao/agenda");
  revalidatePath("/paciente/agendar");
  revalidatePath("/medico");
  return { ok: "Horário disponibilizado para agendamento." };
}

export async function alterarStatusConsulta(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  if (!id || !status) return;
  const { error } = await supabase.from("consultas").update({ status }).eq("id", id);
  if (error) console.error("Falha ao atualizar status da consulta:", error.message);

  revalidatePath("/admin/agenda");
  revalidatePath("/recepcao/agenda");
  revalidatePath("/medico");
  revalidatePath("/enfermagem");
  revalidatePath("/paciente");
}

export async function registrarEvolucao(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("evolucoes").insert({
    paciente_id: formData.get("paciente_id") as string,
    consulta_id: (formData.get("consulta_id") as string) || null,
    descricao: (formData.get("descricao") as string) ?? "",
    autor_id: user?.id ?? null,
  });

  if (error) return { erro: error.message };
  revalidatePath(`/admin/pacientes/${formData.get("paciente_id")}`);
  revalidatePath("/medico");
  revalidatePath(`/medico/pacientes/${formData.get("paciente_id")}`);
  return { ok: "Evolução registrada." };
}

async function audit(supabase: Awaited<ReturnType<typeof createClient>>, acao:string, entidade:string, registroId?:string|null, detalhes:Record<string,unknown>={}) {
  await supabase.rpc("registrar_auditoria", {_acao:acao,_entidade:entidade,_registro_id:registroId??null,_detalhes:detalhes});
}

export async function alterarStatusRegistro(formData: FormData) {
  const tabela=String(formData.get("tabela")||""); const id=String(formData.get("id")||""); const status=String(formData.get("status")||"");
  const permitidas=["pacientes","profissionais","unidades","especialidades","veiculos","motoristas"];
  if(!permitidas.includes(tabela)||!id||!["ativo","inativo"].includes(status)) return;
  const supabase=await createClient(); const {error}=await supabase.from(tabela).update({status}).eq("id",id);
  if(!error) await audit(supabase,"alterar_status",tabela,id,{status}); revalidatePath("/admin","layout");
}

export async function criarVagaExterna(formData: FormData) {
 const supabase=await createClient(); const {data,error}=await supabase.from("vagas_externas").insert({municipio:str(formData,"municipio")!,unidade_destino:str(formData,"unidade_destino")!,especialidade_id:str(formData,"especialidade_id"),procedimento:str(formData,"procedimento")!,quantidade_vagas:Number(str(formData,"quantidade_vagas")||0),data:str(formData,"data")!,horario:str(formData,"horario")}).select("id").single();
 if(!error){await audit(supabase,"cadastrar","vagas_externas",data?.id);revalidatePath("/admin/vagas");}
}
export async function criarVeiculo(formData: FormData) {
 const supabase=await createClient(); const {data,error}=await supabase.from("veiculos").insert({descricao:str(formData,"descricao")!,placa:str(formData,"placa")!.toUpperCase(),capacidade:Number(str(formData,"capacidade")||0),acessivel:formData.get("acessivel")==="on"}).select("id").single();
 if(!error){await audit(supabase,"cadastrar","veiculos",data?.id);revalidatePath("/admin/transportes");}
}
export async function criarTransporte(formData: FormData) {
 const supabase=await createClient(); const {data,error}=await supabase.from("transportes").insert({veiculo_id:str(formData,"veiculo_id"),motorista_id:str(formData,"motorista_id"),municipio_origem:str(formData,"municipio_origem")!,municipio_destino:str(formData,"municipio_destino")!,local_destino:str(formData,"local_destino"),data:str(formData,"data")!,horario:str(formData,"horario")!,capacidade:Number(str(formData,"capacidade")||1)}).select("id").single();
 if(!error){await audit(supabase,"cadastrar","transportes",data?.id);revalidatePath("/admin/transportes");}
}
export async function solicitarTransporte(formData: FormData) {
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return;
 const {data:p}=await supabase.from("pacientes").select("id").eq("user_id",user.id).single(); if(!p)return;
 const {data,error}=await supabase.from("solicitacoes_transporte").insert({paciente_id:p.id,tipo:str(formData,"tipo")!,municipio_destino:str(formData,"municipio_destino")!,local_destino:str(formData,"local_destino"),data_necessaria:str(formData,"data_necessaria")!,horario_necessario:str(formData,"horario_necessario"),observacao:str(formData,"observacao")}).select("id").single();
 if(!error){await audit(supabase,"solicitar","transporte",data?.id);revalidatePath("/paciente/transporte");revalidatePath("/admin/transportes");}
}
export async function analisarTransporte(formData: FormData) {
 const supabase=await createClient(); const id=String(formData.get("id")||""); const status=String(formData.get("status")||"");
 const permitidos=["em_analise","aprovado","agendado","realizado","cancelado","negado"]; if(!id||!permitidos.includes(status))return;
 const {data:{user}}=await supabase.auth.getUser(); const {error}=await supabase.from("solicitacoes_transporte").update({status,transporte_id:str(formData,"transporte_id"),motivo_decisao:str(formData,"motivo_decisao"),analisado_por:user?.id,updated_at:new Date().toISOString()}).eq("id",id);
 if(!error){await audit(supabase,"alterar_status","solicitacoes_transporte",id,{status});revalidatePath("/admin/transportes");revalidatePath("/paciente/transporte");}
}
export async function criarRegraAgenda(formData: FormData) {
 const supabase=await createClient(); const profissional_id=str(formData,"profissional_id"); if(!profissional_id)return;
 const {data:p}=await supabase.from("profissionais").select("unidade_id,especialidade_id").eq("id",profissional_id).single(); if(!p?.unidade_id||!p.especialidade_id)return;
 const {data,error}=await supabase.from("agenda_regras").insert({profissional_id,unidade_id:p.unidade_id,especialidade_id:p.especialidade_id,dia_semana:Number(str(formData,"dia_semana")||0),hora_inicio:str(formData,"hora_inicio")!,hora_fim:str(formData,"hora_fim")!,intervalo_minutos:Number(str(formData,"intervalo_minutos")||30),pausa_inicio:str(formData,"pausa_inicio"),pausa_fim:str(formData,"pausa_fim")}).select("id").single();
 if(!error){await audit(supabase,"cadastrar","agenda_regras",data?.id);revalidatePath("/admin/agenda");}
}
export async function gerarHorariosAgenda(formData: FormData) {
 const supabase=await createClient(); const regraId=String(formData.get("regra_id")||""); const inicio=String(formData.get("inicio")||""); const fim=String(formData.get("fim")||""); if(!regraId||!inicio||!fim)return;
 const {data:r}=await supabase.from("agenda_regras").select("*").eq("id",regraId).single(); if(!r)return;
 const rows:any[]=[]; const start=new Date(`${inicio}T00:00:00-03:00`), end=new Date(`${fim}T23:59:59-03:00`);
 for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){ if(d.getDay()!==r.dia_semana)continue; const day=d.toISOString().slice(0,10); let cur=new Date(`${day}T${r.hora_inicio}-03:00`); const last=new Date(`${day}T${r.hora_fim}-03:00`); while(cur<last){ const hh=cur.toTimeString().slice(0,8); const inPause=r.pausa_inicio&&r.pausa_fim&&hh>=r.pausa_inicio&&hh<r.pausa_fim; if(!inPause)rows.push({profissional_id:r.profissional_id,especialidade_id:r.especialidade_id,unidade_id:r.unidade_id,data_hora:cur.toISOString()}); cur=new Date(cur.getTime()+r.intervalo_minutos*60000); }}
 if(rows.length){await supabase.from("agenda_medica").upsert(rows,{onConflict:"profissional_id,data_hora",ignoreDuplicates:true}); await audit(supabase,"gerar_horarios","agenda_regras",regraId,{inicio,fim,total:rows.length});}
 revalidatePath("/admin/agenda"); revalidatePath("/paciente/agendar");
}

export async function criarUsuarioInterno(_prev: unknown, formData: FormData) {
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return {erro:"Sessão inválida."};
 const {data:role}=await supabase.from("user_roles").select("role").eq("user_id",user.id).eq("role","admin").maybeSingle(); if(!role)return {erro:"Somente administrador pode criar usuários."};
 const {createAdminClient}=await import("@/lib/supabase/admin"); const admin=createAdminClient(); if(!admin)return {erro:"Configure SUPABASE_SERVICE_ROLE_KEY no servidor."};
 const email=str(formData,"email"), senha=str(formData,"senha"), nome=str(formData,"nome"), cargo=str(formData,"cargo"); if(!email||!senha||!nome||!cargo)return {erro:"Preencha os campos obrigatórios."};
 const allowed=["admin","gestor","medico","enfermeiro","recepcionista","atendente","administrativo","farmaceutico","laboratorio","radiologista","tecnico_radiologia","tecnico_enfermagem"];
 if(!allowed.includes(cargo))return {erro:"Cargo inválido."};
 const {data,error}=await admin.auth.admin.createUser({email,password:senha,email_confirm:true,user_metadata:{nome}}); if(error||!data.user)return {erro:error?.message||"Falha ao criar usuário."};
 await admin.from("user_roles").delete().eq("user_id",data.user.id); await admin.from("user_roles").insert({user_id:data.user.id,role:cargo});
 await admin.from("profiles").update({nome,cpf:str(formData,"cpf"),unidade_id:str(formData,"unidade_id"),status:"ativo"}).eq("id",data.user.id);
 if(cargo==="medico") await admin.from("profissionais").insert({user_id:data.user.id,nome,cpf:str(formData,"cpf"),registro_profissional:str(formData,"crm"),especialidade_id:str(formData,"especialidade_id"),unidade_id:str(formData,"unidade_id"),email,telefone:str(formData,"telefone"),horario_trabalho:str(formData,"horario_trabalho")});
 await audit(supabase,"criar_usuario","profiles",data.user.id,{cargo}); revalidatePath("/admin/usuarios"); revalidatePath("/admin/profissionais"); return {ok:"Usuário criado com sucesso."};
}

export async function criarPrescricao(formData: FormData){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return;const {data:p}=await s.from("profissionais").select("id").eq("user_id",user.id).single();if(!p)return;const paciente_id=String(formData.get("paciente_id")||"");const {data:pr,error}=await s.from("prescricoes").insert({paciente_id,profissional_id:p.id,orientacoes:str(formData,"orientacoes")}).select("id").single();if(!error&&pr){await s.from("prescricao_itens").insert({prescricao_id:pr.id,medicamento:str(formData,"medicamento")!,dosagem:str(formData,"dosagem"),frequencia:str(formData,"frequencia"),duracao:str(formData,"duracao"),quantidade:str(formData,"quantidade")});await audit(s,"prescrever","prescricoes",pr.id);revalidatePath(`/medico/pacientes/${paciente_id}`);revalidatePath("/farmacia");}}
export async function solicitarExame(formData: FormData){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return;const {data:p}=await s.from("profissionais").select("id").eq("user_id",user.id).single();if(!p)return;const paciente_id=String(formData.get("paciente_id")||"");const {data,error}=await s.from("exames").insert({paciente_id,profissional_id:p.id,tipo:str(formData,"tipo")!,categoria:str(formData,"categoria")!,solicitacao:str(formData,"solicitacao")}).select("id").single();if(!error){await audit(s,"solicitar_exame","exames",data?.id);revalidatePath(`/medico/pacientes/${paciente_id}`);revalidatePath("/laboratorio");revalidatePath("/radiologia");}}
export async function criarEncaminhamento(formData: FormData){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return;const {data:p}=await s.from("profissionais").select("id").eq("user_id",user.id).single();const paciente_id=String(formData.get("paciente_id")||"");const {data,error}=await s.from("encaminhamentos").insert({paciente_id,profissional_id:p?.id,especialidade_id:str(formData,"especialidade_id"),tipo:str(formData,"tipo")!,descricao:str(formData,"descricao")!,prioridade:str(formData,"prioridade")!,created_by:user.id}).select("id").single();if(!error){await audit(s,"encaminhar","encaminhamentos",data?.id);revalidatePath(`/medico/pacientes/${paciente_id}`);}}
export async function dispensarPrescricao(formData: FormData){const s=await createClient();const id=String(formData.get("id")||"");const paciente_id=String(formData.get("paciente_id")||"");const {data:{user}}=await s.auth.getUser();if(!user||!id)return;const {error}=await s.from("dispensacoes").insert({prescricao_id:id,paciente_id,dispensado_por:user.id,observacao:str(formData,"observacao")});if(!error){await s.from("prescricoes").update({status:"dispensada"}).eq("id",id);await audit(s,"dispensar","prescricoes",id);revalidatePath("/farmacia");}}
export async function registrarResultadoExame(formData: FormData){const s=await createClient();const exame_id=String(formData.get("exame_id")||"");const {data:{user}}=await s.auth.getUser();if(!user||!exame_id)return;const {error}=await s.from("resultados_exames").upsert({exame_id,resultado:str(formData,"resultado")!,responsavel_id:user.id},{onConflict:"exame_id"});if(!error){await s.from("exames").update({status:"resultado_disponivel"}).eq("id",exame_id);await audit(s,"registrar_resultado","exames",exame_id);revalidatePath("/laboratorio");}}
export async function registrarLaudo(formData: FormData){const s=await createClient();const exame_id=String(formData.get("exame_id")||"");const {data:{user}}=await s.auth.getUser();if(!user||!exame_id)return;const {error}=await s.from("laudos").upsert({exame_id,laudo:str(formData,"laudo")!,radiologista_id:user.id},{onConflict:"exame_id"});if(!error){await s.from("exames").update({status:"resultado_disponivel"}).eq("id",exame_id);await audit(s,"registrar_laudo","exames",exame_id);revalidatePath("/radiologia");}}

export async function responderEncaminhamento(formData: FormData) {
  const id = str(formData, "id");
  const resposta = str(formData, "resposta");
  if (!id || !resposta || !["confirmado", "cancelado"].includes(resposta)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("responder_encaminhamento", { _id: id, _resposta: resposta });
  if (error) throw new Error(error.message);
  revalidatePath("/paciente/encaminhamentos");
}

export async function registrarExameRealizado(formData: FormData) {
  const id = str(formData, "exame_id");
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_exame_realizado", {
    _exame_id: id, _observacoes: str(formData, "observacoes"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/radiologia");
  revalidatePath("/enfermagem");
  revalidatePath("/paciente/exames");
}

export async function salvarPerfilMedico(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Entre novamente." };
  const { data: profissional } = await supabase.from("profissionais").select("id").eq("user_id", user.id).maybeSingle();
  if (!profissional) return { erro: "Profissional sem vínculo. Procure a administração." };
  // Unidade e especialidade são definidas pela administração, pois determinam vagas de atendimento.
  const { error } = await supabase.rpc("atualizar_perfil_medico", {
    _telefone: str(formData, "telefone"), _horario_trabalho: str(formData, "horario_trabalho"),
  });
  if (error) return { erro: error.message };
  revalidatePath("/medico/perfil");
  return { ok: "Perfil atualizado." };
}

export async function analisarEncaminhamento(formData: FormData) {
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !status || !["solicitado","em_analise","agendado","concluido","cancelado","negado"].includes(status)) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id)
    .in("role", ["admin","gestor","administrativo","atendente","recepcionista"]).limit(1).maybeSingle();
  if (!role) throw new Error("Acesso não autorizado.");
  const { error } = await supabase.from("encaminhamentos").update({
    status, vaga_externa_id: str(formData, "vaga_externa_id"),
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/encaminhamentos");
  revalidatePath("/paciente/encaminhamentos");
}
