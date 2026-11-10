import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';

/**
 * Teste integrado destrutivo SOMENTE no Supabase local.
 * Pré-requisitos: npx supabase start, npm run api:serve e variáveis abaixo.
 * NUNCA execute com credenciais ou URLs de produção.
 */
const URL=process.env.TEST_SUPABASE_URL || 'http://127.0.0.1:54321';
const API=URL+'/functions/v1/api';
const PUBLIC_KEY=process.env.TEST_SUPABASE_ANON_KEY;
const SECRET=process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const ready=PUBLIC_KEY&&SECRET&&URL.includes('127.0.0.1');
const admin=ready?createClient(URL,SECRET,{auth:{autoRefreshToken:false,persistSession:false}}):null;
const makeClient=()=>createClient(URL,PUBLIC_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
const prefix=randomUUID().slice(0,8);
const pass='Local-test-only-Password-9281';
async function request(path,token,method='GET',payload) {
  const response=await fetch(API+path,{method,headers:{
    'content-type':'application/json',apikey:PUBLIC_KEY,...(token?{authorization:'Bearer '+token}:{})
  },...(payload?{body:JSON.stringify(payload)}:{})});
  const data=await response.json().catch(()=>({}));
  return {status:response.status,data};
}
async function makeUser(name,kind) {
  const email=`qa-${prefix}-${kind}-${name.replaceAll(' ','').toLowerCase()}@example.invalid`;
  const {data:created,error}=await admin.auth.admin.createUser({email,password:pass,email_confirm:true});
  assert.ifError(error);
  const client=makeClient();
  const {data:login,error:loginError}=await client.auth.signInWithPassword({email,password:pass});
  assert.ifError(loginError);
  const token=login.session.access_token;
  const profile=await request('/profiles',token,'POST',{kind,display_name:name,city:'São Paulo',category:'limpeza',about:'Profissional de testes da plataforma'});
  assert.equal(profile.status,201,JSON.stringify(profile.data));
  return {token,uid:created.user.id,client};
}
test('fluxo completo, acessos cruzados, concorrência lógica e isolamento direto no banco', {skip:!ready&&'Defina TEST_SUPABASE_ANON_KEY e TEST_SUPABASE_SERVICE_ROLE_KEY de ambiente local'},async()=>{
  const provider=await makeUser('Profissional Demo','prestador');
  const customer=await makeUser('Cliente Demo','cliente');
  const outsider=await makeUser('Terceiro Demo','cliente');
  const health=await request('/health');
  assert.equal(health.status,200);
  const categories=await request('/categories');
  assert.equal(categories.status,200);
  assert(categories.data.some(c=>c.slug==='limpeza'));
  const posted=await request('/services',provider.token,'POST',{
    title:'Limpeza de escritório',description:'Limpeza para ambientes e escritórios pequenos',
    category:'limpeza',city:'São Paulo',modality:'presencial',price_type:'orcamento',price_cents:null
  });
  assert.equal(posted.status,201,JSON.stringify(posted.data));
  const serviceId=posted.data.id;
  const searched=await request('/catalog?q=limp&search_in=service&city=sao%20paulo&category=limpeza');
  assert.equal(searched.status,200,JSON.stringify(searched.data));
  assert(searched.data.items.some(s=>s.id===serviceId));
  const professionalSearch=await request('/catalog?q=prof&search_in=provider');
  assert.equal(professionalSearch.status,200,JSON.stringify(professionalSearch.data));
  assert(professionalSearch.data.items.some(s=>s.id===serviceId));

  const deniedUpdate=await request('/services/'+serviceId,customer.token,'PATCH',{title:'Alteração ilegal'});
  assert.equal(deniedUpdate.status,403);
  const req=await request('/requests',customer.token,'POST',{service_id:serviceId,need:'Preciso de limpeza para o escritório antes de sexta-feira'});
  assert.equal(req.status,201,JSON.stringify(req.data));
  const requestId=req.data.id;
  const others=await request('/requests/'+requestId,outsider.token);
  assert.equal(others.status,404);

  const price1=await request('/requests/'+requestId+'/actions',provider.token,'POST',
    {action:'enviar_proposta',price_cents:25000,duration_days:3,scope:'Limpeza de duas salas e área comum'});
  assert.equal(price1.status,200,JSON.stringify(price1.data));
  const price2=await request('/requests/'+requestId+'/actions',provider.token,'POST',
    {action:'revisar_proposta',price_cents:28000,duration_days:4,scope:'Limpeza de três salas, com material incluso'});
  assert.equal(price2.status,200,JSON.stringify(price2.data));

  const stale=await request('/requests/'+requestId+'/actions',customer.token,'POST',{action:'aceitar',version:1});
  assert.equal(stale.status,409);
  const wrongActor=await request('/requests/'+requestId+'/actions',provider.token,'POST',{action:'aceitar',version:2});
  assert.equal(wrongActor.status,403);
  const accepted=await request('/requests/'+requestId+'/actions',customer.token,'POST',{action:'aceitar',version:2});
  assert.equal(accepted.status,200,JSON.stringify(accepted.data));
  const repeated=await request('/requests/'+requestId+'/actions',customer.token,'POST',{action:'aceitar',version:2});
  assert.equal(repeated.status,200);
  const forbiddenCancel=await request('/requests/'+requestId+'/actions',customer.token,'POST',{action:'cancelar'});
  assert.equal(forbiddenCancel.status,409);
  const forbiddenReview=await request('/requests/'+requestId+'/actions',provider.token,'POST',
    {action:'revisar_proposta',price_cents:99000,duration_days:1,scope:'Tentativa ilegal após aceite'});
  assert.equal(forbiddenReview.status,409);

  for(const [actor,action] of [[provider,'iniciar'],[provider,'finalizar'],[customer,'confirmar']]){
    const response=await request('/requests/'+requestId+'/actions',actor.token,'POST',{action});
    assert.equal(response.status,200,JSON.stringify(response.data));
  }
  const detail=await request('/requests/'+requestId,customer.token);
  assert.equal(detail.status,200);
  assert.equal(detail.data.request.status,'concluido');
  assert.equal(detail.data.contract.price_cents,28000);
  assert.equal(detail.data.proposals.length,2);
  const contracts=await admin.from('contracts').select('request_id').eq('request_id',requestId);
  assert.equal(contracts.data.length,1);
  const direct=await customer.client.from('requests').select('id').eq('id',requestId);
  assert(direct.error || !direct.data?.some(row=>row.id===requestId),'acesso direto ao banco não pode revelar o pedido');
  const disabled=await request('/services/'+serviceId,provider.token,'PATCH',{active:false});
  assert.equal(disabled.status,200);
  const hidden=await request('/services/'+serviceId);
  assert.equal(hidden.status,404);
});
