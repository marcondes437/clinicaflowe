-- Garante que o paciente autenticado possa ler e manter somente os próprios dados.
alter table public.pacientes enable row level security;
alter table public.pacientes_dados_sensiveis enable row level security;

drop policy if exists paciente_proprio_select_fix on public.pacientes;
create policy paciente_proprio_select_fix on public.pacientes for select to authenticated
using (user_id = auth.uid());
drop policy if exists paciente_proprio_insert_fix on public.pacientes;
create policy paciente_proprio_insert_fix on public.pacientes for insert to authenticated
with check (user_id = auth.uid());
drop policy if exists paciente_proprio_update_fix on public.pacientes;
create policy paciente_proprio_update_fix on public.pacientes for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists paciente_sensiveis_select_fix on public.pacientes_dados_sensiveis;
create policy paciente_sensiveis_select_fix on public.pacientes_dados_sensiveis for select to authenticated
using (exists(select 1 from public.pacientes p where p.id = paciente_id and p.user_id = auth.uid()));
drop policy if exists paciente_sensiveis_insert_fix on public.pacientes_dados_sensiveis;
create policy paciente_sensiveis_insert_fix on public.pacientes_dados_sensiveis for insert to authenticated
with check (exists(select 1 from public.pacientes p where p.id = paciente_id and p.user_id = auth.uid()));
drop policy if exists paciente_sensiveis_update_fix on public.pacientes_dados_sensiveis;
create policy paciente_sensiveis_update_fix on public.pacientes_dados_sensiveis for update to authenticated
using (exists(select 1 from public.pacientes p where p.id = paciente_id and p.user_id = auth.uid()))
with check (exists(select 1 from public.pacientes p where p.id = paciente_id and p.user_id = auth.uid()));
