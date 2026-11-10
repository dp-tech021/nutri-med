-- Nutri-Med: banco de negócio acessível apenas pela API server-side.
create extension if not exists pgcrypto;
create extension if not exists unaccent;
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kind text not null check (kind in ('cliente','prestador')),
  display_name text not null check (char_length(display_name) between 2 and 100),
  city text not null default '' check (char_length(city) <= 100),
  category text not null default '' check (char_length(category) <= 100),
  about text not null default '' check (char_length(about) <= 1000),
  created_at timestamptz not null default now()
);
create table public.services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(user_id),
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 2000),
  category text not null check (char_length(category) between 2 and 80),
  city text not null check (char_length(city) between 2 and 100),
  modality text not null check (modality in ('online','presencial')),
  price_type text not null check (price_type in ('fixo','inicial','orcamento')),
  price_cents integer check (price_cents between 0 and 100000000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((price_type = 'orcamento' and price_cents is null) or (price_type <> 'orcamento' and price_cents is not null))
);
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(user_id),
  provider_id uuid not null references public.profiles(user_id),
  service_id uuid not null references public.services(id),
  snapshot_title text not null,
  snapshot_description text not null,
  need text not null check (char_length(need) between 10 and 2000),
  desired_date date,
  status text not null default 'aguardando_proposta' check (status in ('aguardando_proposta','proposta_enviada','pedido_recusado','proposta_recusada','cancelado','contratado','em_andamento','aguardando_confirmacao','concluido')),
  current_version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(client_id <> provider_id)
);
create table public.proposals (
  request_id uuid not null references public.requests(id),
  version integer not null check (version > 0),
  provider_id uuid not null references public.profiles(user_id),
  price_cents integer not null check (price_cents between 0 and 100000000),
  duration_days integer not null check (duration_days between 1 and 365),
  scope text not null check (char_length(scope) between 10 and 2000),
  created_at timestamptz not null default now(),
  primary key(request_id,version)
);
create table public.contracts (
  request_id uuid primary key references public.requests(id),
  accepted_version integer not null,
  price_cents integer not null,
  duration_days integer not null,
  scope text not null,
  accepted_at timestamptz not null default now(),
  foreign key(request_id,accepted_version) references public.proposals(request_id,version)
);
create table public.request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.requests(id),
  actor_id uuid not null references public.profiles(user_id),
  action text not null,
  from_status text,
  to_status text not null,
  created_at timestamptz not null default now()
);
create index services_public_idx on public.services(active,created_at desc,id desc);
create index services_filters_idx on public.services(active,category,city,modality,created_at desc,id desc);
create index requests_client_idx on public.requests(client_id,created_at desc);
create index requests_provider_idx on public.requests(provider_id,created_at desc);
create index events_request_idx on public.request_events(request_id,id);
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.requests enable row level security;
alter table public.proposals enable row level security;
alter table public.contracts enable row level security;
alter table public.request_events enable row level security;
revoke all on public.profiles, public.services, public.requests, public.proposals, public.contracts, public.request_events from anon, authenticated;
-- Trava concorrência no banco: somente service_role executa; identidade validada previamente pela API.
create or replace function public.mutate_request(
  p_request uuid, p_actor uuid, p_action text,
  p_version integer default null, p_price integer default null,
  p_days integer default null, p_scope text default null
) returns public.requests
language plpgsql security definer set search_path = ''
as $$
declare r public.requests; v public.proposals; target text;
begin
  select * into r from public.requests where id = p_request for update;
  if not found then raise exception 'REQUEST_NOT_FOUND' using errcode = 'P0002'; end if;
  if p_action in ('enviar_proposta','revisar_proposta','recusar_pedido','iniciar','finalizar') and r.provider_id <> p_actor then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_action in ('cancelar','recusar_proposta','aceitar','confirmar') and r.client_id <> p_actor then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_action = 'enviar_proposta' and r.status = 'aguardando_proposta' or
     p_action = 'revisar_proposta' and r.status = 'proposta_enviada' then
    if p_price is null or p_price < 0 or p_price > 100000000 or
       p_days is null or p_days < 1 or p_days > 365 or
       p_scope is null or char_length(p_scope) not between 10 and 2000 then
      raise exception 'INVALID_PROPOSAL' using errcode = '22023';
    end if;
    insert into public.proposals(request_id,version,provider_id,price_cents,duration_days,scope)
    values (r.id,r.current_version+1,p_actor,p_price,p_days,p_scope);
    target := 'proposta_enviada';
    update public.requests set current_version=current_version+1 where id=r.id;
  elsif p_action = 'aceitar' and r.status = 'proposta_enviada' then
    if p_version is distinct from r.current_version then raise exception 'STALE_PROPOSAL' using errcode='40001'; end if;
    select * into v from public.proposals where request_id=r.id and version=r.current_version;
    insert into public.contracts(request_id,accepted_version,price_cents,duration_days,scope)
      values(r.id,v.version,v.price_cents,v.duration_days,v.scope);
    target := 'contratado';
  elsif p_action = 'aceitar' and r.status in ('contratado','em_andamento','aguardando_confirmacao','concluido') then
    select * into v from public.proposals where request_id=r.id and version=r.current_version;
    if p_version = v.version then return r; end if;
    raise exception 'STATE_CONFLICT' using errcode='23514';
  elsif p_action = 'recusar_pedido' and r.status = 'aguardando_proposta' then target := 'pedido_recusado';
  elsif p_action = 'cancelar' and r.status in ('aguardando_proposta','proposta_enviada') then target := 'cancelado';
  elsif p_action = 'recusar_proposta' and r.status = 'proposta_enviada' then target := 'proposta_recusada';
  elsif p_action = 'iniciar' and r.status = 'contratado' then target := 'em_andamento';
  elsif p_action = 'finalizar' and r.status = 'em_andamento' then target := 'aguardando_confirmacao';
  elsif p_action = 'confirmar' and r.status = 'aguardando_confirmacao' then target := 'concluido';
  else raise exception 'STATE_CONFLICT' using errcode = '23514';
  end if;
  update public.requests set status=target,updated_at=now() where id=r.id returning * into r;
  insert into public.request_events(request_id,actor_id,action,from_status,to_status)
    values(r.id,p_actor,p_action,(select case when p_action='enviar_proposta' then 'aguardando_proposta'
       when p_action='revisar_proposta' then 'proposta_enviada'
       when p_action='aceitar' then 'proposta_enviada'
       when p_action='recusar_pedido' then 'aguardando_proposta'
       when p_action='cancelar' then 'aguardando_proposta/proposta_enviada'
       when p_action='recusar_proposta' then 'proposta_enviada'
       when p_action='iniciar' then 'contratado'
       when p_action='finalizar' then 'em_andamento'
       when p_action='confirmar' then 'aguardando_confirmacao' end),target);
  return r;
end $$;
revoke all on function public.mutate_request(uuid,uuid,text,integer,integer,integer,text) from public, anon, authenticated;
grant execute on function public.mutate_request(uuid,uuid,text,integer,integer,integer,text) to service_role;
