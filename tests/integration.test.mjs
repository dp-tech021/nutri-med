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
const host=new globalThis.URL(URL).hostname;
const ready=Boolean(PUBLIC_KEY&&SECRET&&['127.0.0.1','localhost'].includes(host)&&new globalThis.URL(URL).protocol==='http:');
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
async function makeUser(name,kind,extra={}) {
  const email=`qa-${prefix}-${kind}-${name.replaceAll(' ','').toLowerCase()}@example.invalid`;
  const {data:created,error}=await admin.auth.admin.createUser({email,password:pass,email_confirm:true});
  assert.ifError(error);
  const client=makeClient();
  const {data:login,error:loginError}=await client.auth.signInWithPassword({email,password:pass});
  assert.ifError(loginError);
  const token=login.session.access_token;
  const profile=await request('/profiles',token,'POST',{kind,display_name:name,city:'São Paulo',category:'limpeza',about:'Profissional de testes da plataforma',...extra});
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

test('domínios reais: catálogo, filtros, cursores, legado, perfis e projeções públicas', {skip:!ready&&'Supabase local e chaves locais necessários'},async()=>{
  const profession=`qa-${prefix}`;
  assert.ifError((await admin.from('health_professions').insert({slug:profession,label:'Profissão sintética QA'})).error);
  assert.ifError((await admin.from('health_specialties').insert({profession,slug:'especialidade-qa',label:'Especialidade sintética QA'})).error);
  const health=await makeUser('Saude Sintetica','prestador',{domain:'health',category:'',profession,specialty:'especialidade-qa',registration_council:'CONSELHO-QA',registration_number:'PRIVADO-QA',registration_jurisdiction:'TESTE',registration_public:false});
  const legacy=await makeUser('Legado Sintetico','prestador');
  const client=await makeUser('Cliente Dominios','cliente');
  const base={title:'Descoberta sintética QA',description:'Anúncio exclusivamente sintético de teste.',category:'outros',city:`Cidade QA ${prefix}`,modality:'online',price_type:'orcamento',price_cents:null};
  const posted=[];
  for(let i=0;i<3;i++){
    const r=await request('/services',health.token,'POST',{...base,title:`Descoberta sintética QA ${i}`,domain:'health'});
    assert.equal(r.status,201,JSON.stringify(r.data));posted.push(r.data.id);
  }
  // Omit domain to exercise the pre-existing write contract.
  const old=await request('/services',legacy.token,'POST',{...base,title:'Descoberta sintética QA legado',category:'limpeza'});
  assert.equal(old.status,201,JSON.stringify(old.data));assert.equal(old.data.domain,'services');
  const filter=`q=descoberta&city=${encodeURIComponent(base.city)}&modality=online&limit=1`;
  let cursor;const seen=[];
  do {
    const page=await request('/catalog?domain=health&profession='+profession+'&specialty=especialidade-qa&'+filter+(cursor?'&cursor='+encodeURIComponent(cursor):''));
    assert.equal(page.status,200,JSON.stringify(page.data));
    for(const row of page.data.items){ assert.equal(row.domain,'health');assert.equal(row.profession,profession);seen.push(row.id);assert.equal(row.owner_id,undefined);assert.equal(row.registration_number,undefined);assert.equal(row.search_name,undefined); }
    cursor=page.data.next_cursor;
    if(cursor) assert.equal((await request('/catalog?domain=services&cursor='+encodeURIComponent(cursor))).status,400);
  } while(cursor);
  assert.deepEqual(new Set(seen),new Set(posted));assert.equal(seen.length,posted.length);
  const legacyIds=[old.data.id];
  for(let i=0;i<2;i++){
    const extra=await request('/services',legacy.token,'POST',{...base,title:`Descoberta sintética QA legado ${i}`,category:'limpeza'});
    assert.equal(extra.status,201);legacyIds.push(extra.data.id);
  }
  const seenServices=[];let servicesCursor;
  do {
    const page=await request('/catalog?category=limpeza&'+filter+(servicesCursor?'&cursor='+encodeURIComponent(servicesCursor):''));
    assert.equal(page.status,200,JSON.stringify(page.data));
    assert(page.data.items.every(s=>s.domain==='services'));seenServices.push(...page.data.items.map(s=>s.id));servicesCursor=page.data.next_cursor;
  } while(servicesCursor);
  assert.deepEqual(new Set(seenServices),new Set(legacyIds));assert.equal(seenServices.length,legacyIds.length);
  const legacyCursor=Buffer.from(JSON.stringify({at:old.data.created_at,id:old.data.id})).toString('base64');
  assert.equal((await request('/catalog?cursor='+encodeURIComponent(legacyCursor))).status,200);
  const services=await request('/catalog?category=limpeza&'+filter);
  assert.equal(services.status,200);assert(services.data.items.some(s=>legacyIds.includes(s.id)));assert(services.data.items.every(s=>s.domain==='services'));
  const providerSearch=await request('/catalog?domain=health&q=saude&search_in=provider');
  assert.equal(providerSearch.status,200);assert(providerSearch.data.items.some(s=>posted.includes(s.id)));
  for(const query of ['domain=health&category=limpeza','domain=services&profession='+profession,'domain=cliente','domain=health&unknown=yes'])assert.equal((await request('/catalog?'+query)).status,400);
  const publicProfile=await request('/providers/'+health.uid);
  assert.equal(publicProfile.status,200);assert.equal(publicProfile.data.provider.domain,'health');assert.equal(publicProfile.data.provider.registration_reported,null);
  assert(!JSON.stringify(publicProfile.data).includes('PRIVADO-QA'));assert(!JSON.stringify(publicProfile.data).includes('registration_public'));assert.equal(publicProfile.data.provider.kind,undefined);
  assert(publicProfile.data.services.every(s=>s.domain==='health'));assert.deepEqual(publicProfile.data.modalities,['online']);
  assert.equal((await request('/providers/'+health.uid+'?domain=services')).status,404);
  const detail=await request('/services/'+posted[0]);assert.equal(detail.status,200);assert.equal(detail.data.service.domain,'health');assert.equal((await request('/services/'+posted[0]+'?domain=services')).status,404);assert.equal(detail.data.service.owner_id,undefined);assert(!JSON.stringify(detail.data).includes('PRIVADO-QA'));
  assert.equal((await request('/services/'+old.data.id)).status,200);assert.equal((await request('/providers/'+legacy.uid)).status,200);
  assert.equal((await request('/requests',client.token,'POST',{service_id:posted[0],need:'Texto sintético sem informação clínica'})).status,409);
  assert.equal((await request('/services',health.token,'POST',{...base,domain:'services'})).status,400);
  assert.equal((await request('/services',client.token,'POST',{...base,domain:'health'})).status,403);
  // Validated administrative profile/offer edits: never pass domain from the browser.
  assert.equal((await request('/requests')).status,401);
  const modalities=await request('/services/'+posted[0],health.token,'PATCH',{modality:'presencial'});
  assert.equal(modalities.status,200,JSON.stringify(modalities.data));assert.equal(modalities.data.domain,'health');
  assert.equal((await request('/services/'+posted[0],legacy.token,'PATCH',{modality:'online'})).status,404);
  assert.equal((await request('/services/'+posted[0],client.token,'PATCH',{modality:'online'})).status,403);
  const editedProfile=await request('/me',health.token,'PATCH',{profession,specialty:'especialidade-qa'});
  assert.equal(editedProfile.status,200,JSON.stringify(editedProfile.data));assert.equal(editedProfile.data.domain,'health');
  assert.equal((await request('/me',health.token,'PATCH',{domain:'services'})).status,400);
  assert.equal((await request('/requests',client.token,'POST',{service_id:posted[0],domain:'services',need:'Texto sintético operacional'})).status,400);
  assert.equal((await request('/requests',client.token,'POST',{service_id:posted[0]})).status,409);
  const published=await request('/me',health.token,'PATCH',{registration_public:true});assert.equal(published.status,200,JSON.stringify(published.data));
  assert.equal((await request('/providers/'+health.uid)).data.provider.registration_reported.number,'PRIVADO-QA');
  assert.equal((await request('/me',health.token,'PATCH',{verificationStatus:'verified'})).status,400);
  // Database itself prevents inconsistent ownership and profile specialization.
  assert((await admin.from('services').insert({...base,owner_id:legacy.uid,domain:'health'})).error);
  assert((await admin.from('profiles').update({domain:'services'}).eq('user_id',health.uid)).error);
  const anonymous=makeClient();assert((await anonymous.from('profiles').select('*')).error);
  assert((await anonymous.from('health_professions').select('*')).error);
});
