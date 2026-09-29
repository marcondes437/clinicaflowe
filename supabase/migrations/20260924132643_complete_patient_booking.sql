-- Pode ser executada diretamente no projeto existente após a correção do login.
-- Não remove pacientes, consultas nem horários cadastrados.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.pacientes_dados_sensiveis (
  paciente_id uuid primary key references public.pacientes(id) on delete cascade,
  cpf text unique, cep text, endereco text, cidade text, estado text,
  contato_emergencia text, created_at timestamptz not null default now()
);
alter table public.pacientes_dados_sensiveis enable row level security;
revoke all on public.pacientes_dados_sensiveis from anon;
grant select, insert, update on public.pacientes_dados_sensiveis to authenticated;
grant all on public.pacientes_dados_sensiveis to service_role;
drop policy if exists paciente_dados_proprios on public.pacientes_dados_sensiveis;
create policy paciente_dados_proprios on public.pacientes_dados_sensiveis
for all to authenticated
using (exists(select 1 from public.pacientes p where p.id = paciente_id and p.user_id = (select auth.uid())))
with check (exists(select 1 from public.pacientes p where p.id = paciente_id and p.user_id = (select auth.uid())));

grant execute on function public.has_role(uuid, public.app_role), public.is_staff(uuid), public.is_admin_gestor(uuid) to authenticated;
do $$ begin
  if to_regprocedure('public.is_clinical_staff(uuid)') is not null then
    execute 'grant execute on function public.is_clinical_staff(uuid) to authenticated';
  end if;
end $$;

create or replace function public.salvar_meus_dados(_dados jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
  v_nome text := nullif(trim(_dados->>'nome_completo'), '');
  v_nascimento date := nullif(_dados->>'data_nascimento', '')::date;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'paciente') then
    raise exception 'Acesso não autorizado';
  end if;
  if v_nome is null or nullif(trim(_dados->>'celular'), '') is null or v_nascimento is null then
    raise exception 'Nome, celular e nascimento são obrigatórios';
  end if;
  if v_nascimento > current_date then raise exception 'Nascimento inválido'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  select id into v_id from public.pacientes where user_id = auth.uid() limit 1;
  if v_id is null then
    insert into public.pacientes(user_id, nome_completo) values(auth.uid(), v_nome) returning id into v_id;
  end if;
  update public.pacientes set nome_completo = v_nome, celular = trim(_dados->>'celular'),
    data_nascimento = v_nascimento where id = v_id;
  insert into public.pacientes_dados_sensiveis(paciente_id, cpf, cep, endereco, cidade, estado, contato_emergencia)
  values(v_id, nullif(regexp_replace(_dados->>'cpf', '\D', '', 'g'), ''),
    _dados->>'cep', _dados->>'endereco', _dados->>'cidade', upper(_dados->>'estado'), _dados->>'contato_emergencia')
  on conflict(paciente_id) do update set cpf = excluded.cpf, cep = excluded.cep,
    endereco = excluded.endereco, cidade = excluded.cidade, estado = excluded.estado,
    contato_emergencia = excluded.contato_emergencia;
  update public.profiles set nome = v_nome, telefone = _dados->>'celular', updated_at = now() where id = auth.uid();
end $$;
revoke all on function public.salvar_meus_dados(jsonb) from public, anon;
grant execute on function public.salvar_meus_dados(jsonb) to authenticated;

-- Leitura agregada: nenhuma identidade profissional sai na lista de vagas.
create or replace function private.horarios_disponiveis_por_especialidade()
returns table(especialidade_id uuid, unidade_id uuid, data_hora timestamptz, vagas bigint)
language sql stable security definer set search_path = '' as $$
  select a.especialidade_id, a.unidade_id, a.data_hora, count(*)
  from public.agenda_medica a
  join public.profissionais p on p.id = a.profissional_id
  join public.especialidades e on e.id = a.especialidade_id
  join public.unidades u on u.id = a.unidade_id
  where auth.uid() is not null and a.status = 'disponivel' and a.data_hora > now()
    and p.status = 'ativo' and e.status = 'ativo' and u.status = 'ativo'
    and p.especialidade_id = a.especialidade_id and p.unidade_id = a.unidade_id
    and not exists(select 1 from public.consultas c where c.profissional_id = p.id
      and c.data_hora = a.data_hora and c.status <> 'cancelada')
  group by a.especialidade_id, a.unidade_id, a.data_hora order by a.data_hora
$$;
revoke all on function private.horarios_disponiveis_por_especialidade() from public, anon;
grant execute on function private.horarios_disponiveis_por_especialidade() to authenticated;
create or replace function public.horarios_disponiveis_por_especialidade()
returns table(especialidade_id uuid, unidade_id uuid, data_hora timestamptz, vagas bigint)
language sql security invoker set search_path = '' as $$
  select * from private.horarios_disponiveis_por_especialidade()
