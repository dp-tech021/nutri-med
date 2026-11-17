import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@supabase/supabase-js';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, type RequestItem } from '../api';
import { AppContext, type AppContextValue } from '../app/AppContext';
import { RequestDetailsPage } from './RequestDetailsPage';

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
const baseRequest: RequestItem = {
  id: 'request-demo', snapshot_title: 'Organização residencial', need: 'Organizar dois ambientes da residência.', desired_date: '2026-12-01',
  status: 'aguardando_proposta', current_version: 0, client_id: 'client-demo', provider_id: 'provider-demo', created_at: '2026-11-12T10:00:00Z',
};
const view = (request: RequestItem, events: { action: string; to_status: string; created_at: string }[] = []) => ({ request, proposals: [], contract: null, events });
function renderPage() {
  return render(<AppContext.Provider value={context}><MemoryRouter initialEntries={['/pedido/request-demo']}><Routes><Route path="/pedido/:id" element={<RequestDetailsPage />} /></Routes></MemoryRouter></AppContext.Provider>);
}

describe('ações da solicitação do cliente', () => {
  beforeEach(() => apiMock.mockReset());

  it('confirma cancelamento, evita repetição e usa o estado retornado pela API', async () => {
    let finish: ((value: RequestItem) => void) | undefined;
    const cancelled = { ...baseRequest, status: 'cancelado', updated_at: '2026-11-12T11:00:00Z' };
    let detailsCalls = 0;
    apiMock.mockImplementation((_path, method) => {
      if (method === 'POST') return new Promise<RequestItem>((resolve) => { finish = resolve; });
      detailsCalls += 1;
      return Promise.resolve(detailsCalls === 1 ? view(baseRequest) : view(cancelled, [{ action: 'cancelar', to_status: 'cancelado', created_at: cancelled.updated_at! }]));
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Cancelar solicitação' }));
    expect(screen.getByText(/não pode ser desfeita pela interface/i)).toBeVisible();
    const confirm = screen.getAllByRole('button', { name: 'Cancelar solicitação' }).at(-1)!;
    await user.dblClick(confirm);
    expect(apiMock.mock.calls.filter(([, method]) => method === 'POST')).toHaveLength(1);
    await act(async () => finish?.(cancelled));
    expect((await screen.findAllByText('Cancelado')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('cancelar')).toBeVisible();
  });

  it('explica conflito ao recusar uma proposta desatualizada', async () => {
    apiMock.mockResolvedValueOnce(view({ ...baseRequest, status: 'proposta_enviada', current_version: 1 }, [{ action: 'enviar_proposta', to_status: 'proposta_enviada', created_at: '2026-11-12T10:30:00Z' }]))
      .mockRejectedValueOnce(new ApiError('STATE_CONFLICT', 409));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Recusar proposta' }));
    await user.click(screen.getAllByRole('button', { name: 'Recusar proposta' }).at(-1)!);
    expect(await screen.findByText(/atualizada em outra operação/i)).toBeVisible();
  });
});
