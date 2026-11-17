-- Additive: no records/columns removed; every pre-existing row remains services.
alter table public.profiles add column domain text not null default 'services'
  check (domain in ('health', 'services'));
alter table public.profiles add constraint profiles_user_domain_unique unique(user_id, domain);
alter table public.profiles add column profession text;
alter table public.profiles add column specialty text;
alter table public.profiles add column registration_council text check(char_length(registration_council) between 2 and 30);
alter table public.profiles add column registration_number text check(char_length(registration_number) between 1 and 40);
alter table public.profiles add column registration_jurisdiction text check(char_length(registration_jurisdiction) between 2 and 40);
alter table public.profiles add column registration_public boolean not null default false;

-- Deliberately no production seed: taxonomy requires product approval.
create table public.health_professions (
  slug text primary key check(slug ~ '^[a-z0-9-]{2,40}$'),
  label text not null check(char_length(label) between 2 and 80)
);
create table public.health_specialties (
  profession text not null references public.health_professions(slug),
  slug text not null check(slug ~ '^[a-z0-9-]{2,40}$'),
  label text not null check(char_length(label) between 2 and 80),
  primary key(profession, slug)
);
alter table public.health_professions enable row level security;
alter table public.health_specialties enable row level security;
revoke all on public.health_professions, public.health_specialties from anon, authenticated;
alter table public.profiles add foreign key(profession, specialty) references public.health_specialties(profession, slug);
alter table public.profiles add constraint profiles_domain_attributes check (
  (domain = 'services' and profession is null and specialty is null
    and registration_council is null and registration_number is null and registration_jurisdiction is null and not registration_public)
  or (domain = 'health' and kind = 'prestador' and profession is not null and specialty is not null and category = ''
    and ((registration_council is null and registration_number is null and registration_jurisdiction is null and not registration_public)
      or (registration_council is not null and registration_number is not null and registration_jurisdiction is not null)))
);
alter table public.services add column domain text not null default 'services'
  check(domain in ('health', 'services'));
alter table public.services add constraint services_owner_domain_fk foreign key(owner_id, domain)
  references public.profiles(user_id, domain);
-- Existing category FK retained. Health taxonomies live on the professional profile;
-- 'outros' is only a compatibility storage value, never a health category/filter.
alter table public.services add constraint health_listing_shape check (
  domain = 'services' or (category = 'outros' and price_type = 'orcamento' and price_cents is null)
);
create index services_domain_catalog_idx on public.services(domain, active, created_at desc, id desc);
create index profiles_health_filters_idx on public.profiles(domain, profession, specialty);

-- Prevent the old general-services request form from collecting clinical data.
create function public.guard_request_domain() returns trigger language plpgsql set search_path = '' as $$
begin
  if exists(select 1 from public.services where id = new.service_id and domain = 'health') then
    raise exception 'HEALTH_REQUESTS_UNAVAILABLE' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger requests_domain_guard before insert on public.requests for each row execute function public.guard_request_domain();