$$;
revoke all on function public.horarios_disponiveis_por_especialidade() from public, anon;
grant execute on function public.horarios_disponiveis_por_especialidade() to authenticated;

create or replace function private.agendar_consulta_automaticamente(
  _paciente_id uuid, _especialidade_id uuid, _unidade_id uuid,
  _data_hora timestamptz, _motivo text default null
)
returns table(id_consulta uuid, nome_profissional text)
language plpgsql security definer set search_path = '' as $$
declare
  v_agenda uuid; v_profissional uuid; v_nome text; v_consulta uuid;
begin
  if auth.uid() is null then raise exception 'Faça login para agendar.'; end if;
  if _data_hora is null or _data_hora <= now() then raise exception 'Escolha um horário futuro.'; end if;
  perform 1 from public.pacientes p where p.id = _paciente_id and p.status = 'ativo'
    and (p.user_id = auth.uid() or public.is_staff(auth.uid())) for update;
  if not found then raise exception 'Paciente inválido para este usuário.'; end if;
  if exists(select 1 from public.consultas where paciente_id = _paciente_id
    and data_hora = _data_hora and status <> 'cancelada') then
    raise exception 'Você já possui uma consulta neste horário.';
  end if;
  select a.id, p.id, p.nome into v_agenda, v_profissional, v_nome
  from public.agenda_medica a
  join public.profissionais p on p.id = a.profissional_id
  join public.especialidades e on e.id = a.especialidade_id
  join public.unidades u on u.id = a.unidade_id
  where a.especialidade_id = _especialidade_id and a.unidade_id = _unidade_id
    and a.data_hora = _data_hora and a.status = 'disponivel'
    and p.status = 'ativo' and e.status = 'ativo' and u.status = 'ativo'
    and p.especialidade_id = _especialidade_id and p.unidade_id = _unidade_id
    and not exists(select 1 from public.consultas c where c.profissional_id = p.id
      and c.data_hora = _data_hora and c.status <> 'cancelada')
  order by a.created_at, a.id limit 1 for update of a skip locked;
  if v_agenda is null then raise exception 'Horário indisponível. Escolha outro.'; end if;
  insert into public.consultas(paciente_id, profissional_id, especialidade_id, unidade_id, data_hora, motivo, created_by)
  values(_paciente_id, v_profissional, _especialidade_id, _unidade_id, _data_hora, nullif(trim(_motivo), ''), auth.uid())
  returning id into v_consulta;
  update public.agenda_medica set status = 'reservado', consulta_id = v_consulta where id = v_agenda;
  return query select v_consulta, v_nome;
end $$;
revoke all on function private.agendar_consulta_automaticamente(uuid, uuid, uuid, timestamptz, text) from public, anon;
grant execute on function private.agendar_consulta_automaticamente(uuid, uuid, uuid, timestamptz, text) to authenticated;
create or replace function public.agendar_consulta_automaticamente(
  _paciente_id uuid, _especialidade_id uuid, _unidade_id uuid, _data_hora timestamptz, _motivo text default null
)
returns table(id_consulta uuid, nome_profissional text)
language sql security invoker set search_path = '' as $$
  select * from private.agendar_consulta_automaticamente(_paciente_id, _especialidade_id, _unidade_id, _data_hora, _motivo)
$$;
revoke all on function public.agendar_consulta_automaticamente(uuid, uuid, uuid, timestamptz, text) from public, anon;
grant execute on function public.agendar_consulta_automaticamente(uuid, uuid, uuid, timestamptz, text) to authenticated;

-- Consulta da própria agenda para o portal médico, sem expor IDs ao paciente.
create or replace function private.minha_agenda_medica()
returns table(data_hora timestamptz, status text)
language sql stable security definer set search_path = '' as $$
  select a.data_hora, a.status from public.agenda_medica a
  join public.profissionais p on p.id = a.profissional_id
  where p.user_id = auth.uid() and public.has_role(auth.uid(), 'medico') and a.data_hora > now()
  order by a.data_hora limit 100
$$;
revoke all on function private.minha_agenda_medica() from public, anon;
grant execute on function private.minha_agenda_medica() to authenticated;
create or replace function public.minha_agenda_medica()
returns table(data_hora timestamptz, status text)
language sql security invoker set search_path = '' as $$ select * from private.minha_agenda_medica() $$;
revoke all on function public.minha_agenda_medica() from public, anon;
grant execute on function public.minha_agenda_medica() to authenticated;
notify pgrst, 'reload schema';
commit;
