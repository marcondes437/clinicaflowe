-- ============================================================
-- ClinicxFlow — estrutura completa (Fase 1 + Fase 2 + LGPD)
-- Execute no SQL Editor do Supabase
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
do $$ begin
  create type public.app_role as enum ('admin','gestor','medico','enfermeiro','recepcionista','paciente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_registro as enum ('ativo','inativo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_consulta as enum ('agendada','confirmada','em_atendimento','concluida','cancelada','faltou');
exception when duplicate_object then null; end $$;

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text,
  telefone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ---------- USER ROLES ----------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- staff "geral": inclui admin/gestor — usado para telas operacionais (agenda, unidades, especialidades)
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role in ('admin','gestor','medico','enfermeiro','recepcionista')
  )
$$;

-- staff "clínico": NÃO inclui admin/gestor — usado só para liberar dados sensíveis (CPF/CEP/endereço)
create or replace function public.is_clinical_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role in ('medico','enfermeiro','recepcionista')
  )
$$;

create or replace function public.is_admin_gestor(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role in ('admin','gestor')
  )
$$;

-- ---------- UNIDADES ----------
create table if not exists public.unidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text,
  cidade text,
  estado text,
  telefone text,
  email text,
  horario_funcionamento text,
  status public.status_registro not null default 'ativo',
  created_at timestamptz not null default now()
);
grant select on public.unidades to anon;
grant select, insert, update, delete on public.unidades to authenticated;
grant all on public.unidades to service_role;
alter table public.unidades enable row level security;

-- ---------- ESPECIALIDADES ----------
create table if not exists public.especialidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  imagem_url text,
  status public.status_registro not null default 'ativo',
  created_at timestamptz not null default now()
);
grant select on public.especialidades to anon;
grant select, insert, update, delete on public.especialidades to authenticated;
grant all on public.especialidades to service_role;
alter table public.especialidades enable row level security;

-- ---------- PROFISSIONAIS ----------
create table if not exists public.profissionais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  nome text not null,
  registro_profissional text,
  especialidade_id uuid references public.especialidades(id) on delete set null,
  unidade_id uuid references public.unidades(id) on delete set null,
  telefone text,
  email text,
  descricao text,
  foto_url text,
  status public.status_registro not null default 'ativo',
  created_at timestamptz not null default now()
);
create index if not exists idx_profissionais_esp on public.profissionais(especialidade_id);
create index if not exists idx_profissionais_unid on public.profissionais(unidade_id);
grant select on public.profissionais to anon;
grant select, insert, update, delete on public.profissionais to authenticated;
grant all on public.profissionais to service_role;
alter table public.profissionais enable row level security;

-- ---------- PACIENTES (dados operacionais — visíveis ao staff, inclusive admin) ----------
create table if not exists public.pacientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  nome_completo text not null,
  data_nascimento date,
  telefone text,
  celular text,
  email text,
  observacoes text,
  status public.status_registro not null default 'ativo',
  created_at timestamptz not null default now()
);
create index if not exists idx_pacientes_user on public.pacientes(user_id);
grant select, insert, update, delete on public.pacientes to authenticated;
grant all on public.pacientes to service_role;
alter table public.pacientes enable row level security;

