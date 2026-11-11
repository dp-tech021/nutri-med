import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@supabase/supabase-js';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppContext, type AppContextValue } from '../app/AppContext';
import { NewServicePage } from './ServiceFormPages';

const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return { ...actual, api: mocks.api };
});

const context: AppContextValue = {
  session: { access_token: 'synthetic-token', user: { id: 'provider-demo' } } as Session,
  profile: { kind: 'prestador', display_name: 'Prestador Demo', city: 'Recife', category: 'limpeza', about: '' },
  refresh: async () => undefined,
};

function renderPage() {
  return render(<AppContext.Provider value={context}><MemoryRouter initialEntries={['/novo-servico']}><Routes>
    <Route path="/novo-servico" element={<NewServicePage />} />
    <Route path="/meus-servicos" element={<p>Lista de serviços</p>} />
  </Routes></MemoryRouter></AppContext.Provider>);
}

async function fillRequiredForm(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('option', { name: 'Limpeza' });
  await user.type(screen.getByLabelText(/^Título/), 'Limpeza residencial');
  await user.type(screen.getByLabelText(/^Descrição/), 'Serviço demonstrativo para ambientes residenciais.');
  await user.selectOptions(screen.getByLabelText(/^Categoria/), 'limpeza');
  await user.type(screen.getByLabelText(/^Cidade/), 'Recife');
}

describe('formulário de serviço', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('scrollTo', vi.fn());
    mocks.api.mockImplementation((path: string) => path === '/categories'
      ? Promise.resolve([{ slug: 'limpeza', label: 'Limpeza' }])
      : Promise.resolve({ id: 'service-demo' }));
  });

  it('revisa, converte preço em centavos e impede envio duplicado', async () => {
    let finish: ((value: unknown) => void) | undefined;
    mocks.api.mockImplementation((path: string) => path === '/categories'
      ? Promise.resolve([{ slug: 'limpeza', label: 'Limpeza' }])
      : new Promise((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    renderPage();
    await fillRequiredForm(user);
    await user.selectOptions(screen.getByLabelText(/^Tipo de preço/), 'fixo');
    await user.type(screen.getByLabelText(/^Valor em R/), '150,50');
    expect(screen.getByLabelText(/^Imagens/)).toBeDisabled();
    expect(screen.getByText(/Imagens indisponíveis no protótipo/i)).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Revisar anúncio' }));
    expect(screen.getByText('R$ 150,50')).toBeVisible();
    const publish = screen.getByRole('button', { name: 'Publicar serviço' });
    await user.dblClick(publish);
    expect(mocks.api.mock.calls.filter(([path]) => path === '/services')).toHaveLength(1);
    expect(mocks.api).toHaveBeenCalledWith('/services', 'POST', expect.objectContaining({ price_type: 'fixo', price_cents: 15050 }), context.session);
    await act(async () => finish?.({ id: 'service-demo' }));
    expect(await screen.findByText('Lista de serviços')).toBeVisible();
  });

  it('rejeita valor acima do contrato e não chama a API de gravação', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillRequiredForm(user);
    await user.selectOptions(screen.getByLabelText(/^Tipo de preço/), 'inicial');
    await user.type(screen.getByLabelText(/^Valor em R/), '1000000,01');
    fireEvent.submit(screen.getByRole('button', { name: 'Revisar anúncio' }).closest('form')!);
    expect(await screen.findByText(/Informe um valor válido/i)).toBeVisible();
    expect(mocks.api.mock.calls.some(([path]) => path === '/services')).toBe(false);
  });

  it('limpa o preço ao mudar para orçamento e permite voltar da revisão', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillRequiredForm(user);
    await user.selectOptions(screen.getByLabelText(/^Tipo de preço/), 'fixo');
    await user.type(screen.getByLabelText(/^Valor em R/), '99,90');
    await user.selectOptions(screen.getByLabelText(/^Tipo de preço/), 'orcamento');
    expect(screen.queryByLabelText(/^Valor em R/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Revisar anúncio' }));
    expect(screen.getByText('Sob orçamento')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Voltar e editar' }));
    expect(screen.getByRole('button', { name: 'Revisar anúncio' })).toBeVisible();
  });

  it('cancela o formulário sem gravar', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('option', { name: 'Limpeza' });
    const form = screen.getByRole('button', { name: 'Revisar anúncio' }).closest('form')!;
    await user.click(within(form).getByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByText('Lista de serviços')).toBeVisible();
    expect(mocks.api.mock.calls.some(([path]) => path === '/services')).toBe(false);
  });
});
