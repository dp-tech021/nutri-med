import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/202611100001_init.sql',import.meta.url),'utf8');
const api=readFileSync(new URL('../supabase/functions/api/index.ts',import.meta.url),'utf8');
test('restrições e RLS existem nas seis tabelas',()=>{
  for(const table of ['profiles','services','requests','proposals','contracts','request_events']){
    assert.match(sql,new RegExp('alter table public\\.'+table+' enable row level security;'));
  }
  assert.match(sql,/revoke all on public\.profiles/);
});
test('aceite é uma transação SQL com bloqueio, versão, idempotência e histórico',()=>{
  assert.match(sql,/for update;/i);
  assert.match(sql,/p_version is distinct from r.current_version/);
  assert.match(sql,/request_id uuid primary key references public.requests/);
  assert.match(sql,/insert into public.contracts/);
  assert.match(sql,/return r;/);
  assert.match(sql,/old_status,target/);
});
test('API autentica usuário pelo token e não pelo identificador fornecido',()=>{
  assert.match(api,/db\.auth\.getUser\(/);
  assert.match(api,/whitelist\(/);
  assert.match(api,/await ownedRequest\(/);
  assert.match(api,/UPLOAD_DISABLED_PENDING_VALIDATION/);
});
