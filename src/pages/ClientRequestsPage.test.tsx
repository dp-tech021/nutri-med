import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@supabase/supabase-js';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, type RequestItem } from '../api';
import { AppContext, type AppContextValue } from '../app/AppContext';
import { ClientRequestsPage } from './ClientRequestsPage';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return { ...actual, api: vi.fn() };
});
const apiMock = vi.mocked(api);
const context: AppContextValue = {
  session: { access_token: 'synthetic-token', user: { id: 'client-demo' } } as Session,
  profile: { kind: 'cliente', display_name: 'Cliente Demo', city: '', category: '', about: '' },
  refresh: async () => undefined,
};
const request = (status: string, id: string): RequestItem => ({
  id, snapshot_title: `Pedido ${status}`, need: 'Necessidade sintética.', status, current_version: status === 'aguardando_proposta' ? 0 : 1,
  client_id: 'client-demo', provider_id: 'provider-demo', provider_name: 'Prestador Demo', created_at: '2026-11-10T10:00:00Z', updated_at: '2026-11-12T12:00:00Z',
});
function renderPage() {
  return render(<AppContext.Provider value={context}><MemoryRouter><ClientRequestsPage /></MemoryRouter></AppContext.Provider>);
}

describe('histórico do cliente', () => {
  beforeEach(() => apiMock.mockReset());

  it('descarta resposta antiga de outra sessão após troca de conta', async () => {
    let finishOld: ((value: RequestItem[]) => void) | undefined;
    const previousSession = { ...context.session, access_token: 'old-token' } as Session;
    const currentSession = { ...context.session, access_token: 'new-token' } as Session;
    apiMock.mockImplementation((_path, _method, _body, session) => {
      if (session?.access_token === 'old-token') {
        return new Promise<RequestItem[]>((resolve) => { finishOld = resolve; });
      }
      return Promise.resolve([request('contratado', 'new-request')]);
    });
    const view = (session: Session) => (
      <AppContext.Provider value={{ ...context, session }}>
        <MemoryRouter><ClientRequestsPage /></MemoryRouter>
      </AppContext.Provider>
    );
    const wrapper = render(view(previousSession));
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));
    wrapper.rerender(view(currentSession));
    expect(await screen.findByText('Pedido contratado')).toBeVisible();
    await act(async () => finishOld?.([request('cancelado', 'old-request')]));
    expect(screen.queryByText('Pedido cancelado')).not.toBeInTheDocument();
  });

  it('mostra estado vazio com caminho para o catálogo', async () => {
    apiMock.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText('Você ainda não enviou solicitações')).toBeVisible();
    expect(screen.getAllByRole('link', { name: 'Explorar serviços' }).length).toBeGreaterThan(0);
  });

  it('distingue cancelado, proposta recusada e contratado sem inventar campos', async () => {
    apiMock.mockResolvedValue([
      request('cancelado', '11111111-0000-0000-0000-000000000000'),
      request('proposta_recusada', '22222222-0000-0000-0000-000000000000'),
      request('contratado', '33333333-0000-0000-0000-000000000000'),
    ]);
    renderPage();
    expect(await screen.findByText('Cancelado')).toBeVisible();
    expect(screen.getByText('Proposta recusada')).toBeVisible();
    expect(screen.getByText('Contratado')).toBeVisible();
    expect(screen.getAllByText('Prestador Demo')).toHaveLength(3);
    expect(screen.getAllByText('12/11/2026')).toHaveLength(3);
    expect(screen.getAllByRole('link', { name: 'Ver detalhes' })).toHaveLength(3);
  });

  it('explica sessão expirada e permite tentar novamente após erro', async () => {
    apiMock.mockRejectedValueOnce(new ApiError('JWT_EXPIRED', 401));
    const expired = renderPage();
    expect(await screen.findByText(/Sua sessão terminou/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Entrar novamente' })).toBeVisible();
    expired.unmount();

    apiMock.mockReset();
    apiMock.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce([]);
    renderPage();
    expect(await screen.findByText(/Não foi possível conectar/)).toBeVisible();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Você ainda não enviou solicitações')).toBeVisible();
  });
});
