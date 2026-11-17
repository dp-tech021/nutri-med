import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';

const url=process.env.TEST_SUPABASE_URL || 'http://127.0.0.1:54321';
const anon=process.env.TEST_SUPABASE_ANON_KEY;
const secret=process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const local=new URL(url);
const ready=Boolean(anon&&secret&&local.protocol==='http:'&&['localhost','127.0.0.1'].includes(local.hostname));
const options={auth:{persistSession:false,autoRefreshToken:false}};
const tables=['profiles','services','requests','proposals','contracts','request_events'];

test('homologação local: Auth, whitelist HTTP, CORS, grants, concorrência e snapshots', {skip:!ready&&'Requer Supabase exclusivamente local e chaves locais'},async()=>{
 const admin=createClient(url,secret,options), users=[];
 const api=async(path,token,method='GET',body,origin)=>{
  const response=await fetch(url+'/functions/v1/api'+path,{method,headers:{apikey:anon,'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{}),...(origin?{origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:response.status,headers:response.headers,data:await response.json().catch(()=>null)};
 };
 const expectStatus=async(label,expected,...args)=>{
  const result=await api(...args);assert.equal(result.status,expected,label+': '+JSON.stringify(result.data));console.log(JSON.stringify({scenario:label,status:result.status}));return result;
 };
 const make=async(name,kind,domain='services')=>{
  const email=`homolog-${randomUUID()}-${name}@example.invalid`, password=randomUUID()+'aA!9';
  const client=createClient(url,anon,options);
  const {data:signup,error}=await client.auth.signUp({email,password});assert.ifError(error);assert(signup.user);users.push(signup.user.id);console.log(JSON.stringify({syntheticAccount:name,email,userId:signup.user.id}));
  assert.ifError((await admin.auth.admin.updateUserById(signup.user.id,{email_confirm:true})).error);
  const {data:login,error:loginError}=await client.auth.signInWithPassword({email,password});assert.ifError(loginError);assert(login.session);
  const refreshed=await client.auth.refreshSession();assert.ifError(refreshed.error);assert(refreshed.data.session);
  const token=refreshed.data.session.access_token;
  await expectStatus('cadastro perfil '+name,201,'/profiles',token,'POST',{kind,domain,display_name:'Homolog '+name,city:'Cidade QA',category:domain==='health'?'':'limpeza',...(domain==='health'?{profession:'medico',specialty:'atuacao-geral'}:{})});
  return {client,token,uid:signup.user.id};
 };
 try{
  const customer=await make('cliente','cliente'),provider=await make('servicos','prestador'),health=await make('saude','prestador','health'),third=await make('terceiro','cliente');
  if(process.env.TEST_SUPABASE_JWT_SECRET){
   const claims=JSON.parse(Buffer.from(customer.token.split('.')[1],'base64url').toString());
   const signed=exp=>{const data=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({...claims,exp})).toString('base64url');return data+'.'+createHmac('sha256',process.env.TEST_SUPABASE_JWT_SECRET).update(data).digest('base64url');};
   const control=await api('/me',signed(Math.floor(Date.now()/1000)+300));
   if(control.status===200)await expectStatus('token expirado com assinatura local válida',401,'/me',signed(Math.floor(Date.now()/1000)-60));
   else console.log('NOT TESTED: expired token; local Auth does not accept HS256 control token');
  }else console.log('NOT TESTED: expired token; local signing secret unavailable');
  await expectStatus('sem sessão',401,'/me');await expectStatus('sessão inválida',401,'/me','invalid-synthetic');
  const authorized=await expectStatus('CORS autorizado',200,'/health',null,'GET',null,'http://localhost:5173');assert.equal(authorized.headers.get('access-control-allow-origin'),'http://localhost:5173');
  const privateCors=await expectStatus('CORS autenticado autorizado',200,'/me',customer.token,'GET',null,'http://localhost:5173');assert.equal(privateCors.headers.get('access-control-allow-origin'),'http://localhost:5173');
  const privateDenied=await expectStatus('CORS autenticado malicioso',403,'/me',customer.token,'GET',null,'https://malicious.invalid');assert.equal(privateDenied.headers.get('access-control-allow-origin'),null);
  const denied=await expectStatus('CORS malicioso',403,'/health',null,'GET',null,'https://malicious.invalid');assert.equal(denied.headers.get('access-control-allow-origin'),null);
  await expectStatus('sem Origin',200,'/health');
  for(const origin of ['http://localhost:5173','https://malicious.invalid']){const response=await api('/requests',null,'OPTIONS',null,origin);assert.equal(response.status,204);assert.equal(response.headers.get('access-control-allow-origin'),origin.includes('localhost')?origin:null);}
  const base={title:'Serviço homologação',description:'Oferta sintética para validar o ciclo completo.',category:'limpeza',city:'Cidade QA',modality:'online',price_type:'fixo',price_cents:12300};
  const service=(await expectStatus('publicar serviço',201,'/services',provider.token,'POST',base)).data;
  await expectStatus('papel incorreto',403,'/services',customer.token,'POST',base);
  assert.ifError((await customer.client.auth.updateUser({data:{kind:'prestador',domain:'health',role:'service_role'}})).error);
  const forged=await customer.client.auth.refreshSession();assert.ifError(forged.error);
  await expectStatus('papel forjado em user_metadata',403,'/services',forged.data.session.access_token,'POST',base);
  await expectStatus('domínio incorreto',400,'/services',health.token,'POST',base);
  await expectStatus('editar terceiro',404,'/services/'+service.id,health.token,'PATCH',{active:false});
  for(const field of ['domain','owner_id','provider_id','client_id','kind','user_id','price','registration_public','unknown']){
   await expectStatus('whitelist anúncio '+field,400,'/services/'+service.id,provider.token,'PATCH',{[field]:field==='registration_public'?true:third.uid});
  }
  for(const field of ['domain','user_id','kind','owner_id','active','price'])await expectStatus('whitelist perfil '+field,400,'/me',provider.token,'PATCH',{[field]:third.uid});
  await expectStatus('registro em Serviços',400,'/me',provider.token,'PATCH',{registration_public:true});
  await expectStatus('registro tipo forjado',400,'/me',health.token,'PATCH',{registration_public:'verified'});
  await expectStatus('verificação forjada',400,'/me',health.token,'PATCH',{verificationStatus:'verified'});
  const offer=(await expectStatus('oferta Saúde sintética',201,'/services',health.token,'POST',{...base,domain:'health',category:'outros',price_type:'orcamento',price_cents:null})).data;
  await expectStatus('request Saúde bloqueada',409,'/requests',customer.token,'POST',{service_id:offer.id});
  for(const query of ['domain=health&category=limpeza','domain=services&profession=medico','domain=services&specialty=atuacao-geral'])await expectStatus('filtro incompatível '+query,400,'/catalog?'+query);
  for(const field of ['domain','owner_id','provider_id','client_id','kind','user_id','active','price','registration_public','unknown'])await expectStatus('whitelist request '+field,400,'/requests',customer.token,'POST',{service_id:service.id,need:'Necessidade sintética operacional', [field]:field==='domain'?'health':third.uid});
  const r=(await expectStatus('criar solicitação',201,'/requests',customer.token,'POST',{service_id:service.id,need:'Necessidade sintética operacional'})).data;
  assert.equal(r.client_id,customer.uid);assert.equal(r.provider_id,provider.uid);assert.equal(r.snapshot_price_cents,12300);
  await expectStatus('pedido alheio',404,'/requests/'+r.id,third.token);
  await expectStatus('ação de terceiro',404,'/requests/'+r.id+'/actions',third.token,'POST',{action:'aceitar',version:1});
  await expectStatus('editar oferta após snapshot',200,'/services/'+service.id,provider.token,'PATCH',{price_cents:50000,title:'Oferta atualizada'});
  for(const action of ['enviar_proposta','revisar_proposta'])await expectStatus(action,200,'/requests/'+r.id+'/actions',provider.token,'POST',{action,price_cents:28000,duration_days:4,scope:'Escopo sintético homologado'});
  await expectStatus('proposta antiga',409,'/requests/'+r.id+'/actions',customer.token,'POST',{action:'aceitar',version:1});
  await expectStatus('prestador não aceita',403,'/requests/'+r.id+'/actions',provider.token,'POST',{action:'aceitar',version:2});
  const accepted=await Promise.all([1,2].map(()=>api('/requests/'+r.id+'/actions',customer.token,'POST',{action:'aceitar',version:2})));
  assert.deepEqual(accepted.map(x=>x.status),[200,200]);
  const contracts=await admin.from('contracts').select('*').eq('request_id',r.id);assert.ifError(contracts.error);assert.equal(contracts.data.length,1);assert.equal(contracts.data[0].accepted_version,2);
  const events=await admin.from('request_events').select('*').eq('request_id',r.id).eq('action','aceitar');assert.ifError(events.error);assert.equal(events.data.length,1);
  for(const [actor,action,state] of [[provider,'iniciar','em_andamento'],[provider,'finalizar','aguardando_confirmacao'],[customer,'confirmar','concluido']]){
   await expectStatus(action,200,'/requests/'+r.id+'/actions',actor.token,'POST',{action});
   const row=await admin.from('requests').select('*').eq('id',r.id).single();assert.ifError(row.error);assert.equal(row.data.status,state);assert.equal(row.data.current_version,2);assert.equal(row.data.snapshot_price_cents,12300);assert.equal(row.data.snapshot_title,base.title);
  }
  const detail=(await api('/requests/'+r.id,customer.token)).data;assert.equal(detail.contract.price_cents,28000);assert.equal(detail.proposals.length,2);assert.equal(detail.events.length,7);
  // Request submission has a frontend lock, but no server idempotency contract.
  const duplicate=await Promise.all([1,2].map(()=>api('/requests',customer.token,'POST',{service_id:service.id,need:'Duplicação sintética controlada'})));
  assert.deepEqual(duplicate.map(x=>x.status),[201,201]);assert.notEqual(duplicate[0].data.id,duplicate[1].data.id);console.log('LIMITATION: duplicate HTTP request creation is not idempotent; frontend lock only');
  for(const client of [createClient(url,anon,options),customer.client,provider.client,health.client,third.client]){
   for(const table of tables){const result=await client.from(table).select('*');assert(result.error,'grants must reject direct '+table);console.log(JSON.stringify({scenario:'direct table '+table,status:result.status}));}
   const rpc=await client.rpc('mutate_request',{p_request:r.id,p_actor:customer.uid,p_action:'aceitar',p_version:2});assert(rpc.error);
  }
  await expectStatus('upload bloqueado',501,'/uploads',customer.token,'POST',{});
  assert.ifError((await third.client.auth.signOut()).error);assert.equal((await third.client.auth.getSession()).data.session,null);
  assert((await third.client.auth.refreshSession()).error);
  // Access JWTs may remain valid until expiry after logout; do not claim immediate revocation.
  console.log('PASS: Auth signup/login/refresh/logout; whitelist; CORS; DB snapshots; two simultaneous accepts -> one contract/event; direct table/RPC denial');
 }finally{
  // Keep synthetic business fixtures in this disposable local stack for inspection.
  for(const user of users)assert.ifError((await admin.auth.admin.updateUserById(user,{ban_duration:'876000h'})).error);
 }
});
