import { render, screen } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { api } from '../api';
import { AppContext } from '../app/AppContext';
import { AppRoutes } from './AppRoutes';

vi.mock('../api', async (importOriginal) => ({
  ...await importOriginal<typeof import('../api')>(), api: vi.fn(),
}));
const apiMock = vi.mocked(api);
beforeEach(() => {
  apiMock.mockReset();
  apiMock.mockImplementation(async (path) => path === '/health-taxonomy' ? {professions:[],specialties:[]} : path === '/categories' ? [] : {
    items: [{ id: 'legacy-demo', title: 'Serviço sintético legado', description: 'Exemplo de teste',
      category: 'limpeza', city: 'Cidade Demo', modality: 'presencial', price_type: 'orcamento', price_cents: null }],
    next_cursor: null,
  });
});

function LocationSnapshot() {
  const location = useLocation();
  return <output aria-label="localização">{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>;
}

describe('proteção de rotas', () => {
  it('leva visitante ao login e preserva somente a intenção interna', async () => {
    render(<AppContext.Provider value={{ session: null, profile: null, refresh: async () => undefined }}>
      <MemoryRouter initialEntries={['/pedido/abc?origem=painel']}><AppRoutes /><LocationSnapshot /></MemoryRouter>
    </AppContext.Provider>);
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeVisible();
    expect(screen.getByLabelText('localização')).toHaveTextContent('"pathname":"/login"');
    expect(screen.getByLabelText('localização')).toHaveTextContent('/pedido/abc?origem=painel');
  });

  it('retorna ao destino interno quando a sessão já está ativa no login', async () => {
    const session = { user: { id: 'user-demo' } } as Session;
    render(<AppContext.Provider value={{ session, profile: null, refresh: async () => undefined }}>
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/retorno-teste' } }]}>
        <AppRoutes /><LocationSnapshot />
      </MemoryRouter>
    </AppContext.Provider>);
    expect(await screen.findByText('Página não encontrada')).toBeVisible();
    expect(screen.getByLabelText('localização')).toHaveTextContent('"pathname":"/retorno-teste"');
  });
});

describe('áreas do marketplace', () => {
  it.each([
    ['Encontrar profissional', '/saude', 'Encontre profissionais de Saúde'],
    ['Encontrar serviço', '/servicos', 'Encontre serviços'],
  ])('navega pelo CTA %s no roteador real', async (label, path, heading) => {
    const user = userEvent.setup();
    render(<AppContext.Provider value={{ session: null, profile: null, refresh: async () => undefined }}>
      <MemoryRouter><AppRoutes /><LocationSnapshot /></MemoryRouter>
    </AppContext.Provider>);
    await user.click(screen.getByRole('link', { name: label }));
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeVisible();
    expect(screen.getByLabelText('localização')).toHaveTextContent(`"pathname":"${path}"`);
    if (path === '/saude') {
      expect(screen.getByLabelText('Profissão')).toBeVisible();
      expect(screen.getByLabelText('Especialidade')).toBeVisible();
      expect(apiMock.mock.calls.some(([url]) => String(url).includes('domain=health'))).toBe(true);
    } else {
      expect(await screen.findByRole('heading', { name: 'Serviço sintético legado' })).toBeVisible();
      expect(apiMock.mock.calls.some(([url]) => String(url).startsWith('/catalog?limit=12'))).toBe(true);
      expect(apiMock.mock.calls.some(([url]) => String(url).includes('domain='))).toBe(false);
    }
  });

  it.each(['/dashboard', '/novo-servico', '/editar-servico/demo', '/meus-servicos', '/solicitacoes-recebidas', '/propostas', '/minhas-solicitacoes', '/pedido/demo'])(
    'protege %s de acesso anônimo', async (path) => {
      render(<AppContext.Provider value={{ session: null, profile: null, refresh: async () => undefined }}>
        <MemoryRouter initialEntries={[path]}><AppRoutes /><LocationSnapshot /></MemoryRouter>
      </AppContext.Provider>);
      expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeVisible();
      expect(screen.getByLabelText('localização')).toHaveTextContent('"pathname":"/login"');
      expect(screen.getByLabelText('localização')).toHaveTextContent(`"from":"${path}"`);
    },
  );
});

it.each(['/novo-servico','/editar-servico/demo','/meus-servicos','/solicitacoes-recebidas','/propostas'])(
  'perfil Saúde não entra no fluxo comercial de Serviços em %s',async(path)=>{
    const session={user:{id:'health-qa'},access_token:'synthetic'} as Session;
    const profile={kind:'prestador' as const,domain:'health' as const,display_name:'Profissional QA',city:'Cidade QA',category:'',about:'',profession:'prof-qa',specialty:'esp-qa'};
    apiMock.mockImplementation(async(url)=>url==='/me'?profile:url==='/health-taxonomy'?{professions:[],specialties:[]}:[]);
    render(<AppContext.Provider value={{session,profile,refresh:async()=>undefined}}><MemoryRouter initialEntries={[path]}><AppRoutes/><LocationSnapshot/></MemoryRouter></AppContext.Provider>);
    expect(await screen.findByRole('heading',{name:'Painel de Saúde'})).toBeVisible();
    expect(screen.getByLabelText('localização')).toHaveTextContent('"pathname":"/dashboard"');
    expect(screen.queryByRole('link',{name:'Propostas'})).not.toBeInTheDocument();
  },
);

it('cliente autenticado navega em Saúde e Serviços sem depender do domain legado do perfil',async()=>{
 const user=userEvent.setup();const session={user:{id:'client-cross-domain'},access_token:'synthetic'} as Session;
 const profile={kind:'cliente' as const,domain:'services' as const,display_name:'Cliente sintético',city:'Cidade QA',category:'',about:''};
 apiMock.mockImplementation(async(path)=>path==='/health-taxonomy'?{professions:[{slug:'medico',label:'Médico'}],specialties:[{profession:'medico',slug:'atuacao-geral',label:'Atuação geral informada'}]}:path==='/categories'?[]:{items:[],next_cursor:null});
 render(<AppContext.Provider value={{session,profile,refresh:async()=>undefined}}><MemoryRouter><AppRoutes/><LocationSnapshot/></MemoryRouter></AppContext.Provider>);
 await user.click(screen.getByRole('link',{name:'Encontrar profissional'}));
 expect(await screen.findByRole('heading',{name:'Encontre profissionais de Saúde'})).toBeVisible();
 expect(screen.getByLabelText('localização')).toHaveTextContent('"pathname":"/saude"');
 await user.click(screen.getAllByRole('link',{name:'Serviços'})[0]);
 expect(await screen.findByRole('heading',{name:'Encontre serviços'})).toBeVisible();
 expect(screen.getByLabelText('localização')).toHaveTextContent('"pathname":"/servicos"');
 expect(screen.queryByRole('heading',{name:'Entrar'})).not.toBeInTheDocument();
});
