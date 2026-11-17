/* global document, innerWidth */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';

const base=process.env.SCREENSHOT_BASE_URL||'http://127.0.0.1:5173';
const out=process.env.SCREENSHOT_OUTPUT_DIR||'docs/screenshots/domain-journeys';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']}:{})});
const results=[];
try {
 for(const width of [320,375,768,1024,1440]){
  for(const role of ['visitor','client','services-provider','health-provider','third']){
   const context=await browser.newContext({viewport:{width,height:1000}});
   const health=role==='health-provider';
   const uid=role==='client'?'client-demo':role==='third'?'third-demo':'provider-demo';
   if(role!=='visitor')await context.addInitScript(({uid})=>localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:'synthetic-qa',refresh_token:'synthetic-qa',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,aud:'authenticated',role:'authenticated'}})),{uid});
   const profile={kind:role.includes('provider')?'prestador':'cliente',domain:health?'health':'services',display_name:'Conta sintética QA',city:'Cidade QA',category:health?'':'limpeza',about:'Perfil sintético',...(health?{profession:'prof-qa',specialty:'esp-qa'}:{})};
   const offer={id:'health-demo',domain:'health',title:'Oferta Saúde sintética',description:'Apresentação profissional sintética.',profession:'prof-qa',specialty:'esp-qa',category:'outros',city:'Cidade QA',modality:'online',price_type:'orcamento',price_cents:null,active:true};
   const service={...offer,id:'service-demo',domain:'services',title:'Serviço sintético QA',category:'limpeza',price_type:'fixo',price_cents:15000};
   const request={id:'request-demo',snapshot_title:service.title,need:'Necessidade operacional sintética de orçamento.',desired_date:null,status:'aguardando_proposta',current_version:0,client_id:'client-demo',provider_id:'provider-demo',created_at:'2026-11-17T12:00:00Z'};
   const writes=[];
   await context.route('http://127.0.0.1:54321/**',async route=>{
    const url=new URL(route.request().url());const p=url.pathname.split('/api').at(-1);const method=route.request().method();let data,status=200;
    if(p==='/me'){data=profile;if(method==='PATCH'){const body=route.request().postDataJSON();writes.push({path:p,body});Object.assign(profile,body);}}
    else if(p==='/health-taxonomy')data={professions:[{slug:'prof-qa',label:'Profissão QA'}],specialties:[{profession:'prof-qa',slug:'esp-qa',label:'Especialidade QA'},{profession:'prof-qa',slug:'esp-dois',label:'Outra especialidade QA'}]};
    else if(p==='/my/services')data=[health?offer:service];
    else if(p==='/services/health-demo'&&method==='PATCH'){const body=route.request().postDataJSON();writes.push({path:p,body});Object.assign(offer,body);data=offer;}
    else if(p?.startsWith('/providers/')){
     const isHealth=p.endsWith('provider-health');
     data={provider:{user_id:'provider-demo',display_name:'Perfil público sintético',city:'Cidade QA',about:'Apresentação sintética',domain:isHealth?'health':'services',...(isHealth?{profession:'prof-qa',specialty:'esp-qa',registration_reported:{council:'CONSELHO-QA',number:'123-QA',jurisdiction:'TESTE'}}:{category:'limpeza'})},services:[isHealth?offer:service],modalities:['online']};
    }
    else if(p?.startsWith('/services/'))data={service:p.endsWith('health-demo')?offer:service,provider:{user_id:'provider-demo',display_name:'Prestador sintético',city:'Cidade QA',about:'Apresentação sintética',category:'limpeza'}};
    else if(p==='/requests'){data=method==='POST'?request:role==='third'?[]:[request];if(method==='POST')writes.push({path:p,body:route.request().postDataJSON()});}
    else if(p==='/requests/request-demo'){
     if(role==='third'){status=404;data={error:'NOT_FOUND'};}else data={request,proposals:[],contract:null,events:[{action:'solicitar_orcamento',to_status:request.status,created_at:request.created_at}]};
    }
    else if(p==='/categories')data=[];
    else data={items:[],next_cursor:null};
    await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
   });
   const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/dashboard',{waitUntil:'networkidle'});
   if(role==='visitor'){
    await expect(page.getByRole('heading',{name:'Entrar',exact:true})).toBeVisible();assert.equal(new URL(page.url()).pathname,'/login');
   }else if(health){
    await expect(page.getByRole('heading',{name:'Painel de Saúde',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Solicitar atendimento',exact:true})).toBeDisabled();
    assert.equal(await page.getByRole('textbox').count(),0);assert.equal(await page.getByRole('link',{name:'Propostas',exact:true}).count(),0);
    await page.getByLabel('Especialidade',{exact:false}).selectOption('esp-dois');
    const save=page.getByRole('button',{name:'Salvar perfil profissional',exact:true});await save.focus();await page.keyboard.press('Enter');
    await expect(page.getByText(/Perfil profissional atualizado/)).toBeVisible();await expect(save).toBeFocused();
    const select=page.getByLabel('Modalidade de Oferta Saúde sintética');await select.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');
    await expect(page.getByText('Modalidade de Oferta Saúde sintética atualizada.')).toBeVisible();
    assert.deepEqual(writes[0],{path:'/me',body:{profession:'prof-qa',specialty:'esp-dois'}});assert.deepEqual(writes[1],{path:'/services/health-demo',body:{modality:'presencial'}});
    await page.evaluate(()=>globalThis.scrollTo(0,0));
    await page.screenshot({path:`${out}/${width}-health-dashboard.png`,fullPage:true});
   }else if(role==='services-provider'){
    await expect(page.getByRole('heading',{name:'Painel do prestador',exact:true})).toBeVisible();
    await page.goto(base+'/meus-servicos',{waitUntil:'networkidle'});await expect(page.getByRole('heading',{name:service.title})).toBeVisible();await expect(page.getByRole('link',{name:'Editar',exact:true})).toBeVisible();
   }else if(role==='third'){
    await page.goto(base+'/pedido/request-demo',{waitUntil:'networkidle'});await expect(page.getByText('Solicitação indisponível',{exact:true})).toBeVisible();assert.equal(await page.getByText(request.need,{exact:true}).count(),0);
   }else{
    await expect(page.getByRole('heading',{name:'Minhas solicitações',exact:true})).toBeVisible();
    await page.goto(base+'/servico/service-demo',{waitUntil:'networkidle'});
    const need=page.getByLabel('Descreva sua necessidade',{exact:false});await need.fill(request.need);
    const send=page.getByRole('button',{name:'Enviar solicitação de orçamento',exact:true});await send.focus();await page.keyboard.press('Enter');
    const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Voltar',exact:true})).toBeFocused();
    await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('button',{name:'Enviar solicitação',exact:true})).toBeFocused();
    await page.keyboard.press('Escape');await expect(send).toBeFocused();await page.keyboard.press('Enter');
    await page.getByRole('dialog').getByRole('button',{name:'Enviar solicitação',exact:true}).click();
    await expect(page.getByText('Solicitação enviada',{exact:true})).toBeVisible();await page.getByRole('link',{name:'Acompanhar solicitação',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Histórico',exact:true})).toBeVisible();await expect(page.getByText('solicitar orcamento',{exact:true})).toBeVisible();
    await page.evaluate(()=>globalThis.scrollTo(0,0));
    await page.screenshot({path:`${out}/${width}-services-history.png`,fullPage:true});
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${role} overflow ${width}`);
   // Every actor sees the same honest unavailable administrative request, without clinical input.
   await page.goto(base+'/servico/health-demo',{waitUntil:'networkidle'});
   await expect(page.getByRole('button',{name:'Solicitar atendimento',exact:true})).toBeDisabled();assert.equal(await page.getByRole('textbox').count(),0);
   await page.keyboard.press('Tab');await expect(page.locator(':focus-visible')).toHaveCount(1);
   for(const area of ['health','services']){
    await page.goto(base+'/prestador/provider-'+area,{waitUntil:'networkidle'});
    await expect(page.getByRole('heading',{name:'Perfil público sintético',exact:true})).toBeVisible();
    if(area==='health'){
     await expect(page.getByText(/Registro informado pelo profissional/)).toBeVisible();
     await expect(page.getByText(/Não verificado oficialmente pela plataforma/)).toBeVisible();
     assert.equal(await page.getByText(/Sob orçamento|Preço fixo|R\$/).count(),0);
     assert.equal(await page.getByText('Verificado',{exact:true}).count(),0);
    }else await expect(page.getByText(/150,00/)).toBeVisible();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${area} profile overflow ${width}`);
   }
   assert.deepEqual(errors,[]);results.push({width,role,status:'passed',publicProfiles:'passed',healthSubmission:'blocked-by-contract',clinicalFields:0,horizontalOverflow:false});
   await context.close();
  }
 }
 await writeFile(`${out}/results.json`,JSON.stringify(results,null,2)+'\n');console.log(`PASS: ${results.length} viewport/actor combinations; health administrative submission remains unavailable.`);
}finally{await browser.close();}
