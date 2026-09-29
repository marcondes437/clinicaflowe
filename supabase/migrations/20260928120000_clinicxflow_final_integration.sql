-- ClinicxFlow — integração final administrativa, regulação, transporte e auditoria
begin;

-- Novos perfis sem recriar o enum.
alter type public.app_role add value if not exists 'atendente';
alter type public.app_role add value if not exists 'administrativo';
alter type public.app_role add value if not exists 'farmaceutico';
alter type public.app_role add value if not exists 'laboratorio';
alter type public.app_role add value if not exists 'radiologista';
alter type public.app_role add value if not exists 'tecnico_radiologia';
alter type public.app_role add value if not exists 'tecnico_enfermagem';
commit;

begin;
alter table public.profiles add column if not exists cpf text;
alter table public.profiles add column if not exists unidade_id uuid references public.unidades(id) on delete set null;
alter table public.profiles add column if not exists status public.status_registro not null default 'ativo';
create unique index if not exists profiles_cpf_unique on public.profiles(cpf) where cpf is not null;

-- Cadastro complementar de profissionais
alter table public.profissionais add column if not exists cpf text;
alter table public.profissionais add column if not exists horario_trabalho text;
create unique index if not exists profissionais_cpf_unique on public.profissionais(cpf) where cpf is not null;
create unique index if not exists profissionais_registro_unique on public.profissionais(registro_profissional) where registro_profissional is not null;

