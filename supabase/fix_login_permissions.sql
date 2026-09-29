-- Execute no SQL Editor do projeto bpeeabwursdnibbfvabh.
-- Corrige o erro 42501/403 reproduzido em user_roles após login bem-sucedido.
-- As políticas RLS existentes chamam estas funções com a sessão autenticada.
-- Não altera contas, senhas, cargos nem desabilita RLS.
-- Descobre as assinaturas reais. Algumas instalações não têm is_clinical_staff
-- ou usam outro nome para o enum de cargos. Uma função opcional ausente não
-- deve desfazer a correção das funções que existem.
do $$
declare
  helper record;
  total integer := 0;
begin
  for helper in
    select p.oid::regprocedure as assinatura
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname in ('has_role', 'is_admin_gestor', 'is_staff', 'is_clinical_staff')
  loop
    execute format('grant execute on function %s to authenticated', helper.assinatura);
    total := total + 1;
  end loop;
  if total = 0 then
    raise exception 'Nenhuma função encontrada. Confira se abriu o projeto bpeeabwursdnibbfvabh.';
  end if;
end $$;

-- Todas as linhas retornadas precisam mostrar permitido = true.
select p.oid::regprocedure as funcao,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as permitido
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f'
  and p.proname in ('has_role', 'is_admin_gestor', 'is_staff', 'is_clinical_staff');
