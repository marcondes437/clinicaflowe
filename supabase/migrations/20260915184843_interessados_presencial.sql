create table public.interessados_presencial (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 2 and 120),
  email text not null unique check (char_length(email) <= 254 and email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  consentimento boolean not null check (consentimento = true),
  texto_consentimento text not null default 'Ao clicar em Enviar, você aceita receber novidades da ClinicaFlow.',
  criado_em timestamptz not null default now()
);
alter table public.interessados_presencial enable row level security;
revoke all on public.interessados_presencial from anon, authenticated;
grant insert (nome, email, consentimento) on public.interessados_presencial to anon, authenticated;
grant select on public.interessados_presencial to authenticated;
create policy interessados_presencial_cadastro on public.interessados_presencial for insert to anon, authenticated with check (consentimento = true and char_length(btrim(nome)) between 2 and 120);
create policy interessados_presencial_admin_leitura on public.interessados_presencial for select to authenticated using ((select public.is_admin_gestor(auth.uid())));
