-- Administrative event trigger, confirmed as public.rls_auto_enable() -> event_trigger.
-- Application users do not call it directly; PostgreSQL invokes it for DDL.
-- Preserve the function body, SECURITY DEFINER, search_path and ensure_rls trigger.
-- Some clean/local stacks do not install this managed-project helper: do not
-- create it as a side effect of revoking privileges or fail a fresh installation.
do $hardening$
declare
  target oid := pg_catalog.to_regprocedure('public.rls_auto_enable()');
begin
  if target is null then
    raise notice 'public.rls_auto_enable() absent; no EXECUTE privileges to revoke';
    return;
  end if;
  if not exists (
    select 1 from pg_catalog.pg_proc
    where oid = target and prorettype = 'pg_catalog.event_trigger'::pg_catalog.regtype
  ) then
    raise exception 'Unexpected return type for public.rls_auto_enable(); review before hardening';
  end if;
  revoke execute on function public.rls_auto_enable() from public;
  revoke execute on function public.rls_auto_enable() from anon;
  revoke execute on function public.rls_auto_enable() from authenticated;
end
$hardening$;
