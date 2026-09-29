-- Execute após as migrations existentes, no SQL Editor do projeto usado pelo site.
-- Seguro para repetir; não apaga pacientes nem consultas.
begin;
create table if not exists public.pacientes_dados_sensiveis (
  paciente_id uuid primary key references public.pacientes(id) on delete cascade,
  cpf text unique, cep text, endereco text, cidade text, estado text,
  contato_emergencia text, created_at timestamptz not null default now()
);
alter table public.pacientes_dados_sensiveis
  add column if not exists tipo_sanguineo text,
  add column if not exists alergias text,
  add column if not exists doencas text,
  add column if not exists deficiencias text;
alter table public.pacientes_dados_sensiveis enable row level security;
grant select, insert, update on public.pacientes_dados_sensiveis to authenticated;
drop policy if exists paciente_sensiveis_select_fix on public.pacientes_dados_sensiveis;
create policy paciente_sensiveis_select_fix on public.pacientes_dados_sensiveis for select to authenticated
using (exists(select 1 from public.pacientes p where p.id=paciente_id and p.user_id=(select auth.uid())));
drop policy if exists paciente_sensiveis_insert_fix on public.pacientes_dados_sensiveis;
create policy paciente_sensiveis_insert_fix on public.pacientes_dados_sensiveis for insert to authenticated
with check (exists(select 1 from public.pacientes p where p.id=paciente_id and p.user_id=(select auth.uid())));
drop policy if exists paciente_sensiveis_update_fix on public.pacientes_dados_sensiveis;
create policy paciente_sensiveis_update_fix on public.pacientes_dados_sensiveis for update to authenticated
using (exists(select 1 from public.pacientes p where p.id=paciente_id and p.user_id=(select auth.uid())))
with check (exists(select 1 from public.pacientes p where p.id=paciente_id and p.user_id=(select auth.uid())));

-- Atualiza a função transacional de cadastro mantendo os demais campos.
create or replace function public.salvar_meus_dados(_dados jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_nome text := nullif(trim(_dados->>'nome_completo'),'');
begin
  if auth.uid() is null or not public.has_role(auth.uid(),'paciente') then raise exception 'Acesso não autorizado'; end if;
  if v_nome is null or nullif(trim(_dados->>'celular'),'') is null or nullif(_dados->>'data_nascimento','') is null then
    raise exception 'Nome, celular e nascimento são obrigatórios'; end if;
  if (_dados->>'data_nascimento')::date > current_date then raise exception 'Nascimento inválido'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  select id into v_id from public.pacientes where user_id=auth.uid() limit 1;
  if v_id is null then
    insert into public.pacientes(user_id,nome_completo,email) values(auth.uid(),v_nome,auth.jwt()->>'email') returning id into v_id;
  end if;
  update public.pacientes set nome_completo=v_nome, celular=trim(_dados->>'celular'),
    data_nascimento=(_dados->>'data_nascimento')::date where id=v_id;
  insert into public.pacientes_dados_sensiveis
    (paciente_id,cpf,cep,endereco,cidade,estado,contato_emergencia,tipo_sanguineo,alergias,doencas,deficiencias)
  values (v_id,nullif(regexp_replace(_dados->>'cpf','\D','','g'),''),_dados->>'cep',_dados->>'endereco',
    _dados->>'cidade',upper(_dados->>'estado'),_dados->>'contato_emergencia',_dados->>'tipo_sanguineo',
    _dados->>'alergias',_dados->>'doencas',_dados->>'deficiencias')
  on conflict(paciente_id) do update set cpf=excluded.cpf,cep=excluded.cep,endereco=excluded.endereco,
    cidade=excluded.cidade,estado=excluded.estado,contato_emergencia=excluded.contato_emergencia,
    tipo_sanguineo=excluded.tipo_sanguineo,alergias=excluded.alergias,doencas=excluded.doencas,deficiencias=excluded.deficiencias;
  update public.profiles set nome=v_nome,telefone=_dados->>'celular',updated_at=now() where id=auth.uid();
end $$;
revoke all on function public.salvar_meus_dados(jsonb) from public,anon;
grant execute on function public.salvar_meus_dados(jsonb) to authenticated;

alter table public.encaminhamentos add column if not exists confirmacao_paciente text
  check (confirmacao_paciente in ('confirmado','cancelado'));
alter table public.encaminhamentos add column if not exists confirmado_em timestamptz;
create or replace function public.responder_encaminhamento(_id uuid,_resposta text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or _resposta not in ('confirmado','cancelado') then raise exception 'Resposta inválida'; end if;
  update public.encaminhamentos e set confirmacao_paciente=_resposta, confirmado_em=now()
  where e.id=_id and e.status='agendado' and e.confirmacao_paciente is null
    and exists(select 1 from public.pacientes p where p.id=e.paciente_id and p.user_id=auth.uid());
  if not found then raise exception 'Encaminhamento indisponível para confirmação'; end if;
end $$;
revoke all on function public.responder_encaminhamento(uuid,text) from public,anon;
grant execute on function public.responder_encaminhamento(uuid,text) to authenticated;

create table if not exists public.exames_realizados (
  id uuid primary key default gen_random_uuid(),
  exame_id uuid not null unique references public.exames(id) on delete cascade,
  realizado_por uuid not null references auth.users(id),
  tipo text not null check(tipo in ('imagem','ecg')),
  observacoes text, realizado_em timestamptz not null default now()
);
alter table public.exames_realizados enable row level security;
grant select,insert on public.exames_realizados to authenticated;
create or replace function public.registrar_exame_realizado(_exame_id uuid,_observacoes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_categoria text; v_tipo text;
begin
  select categoria,tipo into v_categoria,v_tipo from public.exames where id=_exame_id and status in ('solicitado','agendado') for update;
  if v_categoria is null then raise exception 'Exame indisponível'; end if;
  if not ((v_categoria='imagem' and public.has_role(auth.uid(),'tecnico_radiologia'))
    or (v_categoria='ecg' and public.has_role(auth.uid(),'tecnico_enfermagem'))) then raise exception 'Acesso não autorizado'; end if;
  insert into public.exames_realizados(exame_id,realizado_por,tipo,observacoes)
    values(_exame_id,auth.uid(),v_categoria,_observacoes);
  update public.exames set status='coletado' where id=_exame_id;
end $$;
revoke all on function public.registrar_exame_realizado(uuid,text) from public,anon;
grant execute on function public.registrar_exame_realizado(uuid,text) to authenticated;
drop policy if exists exames_realizados_select on public.exames_realizados;
create policy exames_realizados_select on public.exames_realizados for select to authenticated using (
  public.is_clinical_staff(auth.uid()) or exists (
    select 1 from public.exames e join public.pacientes p on p.id=e.paciente_id
    where e.id=exame_id and p.user_id=auth.uid()));
commit;

create or replace function public.atualizar_perfil_medico(_telefone text,_horario_trabalho text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.has_role(auth.uid(),'medico') then raise exception 'Acesso não autorizado'; end if;
  update public.profissionais set telefone=_telefone,horario_trabalho=_horario_trabalho where user_id=auth.uid();
  if not found then raise exception 'Profissional sem vínculo'; end if;
end $$;
revoke all on function public.atualizar_perfil_medico(text,text) from public,anon;
grant execute on function public.atualizar_perfil_medico(text,text) to authenticated;