-- N:N entre UBS e especialidades
create table if not exists public.unidade_especialidades (
  unidade_id uuid not null references public.unidades(id) on delete cascade,
  especialidade_id uuid not null references public.especialidades(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (unidade_id, especialidade_id)
);

-- Regras recorrentes de agenda. agenda_medica continua sendo a grade materializada.
create table if not exists public.agenda_regras (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid not null references public.profissionais(id) on delete cascade,
  unidade_id uuid not null references public.unidades(id) on delete cascade,
  especialidade_id uuid not null references public.especialidades(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fim time not null,
  intervalo_minutos integer not null default 30 check (intervalo_minutos between 5 and 240),
  pausa_inicio time,
  pausa_fim time,
  status public.status_registro not null default 'ativo',
  created_at timestamptz not null default now(),
  check (hora_fim > hora_inicio)
);

create table if not exists public.vagas_externas (
  id uuid primary key default gen_random_uuid(),
  municipio text not null,
  unidade_destino text not null,
  especialidade_id uuid references public.especialidades(id) on delete set null,
  procedimento text not null,
  quantidade_vagas integer not null check (quantidade_vagas >= 0),
  vagas_utilizadas integer not null default 0 check (vagas_utilizadas >= 0),
  data date not null,
  horario time,
  status text not null default 'disponivel' check (status in ('disponivel','esgotada','cancelada','finalizada')),
  created_at timestamptz not null default now(),
  check (vagas_utilizadas <= quantidade_vagas)
);

create table if not exists public.encaminhamentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  profissional_id uuid references public.profissionais(id) on delete set null,
  especialidade_id uuid references public.especialidades(id) on delete set null,
  vaga_externa_id uuid references public.vagas_externas(id) on delete set null,
  tipo text not null default 'especialidade' check (tipo in ('especialidade','exame','cirurgia','tratamento')),
  descricao text not null,
  prioridade text not null default 'normal' check (prioridade in ('normal','prioritario','urgente')),
  status text not null default 'solicitado' check (status in ('solicitado','em_analise','agendado','concluido','cancelado','negado')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.veiculos (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  placa text not null unique,
  capacidade integer not null check (capacidade > 0),
  acessivel boolean not null default false,
  status public.status_registro not null default 'ativo',
  created_at timestamptz not null default now()
);

create table if not exists public.motoristas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text unique,
  cnh text unique,
  telefone text,
  status public.status_registro not null default 'ativo',
  created_at timestamptz not null default now()
);

create table if not exists public.transportes (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references public.veiculos(id) on delete set null,
  motorista_id uuid references public.motoristas(id) on delete set null,
  municipio_origem text not null,
  municipio_destino text not null,
  local_destino text,
  data date not null,
  horario time not null,
  capacidade integer not null check (capacidade > 0),
  status text not null default 'agendado' check (status in ('agendado','em_rota','realizado','cancelado')),
  created_at timestamptz not null default now()
);

create table if not exists public.solicitacoes_transporte (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  encaminhamento_id uuid references public.encaminhamentos(id) on delete set null,
  transporte_id uuid references public.transportes(id) on delete set null,
  tipo text not null check (tipo in ('consulta','exame','tratamento','cirurgia')),
  municipio_destino text not null,
  local_destino text,
  data_necessaria date not null,
  horario_necessario time,
  observacao text,
  status text not null default 'solicitado' check (status in ('solicitado','em_analise','aprovado','agendado','realizado','cancelado','negado')),
  motivo_decisao text,
  analisado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prescricoes (
  id uuid primary key default gen_random_uuid(), paciente_id uuid not null references public.pacientes(id) on delete restrict,
  profissional_id uuid references public.profissionais(id) on delete set null, consulta_id uuid references public.consultas(id) on delete set null,
  orientacoes text, status text not null default 'ativa' check(status in ('ativa','dispensada','cancelada','expirada')), created_at timestamptz not null default now()
);
create table if not exists public.prescricao_itens (
  id uuid primary key default gen_random_uuid(), prescricao_id uuid not null references public.prescricoes(id) on delete cascade,
  medicamento text not null, dosagem text, frequencia text, duracao text, quantidade text
);
create table if not exists public.dispensacoes (
  id uuid primary key default gen_random_uuid(), prescricao_id uuid not null references public.prescricoes(id) on delete restrict,
  paciente_id uuid not null references public.pacientes(id) on delete restrict, dispensado_por uuid references auth.users(id) on delete set null,
  observacao text, created_at timestamptz not null default now()
);

create table if not exists public.exames (
  id uuid primary key default gen_random_uuid(), paciente_id uuid not null references public.pacientes(id) on delete restrict,
  profissional_id uuid references public.profissionais(id) on delete set null, consulta_id uuid references public.consultas(id) on delete set null,
  tipo text not null, categoria text not null default 'laboratorio' check(categoria in ('laboratorio','imagem','ecg','outro')),
  solicitacao text, status text not null default 'solicitado' check(status in ('solicitado','agendado','coletado','em_analise','resultado_disponivel','cancelado')),
  data_agendada timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.resultados_exames (
  id uuid primary key default gen_random_uuid(), exame_id uuid not null unique references public.exames(id) on delete cascade,
  resultado text not null, arquivo_url text, responsavel_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.laudos (
  id uuid primary key default gen_random_uuid(), exame_id uuid not null unique references public.exames(id) on delete cascade,
  laudo text not null, radiologista_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigserial primary key, user_id uuid references auth.users(id) on delete set null,
  acao text not null, entidade text not null, registro_id text, detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);
create index if not exists solicitacoes_transporte_status_idx on public.solicitacoes_transporte(status, data_necessaria);
create index if not exists vagas_externas_data_idx on public.vagas_externas(data, status);
create index if not exists exames_paciente_idx on public.exames(paciente_id, created_at desc);
create index if not exists encaminhamentos_paciente_idx on public.encaminhamentos(paciente_id, created_at desc);

-- Helpers atualizados para todos os perfis internos.
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role <> 'paciente')
$$;
create or replace function public.is_clinical_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role in ('medico','enfermeiro','tecnico_enfermagem','laboratorio','radiologista','tecnico_radiologia','farmaceutico'))
$$;
create or replace function public.is_admin_gestor(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role in ('admin','gestor','administrativo','atendente','recepcionista'))
$$;

-- RLS padrão para módulos administrativos/regulação.
do $$ declare t text; begin
  foreach t in array array['unidade_especialidades','agenda_regras','vagas_externas','veiculos','motoristas','transportes','audit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists staff_all on public.%I', t);
    execute format('create policy staff_all on public.%I for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()))', t);
    execute format('grant select,insert,update,delete on public.%I to authenticated', t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['encaminhamentos','solicitacoes_transporte','prescricoes','prescricao_itens','dispensacoes','exames','resultados_exames','laudos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select,insert,update on public.%I to authenticated', t);
  end loop;
end $$;

drop policy if exists encaminhamentos_access on public.encaminhamentos;
create policy encaminhamentos_access on public.encaminhamentos for all to authenticated
using (public.is_staff(auth.uid()) or exists(select 1 from public.pacientes p where p.id=paciente_id and p.user_id=auth.uid()))
with check (public.is_staff(auth.uid()));
drop policy if exists transporte_access on public.solicitacoes_transporte;
create policy transporte_access on public.solicitacoes_transporte for all to authenticated
using (public.is_staff(auth.uid()) or exists(select 1 from public.pacientes p where p.id=paciente_id and p.user_id=auth.uid()))
with check (public.is_staff(auth.uid()) or exists(select 1 from public.pacientes p where p.id=paciente_id and p.user_id=auth.uid()));

do $$ declare t text; begin
  foreach t in array array['prescricoes','dispensacoes','exames'] loop
    execute format('drop policy if exists clinical_access on public.%I', t);
    execute format('create policy clinical_access on public.%I for all to authenticated using (public.is_clinical_staff(auth.uid()) or exists(select 1 from public.pacientes p where p.id=paciente_id and p.user_id=auth.uid())) with check (public.is_clinical_staff(auth.uid()))', t);
  end loop;
end $$;

drop policy if exists prescricao_itens_access on public.prescricao_itens;
create policy prescricao_itens_access on public.prescricao_itens for select to authenticated using (
 public.is_clinical_staff(auth.uid()) or exists(select 1 from public.prescricoes pr join public.pacientes p on p.id=pr.paciente_id where pr.id=prescricao_id and p.user_id=auth.uid())
);
create policy prescricao_itens_write on public.prescricao_itens for insert to authenticated with check(public.is_clinical_staff(auth.uid()));
drop policy if exists resultados_access on public.resultados_exames;
create policy resultados_access on public.resultados_exames for all to authenticated using (
 public.is_clinical_staff(auth.uid()) or exists(select 1 from public.exames e join public.pacientes p on p.id=e.paciente_id where e.id=exame_id and p.user_id=auth.uid())
) with check(public.is_clinical_staff(auth.uid()));
drop policy if exists laudos_access on public.laudos;
create policy laudos_access on public.laudos for all to authenticated using (
 public.is_clinical_staff(auth.uid()) or exists(select 1 from public.exames e join public.pacientes p on p.id=e.paciente_id where e.id=exame_id and p.user_id=auth.uid())
) with check(public.is_clinical_staff(auth.uid()));

-- Admin pode gerenciar cargos; usuário só lê os próprios.
drop policy if exists roles_select_own_or_admin on public.user_roles;
create policy roles_select_own_or_admin on public.user_roles for select to authenticated using(user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists roles_admin_write on public.user_roles;
create policy roles_admin_write on public.user_roles for all to authenticated using(public.has_role(auth.uid(),'admin')) with check(public.has_role(auth.uid(),'admin'));
grant insert,update,delete on public.user_roles to authenticated;

-- Admin/gestão podem ler dados cadastrais sensíveis, mas histórico clínico continua protegido por tabelas próprias.
drop policy if exists dados_sensiveis_select on public.pacientes_dados_sensiveis;
create policy dados_sensiveis_select on public.pacientes_dados_sensiveis for select to authenticated using(
 exists(select 1 from public.pacientes p where p.id=paciente_id and p.user_id=auth.uid()) or public.is_clinical_staff(auth.uid()) or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'gestor')
);

-- Auditoria explícita, chamada pelas server actions.
create or replace function public.registrar_auditoria(_acao text,_entidade text,_registro_id text default null,_detalhes jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Não autenticado'; end if;
 insert into public.audit_logs(user_id,acao,entidade,registro_id,detalhes) values(auth.uid(),_acao,_entidade,_registro_id,coalesce(_detalhes,'{}'::jsonb));
end $$;
revoke all on function public.registrar_auditoria(text,text,text,jsonb) from public,anon;
grant execute on function public.registrar_auditoria(text,text,text,jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;