-- ---------- DADOS SENSÍVEIS DO PACIENTE (LGPD — fora do alcance do admin) ----------
create table if not exists public.pacientes_dados_sensiveis (
  paciente_id uuid primary key references public.pacientes(id) on delete cascade,
  cpf text unique,
  cep text,
  endereco text,
  cidade text,
  estado text,
  contato_emergencia text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.pacientes_dados_sensiveis to authenticated;
grant all on public.pacientes_dados_sensiveis to service_role;
alter table public.pacientes_dados_sensiveis enable row level security;

-- ---------- CONSULTAS ----------
create table if not exists public.consultas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  profissional_id uuid references public.profissionais(id) on delete set null,
  especialidade_id uuid references public.especialidades(id) on delete set null,
  unidade_id uuid references public.unidades(id) on delete set null,
  data_hora timestamptz not null,
  status public.status_consulta not null default 'agendada',
  motivo text,
  observacoes text,
  valor numeric(10,2) default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_consultas_data on public.consultas(data_hora);
create index if not exists idx_consultas_paciente on public.consultas(paciente_id);
create index if not exists idx_consultas_profissional on public.consultas(profissional_id);
grant select, insert, update, delete on public.consultas to authenticated;
grant all on public.consultas to service_role;
alter table public.consultas enable row level security;

-- ---------- PRONTUÁRIO / EVOLUÇÕES ----------
create table if not exists public.evolucoes (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  consulta_id uuid references public.consultas(id) on delete set null,
  autor_id uuid references auth.users(id) on delete set null,
  descricao text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.evolucoes to authenticated;
grant all on public.evolucoes to service_role;
alter table public.evolucoes enable row level security;

-- ============================================================
-- POLÍTICAS RLS
-- ============================================================

-- profiles
drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- user_roles
drop policy if exists "roles_select_own_or_admin" on public.user_roles;
create policy "roles_select_own_or_admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin_gestor(auth.uid()));

-- unidades
drop policy if exists "unidades_public_read" on public.unidades;
create policy "unidades_public_read" on public.unidades for select to anon, authenticated using (true);
drop policy if exists "unidades_admin_write" on public.unidades;
create policy "unidades_admin_write" on public.unidades for all to authenticated
  using (public.is_admin_gestor(auth.uid())) with check (public.is_admin_gestor(auth.uid()));

-- especialidades
drop policy if exists "esp_public_read" on public.especialidades;
create policy "esp_public_read" on public.especialidades for select to anon, authenticated using (true);
drop policy if exists "esp_admin_write" on public.especialidades;
create policy "esp_admin_write" on public.especialidades for all to authenticated
  using (public.is_admin_gestor(auth.uid())) with check (public.is_admin_gestor(auth.uid()));

-- profissionais
drop policy if exists "prof_public_read" on public.profissionais;
create policy "prof_public_read" on public.profissionais for select to anon, authenticated using (true);
drop policy if exists "prof_admin_write" on public.profissionais;
create policy "prof_admin_write" on public.profissionais for all to authenticated
  using (public.is_admin_gestor(auth.uid())) with check (public.is_admin_gestor(auth.uid()));

-- pacientes (dados operacionais — staff geral, inclusive admin, pode ver)
drop policy if exists "pacientes_select" on public.pacientes;
create policy "pacientes_select" on public.pacientes for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
drop policy if exists "pacientes_insert" on public.pacientes;
create policy "pacientes_insert" on public.pacientes for insert to authenticated
  with check (user_id = auth.uid() or public.is_staff(auth.uid()));
drop policy if exists "pacientes_update" on public.pacientes;
create policy "pacientes_update" on public.pacientes for update to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()))
  with check (user_id = auth.uid() or public.is_staff(auth.uid()));
drop policy if exists "pacientes_delete" on public.pacientes;
create policy "pacientes_delete" on public.pacientes for delete to authenticated
  using (public.is_admin_gestor(auth.uid()));

-- pacientes_dados_sensiveis (LGPD — dono do dado + staff CLÍNICO; admin/gestor NÃO entram)
drop policy if exists "dados_sensiveis_select" on public.pacientes_dados_sensiveis;
create policy "dados_sensiveis_select" on public.pacientes_dados_sensiveis for select to authenticated
  using (
    exists (select 1 from public.pacientes p where p.id = pacientes_dados_sensiveis.paciente_id and p.user_id = auth.uid())
    or public.is_clinical_staff(auth.uid())
  );
drop policy if exists "dados_sensiveis_insert" on public.pacientes_dados_sensiveis;
create policy "dados_sensiveis_insert" on public.pacientes_dados_sensiveis for insert to authenticated
  with check (
    exists (select 1 from public.pacientes p where p.id = paciente_id and p.user_id = auth.uid())
    or public.is_clinical_staff(auth.uid())
  );
drop policy if exists "dados_sensiveis_update" on public.pacientes_dados_sensiveis;
create policy "dados_sensiveis_update" on public.pacientes_dados_sensiveis for update to authenticated
  using (
    exists (select 1 from public.pacientes p where p.id = pacientes_dados_sensiveis.paciente_id and p.user_id = auth.uid())
    or public.is_clinical_staff(auth.uid())
  );
drop policy if exists "dados_sensiveis_delete" on public.pacientes_dados_sensiveis;
create policy "dados_sensiveis_delete" on public.pacientes_dados_sensiveis for delete to authenticated
  using (public.is_clinical_staff(auth.uid()));

