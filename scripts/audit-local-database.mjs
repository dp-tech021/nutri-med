import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

// No SQL URL accepted: only the disposable local Docker database.
const container=process.env.NM_LOCAL_DB_CONTAINER || 'supabase_db_nutri-med';
const sql=text=>execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],{input:text,encoding:'utf8'}).trim();
const tables=['profiles','services','requests','proposals','contracts','request_events','health_professions','health_specialties','action_limits','categories'];
for(const table of tables){
 assert.equal(sql(`select relrowsecurity from pg_class where oid='public.${table}'::regclass;`),'t',table+' RLS');
 for(const role of ['anon','authenticated']){
  for(const privilege of ['SELECT','INSERT','UPDATE','DELETE'])assert.equal(sql(`select has_table_privilege('${role}','public.${table}','${privilege}');`),'f',role+' '+privilege+' '+table);
 }
}
for(const signature of ['mutate_request(uuid,uuid,text,integer,integer,integer,text)','consume_action_limit(uuid,text,integer)']){
 for(const role of ['anon','authenticated'])assert.equal(sql(`select has_function_privilege('${role}','public.${signature}','EXECUTE');`),'f',role+' '+signature);
 assert.equal(sql(`select has_function_privilege('service_role','public.${signature}','EXECUTE');`),'t');
}
console.log('PASS: RLS + SELECT/INSERT/UPDATE/DELETE revoked for anon/authenticated on 10 business tables; privileged RPC grants restricted');
console.log(sql(`select 'constraints',count(*) from pg_constraint where connamespace='public'::regnamespace
 union all select 'indexes',count(*) from pg_indexes where schemaname='public'
 union all select 'triggers',count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid where c.relnamespace='public'::regnamespace and not t.tgisinternal;`));
console.log(sql('select version,name from supabase_migrations.schema_migrations order by version;'));

const definers=JSON.parse(sql(`select coalesce(json_agg(json_build_object('signature',p.oid::regprocedure::text,'schema',n.nspname,'owner',pg_get_userbyid(p.proowner),'search_path',p.proconfig,'public_execute',exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE'),'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE')) order by p.proname),'[]') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.prosecdef and n.nspname='public';`));
for(const fn of definers){
 assert.equal(fn.public_execute,false,fn.signature+' PUBLIC EXECUTE');
 assert.equal(fn.anon_execute,false,fn.signature+' anon EXECUTE');
 assert.equal(fn.authenticated_execute,false,fn.signature+' authenticated EXECUTE');
 assert(fn.search_path?.some(setting=>setting==='search_path=""'||setting==='search_path='||setting==='search_path=pg_catalog'),fn.signature+' bounded search_path');
}
console.log('SECURITY DEFINER public:',JSON.stringify(definers));
console.log(sql("select n.nspname,count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.prosecdef and n.nspname<>'public' group by n.nspname order by n.nspname;"));
