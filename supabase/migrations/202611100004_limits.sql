-- Limite de escrita por usuário, atômico entre múltiplas Edge Functions.
create table public.action_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check(char_length(action) between 1 and 60),
  hour_bucket timestamptz not null,
  attempts integer not null check(attempts between 1 and 100000),
  primary key(user_id,action,hour_bucket)
);
alter table public.action_limits enable row level security;
revoke all on public.action_limits from anon, authenticated;

create or replace function public.consume_action_limit(
  p_user uuid, p_action text, p_limit integer
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare updated integer;
begin
  if p_user is null or char_length(p_action) not between 1 and 60 or p_limit not between 1 and 1000 then
    return false;
  end if;
  insert into public.action_limits(user_id,action,hour_bucket,attempts)
    values(p_user,p_action,date_trunc('hour',now()),1)
  on conflict(user_id,action,hour_bucket) do update
    set attempts = public.action_limits.attempts + 1
    where public.action_limits.attempts < p_limit
  returning attempts into updated;
  return updated is not null;
end $$;
revoke all on function public.consume_action_limit(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.consume_action_limit(uuid,text,integer) to service_role;
-- Limpeza das janelas expiradas precisa ser feita por tarefa administrativa futura.
