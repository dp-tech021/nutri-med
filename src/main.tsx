import React, {useEffect, useState} from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import {api,money,supabase,type Service,type RequestItem,type Proposal} from './api';
import './index.css';

type Profile={kind:'cliente'|'prestador';display_name:string;city:string;category:string;about:string};
type AppContext={session:Session|null;profile:Profile|null;refresh:()=>Promise<void>};
const Context=React.createContext<AppContext>({session:null,profile:null,refresh:async()=>{}});
const useApp=()=>React.useContext(Context);
const errorMessage=(error:unknown)=>error instanceof Error?error.message:'Erro inesperado';
function Layout({children}:{children:React.ReactNode}) {
  const {session,profile}=useApp();
  return <><header className="bg-white border-b border-emerald-100"><nav className="max-w-5xl mx-auto p-4 flex flex-wrap gap-4 items-center justify-between">
    <Link className="font-bold text-xl no-underline" to="/">Nutri-Med</Link><div className="flex gap-3 flex-wrap">
    <Link to="/">Catálogo</Link>{session?<><Link to="/dashboard">Painel</Link><span>{profile?.display_name||'Conta'}</span><button className="btn btn-outline" onClick={()=>void supabase.auth.signOut()}>Sair</button></>:<><Link to="/login">Entrar</Link><Link to="/cadastro">Cadastrar</Link></>}</div></nav></header><main className="max-w-5xl mx-auto p-4 md:p-8">{children}</main><footer className="max-w-5xl mx-auto p-5 text-sm muted">Protótipo do MVP. Sem pagamentos na plataforma.</footer></>;
}
function Notice({error,ok}:{error?:string;ok?:string}) {return <>{error&&<p role="alert" className="error">{error}</p>}{ok&&<p role="status">{ok}</p>}</>}
function Auth({mode}:{mode:'login'|'cadastro'|'recuperar'}) {
  const navigate=useNavigate();
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[kind,setKind]=useState<'cliente'|'prestador'>('cliente'),[city,setCity]=useState(''),[about,setAbout]=useState(''),[category,setCategory]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[ok,setOk]=useState('');
  async function submit(event:React.FormEvent) {
    event.preventDefault();setBusy(true);setError('');setOk('');
    try {
      if(mode==='recuperar'){const {error:e}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/atualizar-senha'});if(e)throw e;setOk('Se a conta existir, você receberá instruções no e-mail.');}
      else if(mode==='cadastro'){
        const {error:e}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/login'}});if(e)throw e;
        sessionStorage.setItem('registration',JSON.stringify({kind,display_name:name,city,category,about}));
        setOk('Cadastro solicitado. Confirme seu e-mail e faça login para finalizar seu perfil.');
      } else {
        const {error:e}=await supabase.auth.signInWithPassword({email,password});if(e)throw e;navigate('/dashboard');
      }
    } catch(e) {setError(errorMessage(e));} finally {setBusy(false);}
  }
  return <Layout><div className="card max-w-lg mx-auto"><h1 className="font-bold text-2xl mb-4">{mode==='cadastro'?'Criar conta':mode==='recuperar'?'Recuperar senha':'Entrar'}</h1>
    <form onSubmit={e=>void submit(e)}>
      {mode==='cadastro'&&<><label className="field">Nome<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>
        <label className="field">Tipo de conta<select value={kind} onChange={e=>setKind(e.target.value as 'cliente'|'prestador')}><option value="cliente">Cliente</option><option value="prestador">Prestador</option></select></label>
        {kind==='prestador'&&<><label className="field">Cidade<input value={city} maxLength={100} onChange={e=>setCity(e.target.value)}/></label><label className="field">Categoria<input value={category} maxLength={100} onChange={e=>setCategory(e.target.value)}/></label><label className="field">Apresentação<textarea value={about} maxLength={1000} onChange={e=>setAbout(e.target.value)}/></label></>}</>}
      <label className="field">E-mail<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      {mode!=='recuperar'&&<label className="field">Senha<input type="password" minLength={8} required autoComplete={mode==='cadastro'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>}
      <button className="btn mt-3" disabled={busy}>{busy?'Processando...':'Continuar'}</button><Notice error={error} ok={ok}/>
    </form><p className="mt-4"><Link to="/recuperar">Esqueci a senha</Link></p></div></Layout>;
}
function ResetPassword(){
  const {session}=useApp();const [password,setPassword]=useState(''),[error,setError]=useState(''),[ok,setOk]=useState(''),[busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{
    const {error:err}=await supabase.auth.updateUser({password});
    if(err)throw err;setOk('Senha atualizada. Agora você pode entrar com a nova senha.');
  }catch(err){setError(errorMessage(err));}finally{setBusy(false);}}
  return <Layout><section className="card max-w-lg mx-auto"><h1 className="text-2xl font-bold">Definir nova senha</h1>{!session?<p>Abra o link de recuperação recebido por e-mail. Se estiver expirado, solicite outro.</p>:<form onSubmit={e=>void submit(e)}><label className="field">Nova senha<input required type="password" autoComplete="new-password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy} className="btn">Atualizar senha</button></form>}<Notice error={error} ok={ok}/></section></Layout>;
}
function Catalog(){
  const [categories,setCategories]=useState<{slug:string;label:string}[]>([]);useEffect(()=>{void api<{slug:string;label:string}[]>('/categories').then(setCategories).catch(()=>{});},[]);
  const [items,setItems]=useState<Service[]>([]),[error,setError]=useState(''),[category,setCategory]=useState(''),[city,setCity]=useState(''),[term,setTerm]=useState(''),[searchIn,setSearchIn]=useState('service'),[modality,setModality]=useState(''),[cursor,setCursor]=useState<string|null>(null),[loading,setLoading]=useState(false);
  const [filters,setFilters]=useState({category:'',city:'',term:'',searchIn:'service',modality:''});
  useEffect(()=>{
    let live=true;setLoading(true);setError('');
    const params=new URLSearchParams({limit:'12'});
    if(filters.category)params.set('category',filters.category);
    if(filters.city)params.set('city',filters.city);
    if(filters.modality)params.set('modality',filters.modality);
    if(filters.term){params.set('q',filters.term);params.set('search_in',filters.searchIn);}
    void api<{items:Service[];next_cursor:string|null}>('/catalog?'+params).then(r=>{if(live){setItems(r.items);setCursor(r.next_cursor);}}).catch(e=>{if(live)setError(errorMessage(e));}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false};
  },[filters]);
  async function more(){
    if(!cursor)return;setLoading(true);
    const params=new URLSearchParams({limit:'12',cursor});
    if(filters.category)params.set('category',filters.category);
    if(filters.city)params.set('city',filters.city);
    if(filters.modality)params.set('modality',filters.modality);
    if(filters.term){params.set('q',filters.term);params.set('search_in',filters.searchIn);}
    try{const r=await api<{items:Service[];next_cursor:string|null}>('/catalog?'+params);setItems(old=>[...old,...r.items]);setCursor(r.next_cursor);}
    catch(e){setError(errorMessage(e));}finally{setLoading(false);}
  }
  function submit(e:React.FormEvent){e.preventDefault();setFilters({category:category.trim(),city:city.trim(),term:term.trim(),searchIn,modality});}
  return <Layout><h1 className="text-3xl font-bold">Encontre serviços</h1><p className="muted my-3">Explore prestadores e solicite orçamentos sem pagar pela plataforma.</p>
    <form className="card grid md:grid-cols-2 gap-3 mb-5" onSubmit={submit}>
      <label className="field">Busca por prefixo<input value={term} maxLength={60} onChange={e=>setTerm(e.target.value)} placeholder="Ex.: limpeza"/></label>
      <label className="field">Pesquisar em<select value={searchIn} onChange={e=>setSearchIn(e.target.value)}><option value="service">Serviço</option><option value="provider">Prestador</option></select></label>
      <label className="field">Categoria<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Todas</option>{categories.map(c=><option key={c.slug} value={c.slug}>{c.label}</option>)}</select></label>
      <label className="field">Cidade<input value={city} onChange={e=>setCity(e.target.value)}/></label>
      <label className="field">Modalidade<select value={modality} onChange={e=>setModality(e.target.value)}><option value="">Todas</option><option value="online">Online</option><option value="presencial">Presencial</option></select></label>
      <div className="self-end"><button className="btn" disabled={loading}>Aplicar filtros</button></div>
    </form>
    <Notice error={error}/>{loading&&<p role="status">Carregando serviços...</p>}
    <div className="grid md:grid-cols-2 gap-4">{items.map(s=><article className="card" key={s.id}><h2 className="text-xl font-semibold">{s.title}</h2><p>{s.provider_name} • {s.category} • {s.city} • {s.modality}</p><p>{s.description.slice(0,180)}</p><p className="font-semibold my-2">{money(s.price_cents)}</p><Link to={'/servico/'+s.id}>Ver detalhes</Link></article>)}</div>
    {!items.length&&!error&&!loading&&<p className="my-5">Nenhum serviço ativo encontrado.</p>}
    {cursor&&<button className="btn btn-outline my-6" disabled={loading} onClick={()=>void more()}>Carregar mais</button>}
  </Layout>;
}
function Details(){
  const {id}=useParams(),{session,profile}=useApp();const navigate=useNavigate();const [item,setItem]=useState<{service:Service;provider:{user_id:string;display_name:string;about:string}}|null>(null),[need,setNeed]=useState(''),[date,setDate]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{void api<typeof item>('/services/'+id).then(setItem).catch(e=>setError(errorMessage(e)));},[id]);
  async function request(event:React.FormEvent){event.preventDefault();if(!session)return navigate('/login');setBusy(true);setError('');try{await api('/requests','POST',{service_id:id,need,desired_date:date||null},session);navigate('/dashboard');}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
  return <Layout>{!item?<Notice error={error||'Carregando...'} />:<><h1 className="text-3xl font-bold">{item.service.title}</h1><p className="my-3">{item.service.description}</p><p><Link to={'/prestador/'+item.provider.user_id}>{item.provider?.display_name}</Link> • {item.service.city} • {item.service.modality}</p><p className="font-semibold my-3">{money(item.service.price_cents)}</p>{profile?.kind==='prestador'?<p>Entre como cliente para solicitar orçamento.</p>:<form className="card max-w-xl mt-4" onSubmit={e=>void request(e)}><h2 className="font-semibold text-xl">Solicitar orçamento</h2><label className="field">Descreva sua necessidade<textarea required minLength={10} maxLength={2000} value={need} onChange={e=>setNeed(e.target.value)}/></label><label className="field">Data desejada<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><button className="btn" disabled={busy}>{session?'Enviar solicitação':'Entrar para continuar'}</button><Notice error={error}/></form>}</>}</Layout>;
}
function PublicProvider(){
  const {id}=useParams();
  const [data,setData]=useState<{provider:{display_name:string;about:string;city:string;category:string};services:Service[]}|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{void api<typeof data>('/providers/'+id).then(setData).catch(e=>setError(errorMessage(e)));},[id]);
  return <Layout>{!data?<Notice error={error||'Carregando perfil...'} />:<>
    <h1 className="text-3xl font-bold">{data.provider.display_name}</h1>
    <p className="my-3">{data.provider.city} • {data.provider.category}</p>
    <p className="my-3">{data.provider.about}</p><h2 className="text-xl font-semibold">Serviços ativos</h2>
    <div className="grid md:grid-cols-2 gap-3">{data.services.map(s=><Link className="card" key={s.id} to={'/servico/'+s.id}>{s.title} — {money(s.price_cents)}</Link>)}</div>
  </>}</Layout>;
}
function SetupProfile(){
  const {session,refresh}=useApp();const [name,setName]=useState(''),[kind,setKind]=useState<'cliente'|'prestador'>('cliente'),[city,setCity]=useState(''),[category,setCategory]=useState(''),[about,setAbout]=useState(''),[error,setError]=useState('');
  useEffect(()=>{try{const p=JSON.parse(sessionStorage.getItem('registration')||'null');if(p){setName(p.display_name||'');setKind(p.kind==='prestador'?'prestador':'cliente');setCity(p.city||'');setCategory(p.category||'');setAbout(p.about||'');}}catch{sessionStorage.removeItem('registration');}},[]);
  async function submit(e:React.FormEvent){e.preventDefault();try{await api('/profiles','POST',{display_name:name,kind,city,category,about},session);sessionStorage.removeItem('registration');await refresh();}catch(err){setError(errorMessage(err));}}
  return <Layout><h1 className="text-2xl font-semibold">Complete seu perfil</h1><form className="card max-w-lg mt-3" onSubmit={e=>void submit(e)}><label className="field">Nome<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label><label className="field">Conta<select value={kind} onChange={e=>setKind(e.target.value as 'cliente'|'prestador')}><option value="cliente">Cliente</option><option value="prestador">Prestador</option></select></label><label className="field">Cidade<input value={city} onChange={e=>setCity(e.target.value)}/></label>{kind==='prestador'&&<><label className="field">Categoria<input value={category} onChange={e=>setCategory(e.target.value)}/></label><label className="field">Sobre seus serviços<textarea value={about} onChange={e=>setAbout(e.target.value)}/></label></>}<button className="btn">Salvar perfil</button><Notice error={error}/></form></Layout>;
}
function NewService(){
  const [categories,setCategories]=useState<{slug:string;label:string}[]>([]);useEffect(()=>{void api<{slug:string;label:string}[]>('/categories').then(setCategories).catch(()=>{});},[]);
  const {session}=useApp();const navigate=useNavigate();const [p,setP]=useState({title:'',description:'',category:'',city:'',modality:'presencial',price_type:'orcamento',price_cents:''}),[error,setError]=useState('');
  async function submit(e:React.FormEvent){e.preventDefault();try{await api('/services','POST',{...p,price_cents:p.price_type==='orcamento'?null:Math.round(Number(p.price_cents)*100)},session);navigate('/dashboard');}catch(e){setError(errorMessage(e));}}
  return <Layout><h1 className="text-2xl font-bold">Publicar serviço</h1><form className="card max-w-xl mt-4" onSubmit={e=>void submit(e)}>{(['title','description','city'] as const).map(k=><label key={k} className="field">{({title:'Título',description:'Descrição',city:'Cidade'})[k]}<input required minLength={k==='description'?10:2} value={p[k]} onChange={e=>setP({...p,[k]:e.target.value})}/></label>)}<label className="field">Categoria<select value={p.category} required onChange={e=>setP({...p,category:e.target.value})}><option value="">Selecione</option>{categories.map(c=><option key={c.slug} value={c.slug}>{c.label}</option>)}</select></label><label className="field">Modalidade<select value={p.modality} onChange={e=>setP({...p,modality:e.target.value})}><option value="presencial">Presencial</option><option value="online">Online</option></select></label><label className="field">Preço<select value={p.price_type} onChange={e=>setP({...p,price_type:e.target.value})}><option value="orcamento">Sob orçamento</option><option value="fixo">Fixo</option><option value="inicial">A partir de</option></select></label>{p.price_type!=='orcamento'&&<label className="field">Valor (R$)<input required type="number" min="0" max="1000000" step=".01" value={p.price_cents} onChange={e=>setP({...p,price_cents:e.target.value})}/></label>}<button className="btn">Publicar</button><Notice error={error}/></form></Layout>;
}
function RequestDetails(){
  const {id}=useParams(),{session,profile}=useApp();const [data,setData]=useState<{request:RequestItem;proposals:Proposal[];events:{action:string;to_status:string;created_at:string}[];contract:Proposal|null}|null>(null),[error,setError]=useState(''),[scope,setScope]=useState(''),[price,setPrice]=useState(''),[days,setDays]=useState('7'),[busy,setBusy]=useState(false);
  async function load(){try{setData(await api('/requests/'+id,'GET',undefined,session));}catch(e){setError(errorMessage(e));}}
  useEffect(()=>{if(session)void load();},[id,session]);
  async function act(action:string){setBusy(true);setError('');try{await api('/requests/'+id+'/actions','POST',{action,...(['enviar_proposta','revisar_proposta'].includes(action)?{price_cents:Math.round(Number(price)*100),duration_days:Number(days),scope}:{}),...(action==='aceitar'?{version:data?.request.current_version}:{})},session);await load();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
  if(!data)return <Layout><Notice error={error||'Carregando solicitação...'} /></Layout>;
  const r=data.request,customer=profile?.kind==='cliente';const last=data.proposals[0];
  const actions=customer?(r.status==='aguardando_proposta'?['cancelar']:r.status==='proposta_enviada'?['aceitar','recusar_proposta','cancelar']:r.status==='aguardando_confirmacao'?['confirmar']:[]):(r.status==='aguardando_proposta'?['enviar_proposta','recusar_pedido']:r.status==='proposta_enviada'?['revisar_proposta']:r.status==='contratado'?['iniciar']:r.status==='em_andamento'?['finalizar']:[]);
  return <Layout><h1 className="text-2xl font-bold">{r.snapshot_title}</h1><p className="my-2">Estado: <strong>{r.status.replaceAll('_',' ')}</strong></p><p>Pedido: {r.need}</p>{last&&<section className="card my-4"><h2 className="font-semibold">Proposta vigente — versão {last.version}</h2><p>Valor: {money(last.price_cents)} • Prazo: {last.duration_days} dias</p><p>{last.scope}</p></section>}
    {actions.some(a=>['enviar_proposta','revisar_proposta'].includes(a))&&<div className="card my-3"><label className="field">Valor proposto em R$<input type="number" min="0" step=".01" value={price} onChange={e=>setPrice(e.target.value)}/></label><label className="field">Prazo (dias)<input type="number" min="1" max="365" value={days} onChange={e=>setDays(e.target.value)}/></label><label className="field">Escopo da proposta<textarea minLength={10} maxLength={2000} value={scope} onChange={e=>setScope(e.target.value)}/></label></div>}
    <div className="flex flex-wrap gap-2 my-4">{actions.map(a=><button className="btn" disabled={busy} key={a} onClick={()=>{if(window.confirm(a==='aceitar'?'Você confirma a versão e as condições da proposta?':'Confirmar ação: '+a+'?'))void act(a);}}>{a.replaceAll('_',' ')}</button>)}</div><Notice error={error}/>
    <h2 className="font-semibold text-xl mt-4">Histórico</h2><ol className="list-decimal pl-5">{data.events.map((e,i)=><li key={i}>{e.action.replaceAll('_',' ')} — {e.to_status.replaceAll('_',' ')}</li>)}</ol>
    <p className="muted mt-4">Após o aceite, não é possível cancelar pelo fluxo comum. Conclusão exige confirmação do cliente.</p>
  </Layout>;
}
function Dashboard(){
  const {session,profile}=useApp();const [services,setServices]=useState<Service[]>([]),[requests,setRequests]=useState<RequestItem[]>([]),[error,setError]=useState('');
  useEffect(()=>{if(!session||!profile)return;void api<RequestItem[]>('/requests','GET',undefined,session).then(setRequests).catch(e=>setError(errorMessage(e)));if(profile.kind==='prestador')void api<Service[]>('/my/services','GET',undefined,session).then(setServices).catch(e=>setError(errorMessage(e)));},[session,profile]);
  async function deactivate(id:string){if(!window.confirm('Desativar anúncio? Pedidos anteriores serão preservados.'))return;try{await api('/services/'+id,'PATCH',{active:false},session);setServices(s=>s.map(x=>x.id===id?{...x,active:false}:x));}catch(e){setError(errorMessage(e));}}
  return <Layout><h1 className="text-3xl font-bold">Painel {profile?.kind==='prestador'?'do prestador':'do cliente'}</h1><Notice error={error}/>{profile?.kind==='prestador'&&<><p className="my-4"><Link className="btn" to="/novo-servico">Publicar serviço</Link></p><h2 className="font-semibold text-xl my-3">Meus anúncios</h2><div className="grid gap-3">{services.map(s=><div className="card" key={s.id}><strong>{s.title}</strong> — {s.city} <button className="btn btn-outline ml-3" onClick={()=>void deactivate(s.id)}>Desativar</button></div>)}</div></>}
    <h2 className="font-semibold text-xl my-4">Solicitações e atendimentos</h2><div className="grid gap-3">{requests.map(r=><Link className="card block" key={r.id} to={'/pedido/'+r.id}><strong>{r.snapshot_title}</strong><p>{r.status.replaceAll('_',' ')}</p></Link>)}{!requests.length&&<p>Nenhuma solicitação ainda.</p>}</div></Layout>;
}
function App(){
  const [session,setSession]=useState<Session|null>(null),[profile,setProfile]=useState<Profile|null>(null),[ready,setReady]=useState(false);
  async function refresh(s?:Session|null){const current=s===undefined?(await supabase.auth.getSession()).data.session:s;setSession(current||null);if(current){try{setProfile(await api<Profile>('/me','GET',undefined,current));}catch{setProfile(null);}}else setProfile(null);setReady(true);}
  useEffect(()=>{void refresh();const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>{void refresh(s);});return()=>subscription.unsubscribe();},[]);
  if(!ready)return <p className="p-8">Iniciando sessão...</p>;
  return <Context.Provider value={{session,profile,refresh:async()=>refresh()}}><BrowserRouter><Routes>
    <Route path="/" element={<Catalog/>}/><Route path="/login" element={<Auth mode="login"/>}/><Route path="/cadastro" element={<Auth mode="cadastro"/>}/><Route path="/recuperar" element={<Auth mode="recuperar"/>}/><Route path="/atualizar-senha" element={<ResetPassword/>}/><Route path="/servico/:id" element={<Details/>}/><Route path="/prestador/:id" element={<PublicProvider/>}/>
    <Route path="/dashboard" element={!session?<Navigate to="/login"/>:!profile?<SetupProfile/>:<Dashboard/>}/>
    <Route path="/novo-servico" element={!session?<Navigate to="/login"/>:profile?.kind!=='prestador'?<Navigate to="/dashboard"/>:<NewService/>}/>
    <Route path="/pedido/:id" element={!session?<Navigate to="/login"/>:<RequestDetails/>}/>
    <Route path="*" element={<Layout><h1>Página não encontrada</h1><Link to="/">Voltar ao início</Link></Layout>}/>
  </Routes></BrowserRouter></Context.Provider>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