-- consultas
drop policy if exists "consultas_select" on public.consultas;
create policy "consultas_select" on public.consultas for select to authenticated
  using (
    public.is_staff(auth.uid())
    or exists (select 1 from public.pacientes p where p.id = consultas.paciente_id and p.user_id = auth.uid())
  );
drop policy if exists "consultas_insert" on public.consultas;
create policy "consultas_insert" on public.consultas for insert to authenticated
  with check (
    public.is_staff(auth.uid())
    or exists (select 1 from public.pacientes p where p.id = paciente_id and p.user_id = auth.uid())
  );
drop policy if exists "consultas_update" on public.consultas;
create policy "consultas_update" on public.consultas for update to authenticated
  using (
    public.is_staff(auth.uid())
    or exists (select 1 from public.pacientes p where p.id = consultas.paciente_id and p.user_id = auth.uid())
  )
  with check (
    public.is_staff(auth.uid())
    or exists (select 1 from public.pacientes p where p.id = consultas.paciente_id and p.user_id = auth.uid())
  );
drop policy if exists "consultas_delete" on public.consultas;
create policy "consultas_delete" on public.consultas for delete to authenticated
  using (public.is_admin_gestor(auth.uid()));

-- evolucoes
drop policy if exists "evolucoes_select" on public.evolucoes;
create policy "evolucoes_select" on public.evolucoes for select to authenticated
  using (
    public.is_staff(auth.uid())
    or exists (select 1 from public.pacientes p where p.id = evolucoes.paciente_id and p.user_id = auth.uid())
  );
drop policy if exists "evolucoes_write" on public.evolucoes;
create policy "evolucoes_write" on public.evolucoes for insert to authenticated
  with check (public.is_staff(auth.uid()));

-- ============================================================
-- TRIGGER: cria profile + cargo padrão (paciente) no signup
-- CPF/CEP NÃO entram aqui — são gravados depois, direto em
-- pacientes_dados_sensiveis, pelo próprio formulário de cadastro.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email, telefone)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome',''), new.email, new.raw_user_meta_data->>'telefone')
  on conflict (id) do nothing;

  -- Segurança: todo cadastro público nasce como 'paciente'.
  -- Cargos de equipe são atribuídos apenas por um administrador em public.user_roles.
  insert into public.user_roles (user_id, role)
  values (new.id, 'paciente')
  on conflict do nothing;

  insert into public.pacientes (user_id, nome_completo, email, telefone)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), new.email, new.raw_user_meta_data->>'telefone');

  return new;
end $$;

-- Funções SECURITY DEFINER são usadas apenas internamente por triggers e RLS.
-- Impede chamadas diretas pela API REST.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.is_admin_gestor(uuid) from public, anon, authenticated;
revoke execute on function public.is_staff(uuid) from public, anon, authenticated;
revoke execute on function public.is_clinical_staff(uuid) from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- SEED
-- ============================================================
insert into public.especialidades (nome, descricao) values
  ('Clínica Geral','Avaliação e acompanhamento de saúde geral.'),
  ('Cardiologia','Prevenção e tratamento de doenças do coração.'),
  ('Pediatria','Cuidado integral da criança e do adolescente.'),
  ('Ginecologia','Saúde da mulher em todas as fases da vida.'),
  ('Dermatologia','Diagnóstico e tratamento da pele.'),
  ('Ortopedia','Tratamento de ossos, músculos e articulações.'),
  ('Odontologia','Saúde bucal preventiva e restauradora.'),
  ('Enfermagem','Procedimentos, curativos e acompanhamento.'),
  ('Nutrição','Planos alimentares e acompanhamento nutricional.')
on conflict (nome) do nothing;

insert into public.unidades (nome, endereco, cidade, estado, telefone, email, horario_funcionamento)
select 'ClinicxFlow Centro','Av. Paulista, 1000','São Paulo','SP','(11) 4000-1000','centro@clinicxflow.com.br','Seg a Sex, 7h às 19h'
where not exists (select 1 from public.unidades);

insert into public.unidades (nome, endereco, cidade, estado, telefone, email, horario_funcionamento)
select 'ClinicxFlow Zona Norte','Rua das Acácias, 250','São Paulo','SP','(11) 4000-2000','norte@clinicxflow.com.br','Seg a Sáb, 8h às 18h'
where not exists (select 1 from public.unidades where nome = 'ClinicxFlow Zona Norte');
