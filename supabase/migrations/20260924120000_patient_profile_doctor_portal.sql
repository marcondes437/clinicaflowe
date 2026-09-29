-- RLS policies call these helpers as the authenticated role.
grant execute on function public.has_role(uuid, public.app_role),
  public.is_staff(uuid), public.is_admin_gestor(uuid)
  to authenticated;
do $$
begin
  if to_regprocedure('public.is_clinical_staff(uuid)') is not null then
    execute 'grant execute on function public.is_clinical_staff(uuid) to authenticated';
  end if;
end $$;

create or replace function public.salvar_meus_dados(_dados jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
  v_nome text := nullif(trim(_dados->>'nome_completo'), '');
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'paciente') then
    raise exception 'Acesso não autorizado';
  end if;
  if v_nome is null or nullif(trim(_dados->>'celular'), '') is null then
    raise exception 'Nome e celular são obrigatórios';
  end if;
  if nullif(_dados->>'data_nascimento', '')::date > current_date then
    raise exception 'Nascimento inválido';
  end if;
  -- Serialize profile creation for simultaneous saves by the same account.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  select id into v_id from public.pacientes where user_id = auth.uid() limit 1;
  if v_id is null then
    insert into public.pacientes(user_id, nome_completo) values (auth.uid(), v_nome) returning id into v_id;
  end if;
  update public.pacientes set nome_completo = v_nome, celular = _dados->>'celular',
    data_nascimento = nullif(_dados->>'data_nascimento', '')::date where id = v_id;
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

-- Only administrators/managers can write professionals (existing RLS).
-- Linking an account grants access to the doctor's portal atomically.
create or replace function private.vincular_acesso_medico()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.user_id is not null then
    insert into public.user_roles(user_id, role) values(new.user_id, 'medico') on conflict do nothing;
  end if;
  return new;
end $$;
revoke all on function private.vincular_acesso_medico() from public, anon, authenticated;
create trigger profissional_acesso_medico after insert or update of user_id
on public.profissionais for each row execute function private.vincular_acesso_medico();
insert into public.user_roles(user_id, role)
select distinct user_id, 'medico'::public.app_role from public.profissionais where user_id is not null
on conflict do nothing;

create or replace function public.minha_agenda_medica()
returns table(data_hora timestamptz, status text)
language sql security definer set search_path = '' as $$
  select a.data_hora, a.status from public.agenda_medica a
  join public.profissionais p on p.id = a.profissional_id
  where p.user_id = auth.uid() and public.has_role(auth.uid(), 'medico')
    and a.data_hora > now()
  order by a.data_hora limit 100
$$;
revoke all on function public.minha_agenda_medica() from public, anon;
grant execute on function public.minha_agenda_medica() to authenticated;

-- Doctors update only their assigned appointments; operational staff retain access.
drop policy if exists consultas_update on public.consultas;
create policy consultas_update on public.consultas for update to authenticated
using (
  public.is_admin_gestor(auth.uid()) or public.has_role(auth.uid(), 'recepcionista')
  or public.has_role(auth.uid(), 'enfermeiro')
  or exists(select 1 from public.profissionais p where p.id = profissional_id and p.user_id = auth.uid())
)
with check (
  public.is_admin_gestor(auth.uid()) or public.has_role(auth.uid(), 'recepcionista')
  or public.has_role(auth.uid(), 'enfermeiro')
  or exists(select 1 from public.profissionais p where p.id = profissional_id and p.user_id = auth.uid())
);
