import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@supabase/supabase-js';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api';
import { AppContext, type AppContextValue } from '../app/AppContext';
import { MyServicesPage, ProviderProposalsPage, ReceivedRequestsPage } from './ProviderPages';

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

function renderPage(page: React.ReactNode) {
  return render(<AppContext.Provider value={context}><MemoryRouter>{page}</MemoryRouter></AppContext.Provider>);
}

describe('painel do prestador', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mostra estado vazio quando o prestador ainda não tem serviços', async () => {
    mocks.api.mockResolvedValue([]);
    renderPage(<MyServicesPage />);
    expect(await screen.findByText('Nenhum serviço publicado')).toBeVisible();
  });

  it('confirma desativação e preserva a mensagem sobre registros anteriores', async () => {
    mocks.api.mockResolvedValueOnce([{ id: 'service-demo', title: 'Serviço Demo', description: 'Descrição demonstrativa', category: 'limpeza', city: 'Recife', modality: 'presencial', price_type: 'fixo', price_cents: 12000, active: true }]).mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderPage(<MyServicesPage />);
    await user.click(await screen.findByRole('button', { name: 'Desativar' }));
    expect(screen.getByText(/propostas e contratos anteriores serão preservados/i)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Desativar anúncio' }));
    expect(mocks.api).toHaveBeenLastCalledWith('/services/service-demo', 'PATCH', { active: false }, context.session);
    expect(await screen.findByText('Inativo')).toBeVisible();
  });

  it('não revela se um recurso privado existe em respostas 403', async () => {
    mocks.api.mockRejectedValue(new ApiError('FORBIDDEN service-secret-id', 403));
    renderPage(<MyServicesPage />);
    expect(await screen.findByText(/Conteúdo não encontrado ou indisponível/i)).toBeVisible();
    expect(screen.queryByText(/service-secret-id/i)).not.toBeInTheDocument();
  });

  it('trata erro interno do servidor sem exibir detalhes técnicos', async () => {
    mocks.api.mockRejectedValue(new ApiError('DATABASE_INTERNAL_DETAIL', 500));
    renderPage(<MyServicesPage />);
    expect(await screen.findByText('Não foi possível carregar seus serviços.')).toBeVisible();
    expect(screen.queryByText(/DATABASE_INTERNAL_DETAIL/)).not.toBeInTheDocument();
  });

  it('ignora a resposta antiga quando o prestador troca de sessão', async () => {
    let finishOld: ((value: unknown) => void) | undefined;
    const oldSession = { ...context.session, access_token: 'old-token' } as Session;
    const newSession = { ...context.session, access_token: 'new-token' } as Session;
    const activeService = {
      id: 'new-service', title: 'Anúncio da conta nova', description: 'Descrição de teste',
      category: 'limpeza', city: 'Recife', modality: 'online',
      price_type: 'fixo', price_cents: 10000, active: true,
    };
    mocks.api.mockImplementation((_path: string, _method: string, _body: unknown, currentSession: Session) => {
      if (currentSession.access_token === 'old-token') {
        return new Promise((resolve) => { finishOld = resolve; });
      }
      return Promise.resolve([activeService]);
    });
    const page = (session: Session) => (
      <AppContext.Provider value={{ ...context, session }}>
        <MemoryRouter><MyServicesPage /></MemoryRouter>
      </AppContext.Provider>
    );
    const view = render(page(oldSession));
    await waitFor(() => expect(mocks.api).toHaveBeenCalledTimes(1));
    view.rerender(page(newSession));
    expect(await screen.findByText('Anúncio da conta nova')).toBeVisible();
    await act(async () => finishOld?.([{ ...activeService, id: 'old-service', title: 'Anúncio antigo' }]));
    expect(screen.queryByText('Anúncio antigo')).not.toBeInTheDocument();
  });

  it('separa pedidos novos de solicitações que já têm proposta', async () => {
    const requests = [
      { id: 'new-request', snapshot_title: 'Pedido novo', need: '', status: 'aguardando_proposta', current_version: 0 },
      { id: 'proposal-request', snapshot_title: 'Pedido respondido', need: '', status: 'proposta_enviada', current_version: 2 },
    ];
    mocks.api.mockResolvedValue(requests);
    const received = renderPage(<ReceivedRequestsPage />);
    expect(await screen.findByText('Pedido novo')).toBeVisible();
    expect(screen.queryByText('Pedido respondido')).not.toBeInTheDocument();
    received.unmount();

    renderPage(<ProviderProposalsPage />);
    expect(await screen.findByText('Pedido respondido')).toBeVisible();
    expect(screen.queryByText('Pedido novo')).not.toBeInTheDocument();
  });
});
