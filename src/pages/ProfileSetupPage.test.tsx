import { StrictMode } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@supabase/supabase-js';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { api, ApiError } from '../api';
import { AppContext } from '../app/AppContext';
import { registrationDraftKey, saveRegistrationDraft } from '../auth/registrationDraft';
import { ProfileSetupPage } from './ProfileSetupPage';

vi.mock('../api', async (importOriginal) => ({ ...await importOriginal<typeof import('../api')>(), api: vi.fn() }));
const apiMock = vi.mocked(api);
const session = { user: { id: 'new-user' }, access_token: 'synthetic' } as Session;
const refresh = vi.fn();

beforeEach(() => {
  apiMock.mockReset();
  refresh.mockReset().mockResolvedValue(undefined);
  sessionStorage.clear();
});

function setup() {
  render(<StrictMode><AppContext.Provider value={{ session, profile: null, refresh }}>
    <MemoryRouter><ProfileSetupPage /></MemoryRouter>
  </AppContext.Provider></StrictMode>);
  return userEvent.setup();
}

it('mostra falha e libera nova tentativa em StrictMode', async () => {
  apiMock.mockRejectedValue(new ApiError('OPERATION_FAILED', 400));
  const user = setup();
  await user.type(screen.getByLabelText('Nome de exibição', { exact: false }), 'Cliente sintético');
  await user.click(screen.getByRole('button', { name: 'Salvar perfil' }));
  expect(await screen.findByText('Não foi possível salvar o perfil. Revise os campos e tente novamente.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Salvar perfil' })).toBeEnabled();
  expect(refresh).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Salvar perfil' }));
  expect(apiMock).toHaveBeenCalledTimes(2);
});

it('preserva a escolha do cadastro e conclui o perfil em StrictMode', async () => {
  saveRegistrationDraft(sessionStorage, { userId: session.user.id, kind: 'prestador', displayName: 'Prestador sintético' });
  apiMock.mockResolvedValue({});
  const user = setup();
  expect(screen.getByLabelText('Nome de exibição', { exact: false })).toHaveValue('Prestador sintético');
  expect(screen.getByLabelText('Tipo de conta', { exact: false })).toHaveValue('prestador');
  await user.type(screen.getByLabelText('Categoria principal', { exact: false }), 'limpeza');
  await user.click(screen.getByRole('button', { name: 'Salvar perfil' }));
  await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  expect(apiMock).toHaveBeenCalledWith('/profiles', 'POST', {
    display_name: 'Prestador sintético', kind: 'prestador', city: '', category: 'limpeza', about: '',
  }, session);
  expect(sessionStorage.getItem(registrationDraftKey)).toBeNull();
  expect(screen.getByRole('button', { name: 'Salvar perfil' })).toBeEnabled();
});


it('resposta de cadastro desmontado não apaga o rascunho da próxima conta', async () => {
  let finish: ((value: unknown) => void) | undefined;
  apiMock.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const user = userEvent.setup();
  const page = render(<AppContext.Provider value={{ session, profile: null, refresh }}>
    <MemoryRouter><ProfileSetupPage /></MemoryRouter>
  </AppContext.Provider>);
  await user.type(screen.getByLabelText('Nome de exibição', { exact: false }), 'Conta anterior');
  await user.click(screen.getByRole('button', { name: 'Salvar perfil' }));
  page.unmount();
  saveRegistrationDraft(sessionStorage, { userId: 'next-user', kind: 'cliente', displayName: 'Próxima conta' });
  await act(async () => finish?.({}));
  expect(sessionStorage.getItem(registrationDraftKey)).toContain('next-user');
  expect(refresh).not.toHaveBeenCalled();
});
