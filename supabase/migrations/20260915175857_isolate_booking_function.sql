-- Mantém a operação privilegiada fora do schema exposto pela API.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.agendar_consulta_automaticamente(uuid, uuid, uuid, timestamptz, text)
  set schema private;

revoke all on function private.agendar_consulta_automaticamente(uuid, uuid, uuid, timestamptz, text)
  from public, anon, authenticated;
grant execute on function private.agendar_consulta_automaticamente(uuid, uuid, uuid, timestamptz, text)
  to authenticated;

-- RPC pública sem privilégios elevados; apenas encaminha para a função privada,
-- que repete todas as verificações de identidade e propriedade.
create or replace function public.agendar_consulta_automaticamente(
  _paciente_id uuid,
  _especialidade_id uuid,
  _unidade_id uuid,
  _data_hora timestamptz,
  _motivo text default null
)
returns table (id_consulta uuid, nome_profissional text)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.agendar_consulta_automaticamente(
    _paciente_id,
    _especialidade_id,
    _unidade_id,
    _data_hora,
    _motivo
  )
$$;

revoke all on function public.agendar_consulta_automaticamente(uuid, uuid, uuid, timestamptz, text)
  from public, anon;
grant execute on function public.agendar_consulta_automaticamente(uuid, uuid, uuid, timestamptz, text)
  to authenticated;
