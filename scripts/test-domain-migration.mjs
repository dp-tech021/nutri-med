import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

// Local Docker only. Never accepts a remote SQL URL or credentials.
const container=process.env.NM_LOCAL_DB_CONTAINER || 'supabase_db_nutri-med';
const database='nm_domain_qa_'+randomUUID().replaceAll('-','');
const sql=(text,db=database)=>execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1'],{input:text,stdio:['pipe','pipe','pipe']});
try {
  sql(`create database ${database};`,'postgres');
  sql('create schema auth; create table auth.users(id uuid primary key);');
  const migrations=readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
  for(const file of migrations.filter(f=>f<'202611170001_marketplace_domains.sql'))sql(readFileSync('supabase/migrations/'+file,'utf8'));
  sql(`insert into auth.users values ('00000000-0000-4000-8000-000000000001');
    insert into public.profiles(user_id,kind,display_name) values ('00000000-0000-4000-8000-000000000001','prestador','Legado sintético');
    insert into public.services(id,owner_id,title,description,category,city,modality,price_type,price_cents)
    values ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','Anúncio legado','Descrição sintética anterior à migração','limpeza','Cidade QA','presencial','fixo',12300);`);
  sql(readFileSync('supabase/migrations/202611170001_marketplace_domains.sql','utf8'));
  sql(`do $$ begin
    if not exists(select 1 from public.services where id='00000000-0000-4000-8000-000000000002' and domain='services' and price_cents=12300 and category='limpeza') then raise exception 'LEGACY_LISTING_CHANGED'; end if;
    if not exists(select 1 from public.profiles where user_id='00000000-0000-4000-8000-000000000001' and domain='services') then raise exception 'LEGACY_PROFILE_CHANGED'; end if;
    begin
      update public.services set domain='health' where id='00000000-0000-4000-8000-000000000002';
      raise exception 'DOMAIN_MISMATCH_ACCEPTED';
    exception when foreign_key_violation or check_violation then null;
    end;
  end $$;`);
  for(const file of migrations.filter(f=>f>'202611170001_marketplace_domains.sql')) {
    const migration=readFileSync('supabase/migrations/'+file,'utf8');
    sql(migration);sql(migration); // Idempotence without deleting or replacing rows.
  }
  sql(`do $$ begin
    if (select count(*) from public.health_professions) <> 5 then raise exception 'TAXONOMY_DUPLICATED'; end if;
    if (select count(*) from public.health_specialties where slug='atuacao-geral') <> 5 then raise exception 'SPECIALTY_SEED_INVALID'; end if;
    begin
      alter table public.profiles drop constraint profiles_user_domain_unique;
      raise exception 'COMPOSITE_UNIQUE_UNEXPECTEDLY_REMOVABLE';
    exception when dependent_objects_still_exist then null;
    end;
  end $$;`);
  console.log('PASS: five original migrations, pre-migration legacy fixtures, additive migration, preserved IDs/prices/categories domain constraints, seed idempotence and required composite UNIQUE in isolated database');
} finally {
  sql(`drop database if exists ${database} with (force);`,'postgres');
}
