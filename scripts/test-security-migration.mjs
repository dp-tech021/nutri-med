import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';

// Only disposable databases inside the local Supabase Docker container.
const container=process.env.NM_LOCAL_DB_CONTAINER || 'supabase_db_nutri-med';
const database='nm_security_qa_'+randomUUID().replaceAll('-','');
const invalidDatabase='nm_security_invalid_'+randomUUID().replaceAll('-','');
const sql=(input,db=database)=>execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-At'],{input,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const files=readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
const hardening=files.filter(f=>f.endsWith('_revoke_rls_auto_enable_public_execute.sql'));
assert.equal(hardening.length,1);
const migration=readFileSync('supabase/migrations/'+hardening[0],'utf8');
const metadata=()=>sql(`select jsonb_build_object('oid',p.oid,'definition',pg_get_functiondef(p.oid),'definer',p.prosecdef,'config',p.proconfig,'triggers',(select jsonb_agg(jsonb_build_object('oid',e.oid,'name',e.evtname,'enabled',e.evtenabled,'event',e.evtevent,'tags',e.evttags)) from pg_event_trigger e where e.evtfoid=p.oid)) from pg_proc p where p.oid='public.rls_auto_enable()'::regprocedure;`);
try {
 sql(`create database ${database};`,'postgres');
 sql('create schema auth; create table auth.users(id uuid primary key);');
 for(const file of files)sql(readFileSync('supabase/migrations/'+file,'utf8'));
 assert.equal(sql("select to_regprocedure('public.rls_auto_enable()') is null;"),'t');
 console.log('PASS: all migrations from empty database; absent managed helper is a safe no-op');
 sql(readFileSync('tests/fixtures/rls-auto-enable.sql','utf8'));
 for(const role of ['anon','authenticated'])assert.equal(sql(`select has_function_privilege('${role}','public.rls_auto_enable()','EXECUTE');`),'t');
 const before=metadata();
 sql(migration);sql(migration);
 assert.equal(metadata(),before,'Function body, SECURITY DEFINER, search_path and event trigger must remain identical');
 for(const role of ['anon','authenticated'])assert.equal(sql(`select has_function_privilege('${role}','public.rls_auto_enable()','EXECUTE');`),'f');
 assert.equal(sql("select not exists(select 1 from pg_proc p, lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where p.oid='public.rls_auto_enable()'::regprocedure and a.grantee=0 and a.privilege_type='EXECUTE');"),'t');
 assert.equal(sql("select has_function_privilege('service_role','public.rls_auto_enable()','EXECUTE');"),'t');
 sql('create table public.qa_create(id integer); create table public.qa_ctas as select 1 as id; select 1 as id into public.qa_select_into;');
 assert.equal(sql("select count(*) from pg_class where relnamespace='public'::regnamespace and relname in ('qa_create','qa_ctas','qa_select_into') and relrowsecurity;"),'3');
 assert.equal(sql("select count(*) from pg_event_trigger where evtname='ensure_rls' and evtfoid='public.rls_auto_enable()'::regprocedure and evtenabled='O';"),'1');
 // Prove the migration fails closed rather than revoking an unexpected function.
 sql(`create database ${invalidDatabase};`,'postgres');
 sql('create function public.rls_auto_enable() returns integer language sql as $$ select 1 $$;',invalidDatabase);
 assert.throws(()=>sql(migration,invalidDatabase),/Unexpected return type/);
 console.log('PASS: PUBLIC/anon/authenticated EXECUTE removed; service_role unchanged; trigger/body/definer/search_path preserved; CREATE TABLE/AS/SELECT INTO still enable RLS; unexpected return type rejected');
} finally {
 sql(`drop database if exists ${invalidDatabase} with (force);`,'postgres');
 sql(`drop database if exists ${database} with (force);`,'postgres');
}
