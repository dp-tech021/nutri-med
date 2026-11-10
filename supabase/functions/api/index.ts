import { createClient } from 'npm:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const key = Deno.env.get('SUPABASE_SECRET_KEYS')
  ? JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)['default']
  : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
if (!url || !key) throw new Error('Missing Supabase server configuration');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
type Payload = Record<string, unknown>;
const allowed = new Set((Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173,http://127.0.0.1:5173').split(','));
class Failure extends Error { constructor(public status: number, public code: string) { super(code); } }
const bad = (status: number, code: string): never => { throw new Failure(status, code); };
const getString = (p: Payload, k: string, min = 0, max = 100): string => {
  if (typeof p[k] !== 'string') bad(400, 'INVALID_' + k.toUpperCase());
  const value = (p[k] as string).trim();
  if (value.length < min || value.length > max) bad(400, 'INVALID_' + k.toUpperCase());
  return value;
};
const id = (s: string | undefined) => {
  if (!s || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) bad(400, 'INVALID_ID');
  return s!;
};
const int = (v: unknown, min = 0, max = 100000000) => {
  if (!Number.isSafeInteger(v) || (v as number) < min || (v as number) > max) bad(400, 'INVALID_NUMBER');
  return v as number;
};
const whitelist = (p: Payload, allowed: string[]) => {
  if (Object.keys(p).some(k => !allowed.includes(k))) bad(400, 'UNKNOWN_FIELD');
};
const check = (error: {message: string; code?: string} | null) => {
  if (error) { console.error('database error code', error.code); bad(error.code === '23505' ? 409 : 400, 'OPERATION_FAILED'); }
};
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
const parseBody = async (req: Request): Promise<Payload> => {
  if (Number(req.headers.get('content-length') || 0) > 12000) bad(413, 'BODY_TOO_LARGE');
  const raw = await req.text();
  if (raw.length > 12000) bad(413, 'BODY_TOO_LARGE');
  try {
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object' || Array.isArray(p)) bad(400, 'INVALID_JSON');
    return p;
  } catch { return bad(400, 'INVALID_JSON'); }
};
async function actor(req: Request, verified = false) {
  const match = /^Bearer (.+)$/i.exec(req.headers.get('authorization') ?? '');
  if (!match) bad(401, 'LOGIN_REQUIRED');
  // Every private call validates the bearer token against Supabase Auth.
  const {data, error} = await db.auth.getUser(match![1]);
  if (error || !data.user) bad(401, 'INVALID_SESSION');
  if (verified && !data.user.email_confirmed_at) bad(403, 'EMAIL_NOT_VERIFIED');
  return data.user;
}
async function profile(uid: string) {
  const {data,error} = await db.from('profiles').select('*').eq('user_id',uid).maybeSingle();
  check(error);
  if (!data) bad(403, 'PROFILE_REQUIRED');
  return data!;
}
async function role(req: Request, kind: string, confirmed = true) {
  const user = await actor(req, confirmed);
  const p = await profile(user.id);
  if (p.kind !== kind) bad(403, 'WRONG_ROLE');
  return {user,p};
}
async function ownedRequest(requestId: string, uid: string) {
  const {data,error} = await db.from('requests').select('*').eq('id',requestId).maybeSingle();
  check(error);
  if (!data) bad(404, 'NOT_FOUND');
  if (data!.client_id !== uid && data!.provider_id !== uid) bad(404, 'NOT_FOUND');
  return data!;
}
function textPrefix(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
}
async function handle(req: Request) {
  const path = new URL(req.url).pathname.split('/api').slice(-1)[0] || '/';
  const parts = path.split('/').filter(Boolean);
  const method = req.method;
  if (method === 'GET' && path === '/health') return reply({ok:true});
  if (method === 'GET' && path === '/catalog') {
    const query = new URL(req.url).searchParams;
    const size = Math.min(50,Math.max(1,Number(query.get('limit') || 20)));
    if (!Number.isInteger(size)) bad(400,'INVALID_LIMIT');
    const page = int(Number(query.get('page') || 0),0,100);
    let q = db.from('services').select('id,title,description,category,city,modality,price_type,price_cents,created_at,owner_id,profiles!services_owner_id_fkey(display_name)', {count:'exact'}).eq('active',true);
    for (const filter of ['category','city','modality']) {
      const value=query.get(filter);
      if(value) { if (value.length > 100) bad(400,'INVALID_FILTER'); q=q.eq(filter,value); }
    }
    q=q.order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*size,(page+1)*size-1);
    const {data,error,count}=await q; check(error);
    const result=(data ?? []).map(x=>({...x,owner_id:undefined,provider_name:(x.profiles as unknown as {display_name:string})?.display_name,profiles:undefined}));
    const term=query.get('q');
    if (term) bad(400,'SEARCH_NOT_YET_IMPLEMENTED');
    return reply({items:result,total:count,page,limit:size});
  }
  if (method === 'GET' && parts[0] === 'services' && parts[1]) {
    const {data,error}=await db.from('services').select('id,title,description,category,city,modality,price_type,price_cents,owner_id').eq('id',id(parts[1])).eq('active',true).maybeSingle();check(error);
    if (!data) bad(404,'NOT_FOUND');
    const {data:p}=await db.from('profiles').select('user_id,display_name,city,about,category').eq('user_id',data.owner_id).single();
    return reply({service:{...data,owner_id:undefined},provider:p});
  }
  if (method === 'POST' && path === '/profiles') {
    const u=await actor(req); const p=await parseBody(req);
    whitelist(p,['kind','display_name','city','category','about']);
    const kind=getString(p,'kind',1,20);
    if(!['cliente','prestador'].includes(kind)) bad(400,'INVALID_ROLE');
    const record={user_id:u.id,kind,display_name:getString(p,'display_name',2,100),city:typeof p.city==='string'?getString(p,'city',0,100):'',category:typeof p.category==='string'?getString(p,'category',0,100):'',about:typeof p.about==='string'?getString(p,'about',0,1000):''};
    const {data:old}=await db.from('profiles').select('*').eq('user_id',u.id).maybeSingle();
    if (old) {if(old.kind!==kind) bad(409,'ROLE_IMMUTABLE');return reply(old);}
    const {data,error}=await db.from('profiles').insert(record).select().single();check(error);return reply(data,201);
  }
  if(method==='GET' && path==='/me') {
    const u=await actor(req); return reply(await profile(u.id));
  }
  if(method==='PATCH' && path==='/me') {
    const u=await actor(req); await profile(u.id);const p=await parseBody(req);
    whitelist(p,['display_name','city','category','about']);
    if(!Object.keys(p).length)bad(400,'EMPTY_UPDATE');
    const changes:Payload={};
    for(const [k,max] of [['display_name',100],['city',100],['category',100],['about',1000]] as const)
      if(k in p) changes[k]=getString(p,k,k==='display_name'?2:0,max);
    const {data,error}=await db.from('profiles').update(changes).eq('user_id',u.id).select().single();check(error);return reply(data);
  }
  if(method==='POST' && path==='/services') {
    const {user}=await role(req,'prestador');const p=await parseBody(req);
    whitelist(p,['title','description','category','city','modality','price_type','price_cents']);
    const kind=getString(p,'price_type',3,20),modality=getString(p,'modality',2,20);
    if(!['fixo','inicial','orcamento'].includes(kind)||!['online','presencial'].includes(modality))bad(400,'INVALID_ENUM');
    const price=kind==='orcamento'?null:int(p.price_cents);
    if(kind==='orcamento'&&p.price_cents!=null)bad(400,'PRICE_NOT_ALLOWED');
    const {data,error}=await db.from('services').insert({owner_id:user.id,title:getString(p,'title',3,120),description:getString(p,'description',10,2000),category:getString(p,'category',2,80),city:getString(p,'city',2,100),modality,price_type:kind,price_cents:price}).select().single();check(error);return reply(data,201);
  }
  if(method==='GET'&&path==='/my/services'){
    const {user}=await role(req,'prestador',false);
    const {data,error}=await db.from('services').select('*').eq('owner_id',user.id).order('created_at',{ascending:false}).limit(50);check(error);return reply(data);
  }
  if(method==='PATCH'&&parts[0]==='services'&&parts[1]){
    const {user}=await role(req,'prestador');const p=await parseBody(req);
    whitelist(p,['title','description','category','city','modality','active']);
    const update:Payload={updated_at:new Date().toISOString()};
    for(const [k,min,max] of [['title',3,120],['description',10,2000],['category',2,80],['city',2,100],['modality',2,20]] as const)if(k in p)update[k]=getString(p,k,min,max);
    if('modality'in update&&!['online','presencial'].includes(String(update.modality)))bad(400,'INVALID_MODALITY');
    if('active'in p){if(typeof p.active!=='boolean')bad(400,'INVALID_ACTIVE');update.active=p.active;}
    const {data,error}=await db.from('services').update(update).eq('id',id(parts[1])).eq('owner_id',user.id).select().maybeSingle();check(error);if(!data)bad(404,'NOT_FOUND');return reply(data);
  }
  if(method==='POST'&&path==='/requests'){
    const {user}=await role(req,'cliente');const p=await parseBody(req);whitelist(p,['service_id','need','desired_date']);
    const sid=id(String(p.service_id));const {data:s,error:e}=await db.from('services').select('*').eq('id',sid).eq('active',true).maybeSingle();check(e);if(!s)bad(404,'SERVICE_NOT_FOUND');
    if(s.owner_id===user.id)bad(403,'SELF_REQUEST');
    const date=p.desired_date==null?null:getString(p,'desired_date',10,10);
    if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))bad(400,'INVALID_DATE');
    const {data,error}=await db.from('requests').insert({client_id:user.id,provider_id:s.owner_id,service_id:s.id,snapshot_title:s.title,snapshot_description:s.description,need:getString(p,'need',10,2000),desired_date:date}).select().single();check(error);
    const {error:eventError}=await db.from('request_events').insert({request_id:data.id,actor_id:user.id,action:'criar',from_status:null,to_status:'aguardando_proposta'});check(eventError);
    return reply(data,201);
  }
  if(method==='GET'&&path==='/requests') {
    const u=await actor(req);const p=await profile(u.id);
    const field=p.kind==='cliente'?'client_id':'provider_id';
    const {data,error}=await db.from('requests').select('*').eq(field,u.id).order('created_at',{ascending:false}).limit(50);check(error);return reply(data);
  }
  if(parts[0]==='requests'&&parts[1]&&method==='GET'){
    const u=await actor(req);const request=await ownedRequest(id(parts[1]),u.id);
    const {data:proposals,error:e1}=await db.from('proposals').select('version,price_cents,duration_days,scope,created_at').eq('request_id',request.id).order('version',{ascending:false});check(e1);
    const {data:contract,error:e2}=await db.from('contracts').select('accepted_version,price_cents,duration_days,scope,accepted_at').eq('request_id',request.id).maybeSingle();check(e2);
    const {data:events,error:e3}=await db.from('request_events').select('action,from_status,to_status,created_at').eq('request_id',request.id).order('id',{ascending:true});check(e3);
    return reply({request,proposals,contract,events});
  }
  if(parts[0]==='requests'&&parts[1]&&parts[2]==='actions'&&method==='POST') {
    const user=await actor(req,true);const request=await ownedRequest(id(parts[1]),user.id);
    const p=await parseBody(req);whitelist(p,['action','version','price_cents','duration_days','scope']);
    const action=getString(p,'action',3,40);
    const providerActions=['enviar_proposta','revisar_proposta','recusar_pedido','iniciar','finalizar'];
    const clientActions=['cancelar','recusar_proposta','aceitar','confirmar'];
    if(![...providerActions,...clientActions].includes(action))bad(400,'UNKNOWN_ACTION');
    if(providerActions.includes(action)&&request.provider_id!==user.id)bad(403,'FORBIDDEN');
    if(clientActions.includes(action)&&request.client_id!==user.id)bad(403,'FORBIDDEN');
    const send=['enviar_proposta','revisar_proposta'].includes(action);
    const params={p_request:request.id,p_actor:user.id,p_action:action,p_version:action==='aceitar'?int(p.version,1,1000000):null,
      p_price:send?int(p.price_cents):null,p_days:send?int(p.duration_days,1,365):null,p_scope:send?getString(p,'scope',10,2000):null};
    const {data,error}=await db.rpc('mutate_request',params);
    if(error){if(['40001','23514'].includes(error.code ?? ''))bad(409,'STATE_CONFLICT');if(error.code==='42501')bad(403,'FORBIDDEN');check(error);}
    return reply(data);
  }
  if(path.startsWith('/uploads')) bad(501,'UPLOAD_DISABLED_PENDING_VALIDATION');
  return bad(404,'ROUTE_NOT_FOUND');
}
Deno.serve(async (req: Request) => {
  const origin=req.headers.get('origin');
  const cors:Record<string,string>={Vary:'Origin'};
  if(origin && allowed.has(origin)) {cors['Access-Control-Allow-Origin']=origin;cors['Access-Control-Allow-Headers']='authorization,apikey,content-type';cors['Access-Control-Allow-Methods']='GET,POST,PATCH,OPTIONS';}
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers:cors});
  if(origin && !allowed.has(origin))return reply({error:'ORIGIN_FORBIDDEN'},403);
  try {const result=await handle(req);for(const [k,v] of Object.entries(cors))result.headers.set(k,v);return result;}
  catch(e) {
    const known=e instanceof Failure;
    if(!known)console.error('unexpected api error',e instanceof Error?e.name:'unknown');
    const res=reply({error:known?e.code:'INTERNAL_ERROR'},known?e.status:500);
    for(const [k,v] of Object.entries(cors))res.headers.set(k,v);
    return res;
  }
});
