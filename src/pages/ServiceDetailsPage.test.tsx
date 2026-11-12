import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@supabase/supabase-js';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, type RequestItem } from '../api';
import { AppContext, type AppContextValue } from '../app/AppContext';
import { ServiceDetailsPage } from './ServiceDetailsPage';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return { ...actual, api: vi.fn() };
});
const apiMock = vi.mocked(api);
const context: AppContextValue = {
  session: { access_token: 'synthetic-token', user: { id: 'client-demo' } } as Session,
  profile: { kind: 'cliente', display_name: 'Cliente Demo', city: 'Recife', category: '', about: '' },
  refresh: async () => undefined,
};
const details = {
  service: { id: 'service-demo', title: 'Organização residencial', description: 'Descrição sintética do serviço.', category: 'organizacao', city: 'Recife', modality: 'presencial', price_type: 'orcamento', price_cents: null },
  provider: { user_id: 'provider-demo', display_name: 'Prestador Demo', about: 'Perfil sintético.', city: 'Recife', category: 'organizacao' },
};
const created: RequestItem = {
  id: '12345678-abcd-ef00-0000-000000000000', snapshot_title: details.service.title, need: 'Organizar dois ambientes da residência.', desired_date: null,
  status: 'aguardando_proposta', current_version: 0, client_id: 'client-demo', provider_id: 'provider-demo', created_at: '2026-11-12T10:00:00Z',
};

function renderPage(value = context) {
  return render(<AppContext.Provider value={value}><MemoryRouter initialEntries={['/servico/service-demo']}><Routes><Route path="/servico/:id" element={<ServiceDetailsPage />} /></Routes></MemoryRouter></AppContext.Provider>);
}

function LoginDestination() {
  const location = useLocation();
  return <p>Retorno: {String((location.state as { from?: unknown } | null)?.from)}</p>;
}

describe('solicitação de orçamento', () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue(details);
  });

  it('valida texto vazio ou curto antes de abrir a confirmação', async () => {
    renderPage();
    await screen.findByRole('heading', { name: details.service.title });
    const form = screen.getByRole('button', { name: 'Enviar solicitação de orçamento' }).closest('form')!;
    expect(screen.getByLabelText('Descreva sua necessidade *')).toHaveAttribute('maxlength', '2000');
    fireEvent.submit(form);
    expect(await screen.findByText('Descreva sua necessidade com 10 a 2.000 caracteres.')).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('confirma explicitamente, aceita data vazia e impede clique duplo', async () => {
    let finish: ((value: RequestItem) => void) | undefined;
    apiMock.mockImplementation((path) => path === '/services/service-demo'
      ? Promise.resolve(details)
      : new Promise<RequestItem>((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByLabelText('Descreva sua necessidade *'), created.need);
    await user.click(screen.getByRole('button', { name: 'Enviar solicitação de orçamento' }));
    expect(screen.getByText(/não confirma agendamento, contratação ou pagamento/i)).toBeVisible();
    const confirm = screen.getByRole('button', { name: 'Enviar solicitação' });
    await user.dblClick(confirm);
    expect(apiMock.mock.calls.filter(([path]) => path === '/requests')).toHaveLength(1);
    expect(apiMock).toHaveBeenCalledWith('/requests', 'POST', expect.objectContaining({ desired_date: null, need: created.need }), context.session);
    await act(async () => finish?.(created));
    expect(await screen.findByText('Solicitação enviada')).toBeVisible();
    expect(screen.getByText('12345678')).toBeVisible();
    expect(screen.getByText('Aguardando proposta')).toBeVisible();
  });

  it('não oferece envio para conta de prestador', async () => {
    renderPage({ ...context, profile: { ...context.profile!, kind: 'prestador' } });
    expect(await screen.findByText(/Use uma conta de cliente/)).toBeVisible();
    expect(screen.queryByRole('button', { name: /Enviar solicitação/ })).not.toBeInTheDocument();
  });

  it('leva visitante ao login com retomada interna do serviço', async () => {
    const user = userEvent.setup();
    render(<AppContext.Provider value={{ ...context, session: null, profile: null }}><MemoryRouter initialEntries={['/servico/service-demo']}><Routes>
      <Route path="/servico/:id" element={<ServiceDetailsPage />} />
      <Route path="/login" element={<LoginDestination />} />
    </Routes></MemoryRouter></AppContext.Provider>);
    await user.click(await screen.findByRole('link', { name: 'Entrar para solicitar orçamento' }));
    expect(await screen.findByText('Retorno: /servico/service-demo')).toBeVisible();
  });
});
