create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  label text not null unique check(char_length(label) between 2 and 80)
);
insert into public.categories(slug,label) values
  ('limpeza','Limpeza'),
  ('manutencao','Manutenção'),
  ('aulas','Aulas e reforço'),
  ('tecnologia','Tecnologia'),
  ('bem-estar','Bem-estar'),
  ('outros','Outros serviços');
alter table public.categories enable row level security;
revoke all on public.categories from anon, authenticated;
alter table public.services add constraint services_category_fk foreign key(category) references public.categories(slug);
