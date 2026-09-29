drop policy if exists "pacientes_public_request" on public.pacientes;

create policy "pacientes_public_request" on public.pacientes
  for insert to anon
  with check (user_id is null);

grant insert on public.pacientes to anon;