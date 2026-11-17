import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';

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
  sql(`insert into auth.users values ('00000000-0000-4000-8000-000000000003');
    insert into public.profiles(user_id,kind,display_name) values ('00000000-0000-4000-8000-000000000003','cliente','Cliente legado sintético');
    insert into public.requests(id,client_id,provider_id,service_id,snapshot_title,snapshot_description,need,snapshot_category,snapshot_city,snapshot_modality,snapshot_price_type,snapshot_price_cents)
    values ('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','Anúncio legado','Descrição sintética anterior à migração','Necessidade sintética operacional','limpeza','Cidade QA','presencial','fixo',12300);
    select public.mutate_request('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001','enviar_proposta',null,15000,2,'Escopo sintético anterior à divisão');
    select public.mutate_request('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000003','aceitar',1);`);
  const snapshot=()=>Object.fromEntries(['profiles','services','requests','proposals','contracts','request_events','categories'].map(table=>[
    table,sql(`select coalesce(jsonb_agg(to_jsonb(t) - 'domain' - 'profession' - 'specialty' - 'registration_council' - 'registration_number' - 'registration_jurisdiction' - 'registration_public' order by to_jsonb(t)::text),'[]'::jsonb) from public.${table} t;`).toString().trim()
  ]));
  const before=snapshot();
  sql(readFileSync('supabase/migrations/202611170001_marketplace_domains.sql','utf8'));
  assert.deepEqual(snapshot(),before,'Domain migration changed legacy business records');
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
    sql(migration);
    if(file==='202611170002_initial_health_taxonomy.sql')sql("update public.health_professions set label='Rótulo sintético personalizado' where slug='medico';");
    sql(migration); // Idempotence without deleting or replacing rows.
    if(file==='202611170002_initial_health_taxonomy.sql')sql("do $$ begin if not exists(select 1 from public.health_professions where slug='medico' and label='Rótulo sintético personalizado') then raise exception 'CUSTOM_LABEL_OVERWRITTEN'; end if; end $$;");
  }
  assert.deepEqual(snapshot(),before,'Taxonomy migration changed legacy business records');
  sql(`do $$ begin
    if (select count(*) from public.health_professions) <> 5 then raise exception 'TAXONOMY_DUPLICATED'; end if;
    if (select count(*) from public.health_specialties where slug='atuacao-geral') <> 5 then raise exception 'SPECIALTY_SEED_INVALID'; end if;
    begin
      alter table public.profiles drop constraint profiles_user_domain_unique;
      raise exception 'COMPOSITE_UNIQUE_UNEXPECTEDLY_REMOVABLE';
    exception when dependent_objects_still_exist then null;
    end;
  end $$;`);
  console.log('PASS: five original migrations, pre-migration legacy fixtures, additive migration, preserved full legacy profiles/listings/requests/proposals/contracts/history/categories, domain constraints, seed idempotence and required composite UNIQUE in isolated database');
} finally {
  sql(`drop database if exists ${database} with (force);`,'postgres');
}
