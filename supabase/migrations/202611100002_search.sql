-- Busca por prefixo: normalização determinística (Português comum).
-- Campos gerados deixam a indexação no banco, não no navegador.
create or replace function public.normalize_search(p_text text)
returns text language sql immutable parallel safe set search_path = ''
as $$
  select trim(regexp_replace(
    translate(lower(coalesce(p_text,'')),
      'áàâãäéèêëíìîïóòôõöúùûüç',
      'aaaaaeeeeiiiiooooouuuuc'), '[[:space:]]+', ' ', 'g'))
$$;
alter table public.services
  add column search_title text generated always as (public.normalize_search(title)) stored,
  add column search_city text generated always as (public.normalize_search(city)) stored,
  add column search_category text generated always as (public.normalize_search(category)) stored;
alter table public.profiles
  add column search_name text generated always as (public.normalize_search(display_name)) stored;
create index services_search_title_idx on public.services (search_title text_pattern_ops) where active=true;
create index services_city_category_idx on public.services(search_city,search_category) where active=true;
create index profiles_search_name_idx on public.profiles (search_name text_pattern_ops);
revoke all on function public.normalize_search(text) from public, anon, authenticated;
grant execute on function public.normalize_search(text) to service_role;
