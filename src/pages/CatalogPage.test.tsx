import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, type Service } from '../api';
import { AppContext } from '../app/AppContext';
import { CatalogPage, catalogParams, mergeUniqueServices } from './CatalogPage';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return { ...actual, api: vi.fn() };
});

const apiMock = vi.mocked(api);
const service: Service = {
  id: 'service-1',
  title: 'Limpeza residencial',
  description: 'Serviço sintético para demonstração do catálogo.',
  category: 'limpeza',
  city: 'São Paulo',
  modality: 'presencial',
  price_type: 'fixo',
  price_cents: 15000,
  provider_name: 'Prestador Demo',
};

function renderCatalog() {
  return render(<AppContext.Provider value={{ session: null, profile: null, refresh: async () => undefined }}>
    <MemoryRouter><CatalogPage /></MemoryRouter>
  </AppContext.Provider>);
}

describe('catálogo público', () => {
  beforeEach(() => apiMock.mockReset());

  it('combina filtros no contrato de busca por prefixo e limpa todos os campos', async () => {
    apiMock.mockImplementation(async (path) => path === '/categories'
      ? [{ slug: 'limpeza', label: 'Limpeza' }]
      : { items: [service], next_cursor: null });
    const user = userEvent.setup();
    renderCatalog();
    await screen.findByRole('heading', { name: 'Limpeza residencial' });

    await user.type(screen.getByLabelText('Buscar'), 'limp');
    await user.selectOptions(screen.getByLabelText('Buscar por'), 'provider');
    await user.selectOptions(screen.getByLabelText('Categoria'), 'limpeza');
    await user.type(screen.getByLabelText('Cidade'), ' São Paulo ');
    await user.selectOptions(screen.getByLabelText('Modalidade'), 'presencial');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => expect(apiMock.mock.calls.some(([path]) => String(path).includes('q=limp')
      && String(path).includes('search_in=provider')
      && String(path).includes('category=limpeza')
      && String(path).includes('city=S%C3%A3o+Paulo')
      && String(path).includes('modality=presencial'))).toBe(true));

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByLabelText('Buscar')).toHaveValue('');
    expect(screen.getByLabelText('Categoria')).toHaveValue('');
    expect(screen.getByLabelText('Cidade')).toHaveValue('');
    expect(screen.getByLabelText('Modalidade')).toHaveValue('');
  });

  it('preserva paginação por cursor e remove itens duplicados', async () => {
    apiMock.mockImplementation(async (path) => {
      if (path === '/categories') return [];
      if (String(path).includes('cursor=next-page')) {
        return { items: [service, { ...service, id: 'service-2', title: 'Limpeza comercial' }], next_cursor: null };
      }
      return { items: [service], next_cursor: 'next-page' };
    });
    const user = userEvent.setup();
    renderCatalog();
    await screen.findByRole('heading', { name: 'Limpeza residencial' });
    await user.click(screen.getByRole('button', { name: 'Carregar mais serviços' }));
    await screen.findByRole('heading', { name: 'Limpeza comercial' });
    expect(screen.getAllByRole('heading', { name: 'Limpeza residencial' })).toHaveLength(1);
  });

  it('mostra estados vazio e erro com recuperação real', async () => {
    let catalogAttempts = 0;
    apiMock.mockImplementation(async (path) => {
      if (path === '/categories') return [];
      catalogAttempts += 1;
      if (catalogAttempts === 1) return { items: [], next_cursor: null };
      if (catalogAttempts === 2) throw new Error('offline');
      return { items: [service], next_cursor: null };
    });
    const user = userEvent.setup();
    renderCatalog();
    expect(await screen.findByText('Nenhum serviço encontrado')).toBeVisible();
    await user.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0]);
    expect(await screen.findByText('Não foi possível carregar o catálogo')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('heading', { name: 'Limpeza residencial' })).toBeVisible();
  });

  it('serializa somente filtros ativos e deduplica por identificador', () => {
    expect(catalogParams({ category: '', city: '', term: '', searchIn: 'service', modality: '' }).toString()).toBe('limit=12');
    expect(mergeUniqueServices([service], [service, { ...service, id: 'service-2' }]).map((item) => item.id)).toEqual(['service-1', 'service-2']);
    expect(mergeUniqueServices([], [service, service]).map((item) => item.id)).toEqual(['service-1']);
  });
});

it('Saúde consulta taxonomia, filtros e próximas páginas com domain=health', async () => {
  apiMock.mockImplementation(async (path) => {
    if (path === '/health-taxonomy') return {professions:[{slug:'qa-prof',label:'Profissão QA'}],specialties:[{profession:'qa-prof',slug:'qa-esp',label:'Especialidade QA'}]};
    return {items:[{...service,id:'health-qa',domain:'health',profession:'qa-prof',specialty:'qa-esp',title:'Oferta de Saúde sintética'}],next_cursor:String(path).includes('cursor=')?null:'health-cursor'};
  });
  const user=userEvent.setup();
  render(<AppContext.Provider value={{session:null,profile:null,refresh:async()=>undefined}}><MemoryRouter><CatalogPage domain="health" /></MemoryRouter></AppContext.Provider>);
  expect(await screen.findByRole('heading',{name:'Oferta de Saúde sintética'})).toBeVisible();
  expect(screen.queryByLabelText('Categoria')).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Profissão'),'qa-prof');
  await user.selectOptions(screen.getByLabelText('Especialidade'),'qa-esp');
  await user.type(screen.getByLabelText('Cidade'),'Recife');
  await user.selectOptions(screen.getByLabelText('Modalidade'),'online');
  await user.type(screen.getByLabelText('Buscar'),'oferta');
  await user.click(screen.getByRole('button',{name:'Buscar'}));
  await waitFor(()=>expect(apiMock.mock.calls.some(([path])=>String(path).includes('domain=health')&&String(path).includes('profession=qa-prof')&&String(path).includes('specialty=qa-esp')&&String(path).includes('city=Recife')&&String(path).includes('modality=online')&&String(path).includes('q=oferta'))).toBe(true));
  await user.click(screen.getByRole('button',{name:'Carregar mais ofertas'}));
  await waitFor(()=>expect(apiMock.mock.calls.some(([path])=>String(path).includes('cursor=health-cursor')&&String(path).includes('domain=health')&&String(path).includes('profession=qa-prof'))).toBe(true));
  expect(screen.queryByText('Sob orçamento')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Limpar filtros'}));
  expect(screen.getByLabelText('Profissão')).toHaveValue('');
});

it('serializa somente filtros do domínio mesmo se o estado contiver campos antigos da outra área',()=>{
 const mixed={category:'limpeza',city:'Recife',term:'teste',searchIn:'provider' as const,modality:'online',profession:'medico',specialty:'atuacao-geral'};
 const health=catalogParams(mixed,undefined,'health');
 expect(health.has('category')).toBe(false);expect(health.get('profession')).toBe('medico');expect(health.get('specialty')).toBe('atuacao-geral');
 const services=catalogParams(mixed,undefined,'services');
 expect(services.get('category')).toBe('limpeza');expect(services.has('profession')).toBe(false);expect(services.has('specialty')).toBe(false);
});
