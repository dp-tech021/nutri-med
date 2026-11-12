import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, type Service } from '../api';
import { AppContext } from '../app/AppContext';
import { HomePage } from './HomePage';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return { ...actual, api: vi.fn() };
});
const apiMock = vi.mocked(api);
const service: Service = {
  id: 'service-demo', title: 'Organização residencial', description: 'Serviço sintético retornado pelo catálogo.', category: 'organizacao', city: 'Recife', modality: 'presencial', price_type: 'orcamento', price_cents: null, provider_name: 'Prestador Demo',
};

function renderHome() {
  return render(<AppContext.Provider value={{ session: null, profile: null, refresh: async () => undefined }}><MemoryRouter><HomePage /></MemoryRouter></AppContext.Provider>);
}

describe('página inicial', () => {
  beforeEach(() => apiMock.mockReset());

  it('comunica o marketplace e oferece CTAs para rotas existentes', async () => {
    apiMock.mockImplementation(async (path) => path === '/categories' ? [] : { items: [] });
    renderHome();
    expect(screen.getByRole('heading', { level: 1, name: 'Encontre o serviço certo para o que você precisa' })).toBeVisible();
    expect(screen.getByRole('img', { name: /Exemplo ilustrativo/ })).toBeVisible();
    expect(screen.getAllByRole('link', { name: /Encontrar serviços/ })[0]).toHaveAttribute('href', '/servicos');
    expect(screen.getByRole('link', { name: 'Quero oferecer meus serviços' })).toHaveAttribute('href', '/cadastro?tipo=prestador');
    expect(screen.getByRole('link', { name: 'Anunciar meus serviços' })).toHaveAttribute('href', '/cadastro?tipo=prestador');
    expect(screen.getAllByText(/não realiza pagamentos/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/avaliação|verificado|grátis/i)).not.toBeInTheDocument();
    expect(await screen.findByText('Nenhum serviço disponível nesta prévia')).toBeVisible();
  });

  it('mostra até três serviços reais e categorias clicáveis fornecidas pela API', async () => {
    apiMock.mockImplementation(async (path) => path === '/categories'
      ? [{ slug: 'organizacao', label: 'Organização' }]
      : { items: [service, { ...service, id: 'service-2' }, { ...service, id: 'service-3' }, { ...service, id: 'service-4' }] });
    renderHome();
    expect(await screen.findAllByRole('heading', { name: service.title })).toHaveLength(3);
    expect(screen.getAllByRole('link', { name: 'Ver detalhes' })).toHaveLength(3);
    expect(await screen.findByRole('link', { name: /Organização/ })).toHaveAttribute('href', '/servicos?category=organizacao');
    expect(apiMock).toHaveBeenCalledWith('/catalog?limit=3');
  });

  it('trata API indisponível e permite nova tentativa', async () => {
    let catalogAttempts = 0;
    apiMock.mockImplementation(async (path) => {
      if (path === '/categories') return [];
      catalogAttempts += 1;
      if (catalogAttempts === 1) throw new TypeError('Failed to fetch');
      return { items: [] };
    });
    const user = userEvent.setup();
    renderHome();
    expect(await screen.findByText('Prévia temporariamente indisponível')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Nenhum serviço disponível nesta prévia')).toBeVisible();
  });
});
