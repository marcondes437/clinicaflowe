-- Agenda real dos profissionais. O paciente enxerga apenas especialidade,
-- unidade e horário; o profissional é atribuído dentro de uma transação.
create table if not exists public.agenda_medica (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid not null references public.profissionais(id) on delete cascade,
  especialidade_id uuid not null references public.especialidades(id) on delete cascade,
  unidade_id uuid not null references public.unidades(id) on delete cascade,
  data_hora timestamptz not null,
  status text not null default 'disponivel'
    check (status in ('disponivel', 'reservado', 'bloqueado')),
  consulta_id uuid unique references public.consultas(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (profissional_id, data_hora)
);

create index if not exists idx_agenda_medica_busca
  on public.agenda_medica(especialidade_id, unidade_id, data_hora, status);

alter table public.agenda_medica enable row level security;
revoke all on public.agenda_medica from anon, authenticated;
grant select (id, especialidade_id, unidade_id, data_hora, status)
  on public.agenda_medica to authenticated;
grant insert, update, delete on public.agenda_medica to authenticated;
grant all on public.agenda_medica to service_role;

drop policy if exists "agenda_select_safe" on public.agenda_medica;
create policy "agenda_select_safe" on public.agenda_medica
  for select to authenticated
  using (
    public.is_staff((select auth.uid()))
    or (status = 'disponivel' and data_hora > now())
  );

drop policy if exists "agenda_insert_staff" on public.agenda_medica;
create policy "agenda_insert_staff" on public.agenda_medica
  for insert to authenticated
  with check (
    public.is_admin_gestor((select auth.uid()))
    or exists (
      select 1 from public.profissionais p
      where p.id = profissional_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "agenda_update_staff" on public.agenda_medica;
create policy "agenda_update_staff" on public.agenda_medica
  for update to authenticated
  using (
    public.is_admin_gestor((select auth.uid()))
    or exists (
      select 1 from public.profissionais p
      where p.id = profissional_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    public.is_admin_gestor((select auth.uid()))
    or exists (
      select 1 from public.profissionais p
      where p.id = profissional_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "agenda_delete_staff" on public.agenda_medica;
create policy "agenda_delete_staff" on public.agenda_medica
  for delete to authenticated
  using (
    public.is_admin_gestor((select auth.uid()))
    or exists (
      select 1 from public.profissionais p
      where p.id = profissional_id and p.user_id = (select auth.uid())
    )
  );

-- Agendamentos de pacientes passam obrigatoriamente pela função atômica abaixo.
-- Isso impede que o navegador escolha ou altere diretamente o profissional.
drop policy if exists "consultas_insert" on public.consultas;
create policy "consultas_insert" on public.consultas
  for insert to authenticated
  with check (public.is_staff((select auth.uid())));

drop policy if exists "consultas_update" on public.consultas;
create policy "consultas_update" on public.consultas
  for update to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create or replace function public.agendar_consulta_automaticamente(
  _paciente_id uuid,
  _especialidade_id uuid,
  _unidade_id uuid,
  _data_hora timestamptz,
  _motivo text default null
)
returns table (id_consulta uuid, nome_profissional text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_agenda_id uuid;
  v_profissional_id uuid;
  v_profissional_nome text;
  v_consulta_id uuid;
begin
  if v_usuario_id is null then
    raise exception 'Faça login para agendar uma consulta.';
  end if;

  if _data_hora <= now() then
    raise exception 'Escolha um horário futuro.';
  end if;

  if not exists (
    select 1
    from public.pacientes p
    where p.id = _paciente_id
      and (p.user_id = v_usuario_id or public.is_staff(v_usuario_id))
  ) then
    raise exception 'Paciente inválido para este usuário.';
  end if;

  select a.id, a.profissional_id, p.nome
    into v_agenda_id, v_profissional_id, v_profissional_nome
  from public.agenda_medica a
  join public.profissionais p on p.id = a.profissional_id
  where a.especialidade_id = _especialidade_id
    and a.unidade_id = _unidade_id
    and a.data_hora = _data_hora
    and a.status = 'disponivel'
    and p.status = 'ativo'
    and p.especialidade_id = _especialidade_id
    and p.unidade_id = _unidade_id
  order by a.created_at, p.nome
  for update of a skip locked
  limit 1;

  if v_agenda_id is null then
    raise exception 'Este horário acabou de ficar indisponível. Escolha outro.';
  end if;

  insert into public.consultas (
    paciente_id,
    profissional_id,
    especialidade_id,
    unidade_id,
    data_hora,
    motivo,
    created_by
  ) values (
    _paciente_id,
    v_profissional_id,
    _especialidade_id,
    _unidade_id,
    _data_hora,
    nullif(trim(_motivo), ''),
    v_usuario_id
  )
  returning id into v_consulta_id;

  update public.agenda_medica
  set status = 'reservado', consulta_id = v_consulta_id
  where id = v_agenda_id;

  return query select v_consulta_id, v_profissional_nome;
end;
$$;

revoke all on function public.agendar_consulta_automaticamente(uuid, uuid, uuid, timestamptz, text)
  from public, anon;
grant execute on function public.agendar_consulta_automaticamente(uuid, uuid, uuid, timestamptz, text)
  to authenticated;

-- As funções abaixo são auxiliares de RLS/trigger e não devem ser RPCs públicas.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.is_admin_gestor(uuid) from public, anon, authenticated;
revoke execute on function public.is_staff(uuid) from public, anon, authenticated;
do $$
begin
  if to_regprocedure('public.is_clinical_staff(uuid)') is not null then
    execute 'revoke execute on function public.is_clinical_staff(uuid) from public, anon, authenticated';
  end if;
end
$$;
