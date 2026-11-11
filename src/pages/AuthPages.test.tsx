import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppContext, type AppContextValue } from '../app/AppContext';
import { registrationDraftKey } from '../auth/registrationDraft';
import { AuthPage, ResetPasswordPage, authErrorMessage, safeInternalPath } from './AuthPages';

const authMocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return { ...actual, supabase: { auth: authMocks } };
});

const context: AppContextValue = { session: null, profile: null, refresh: async () => undefined };

function renderAuth(page: ReactNode, value: AppContextValue = context) {
  return render(<AppContext.Provider value={value}><MemoryRouter>{page}</MemoryRouter></AppContext.Provider>);
}

describe('autenticação', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('trata confirmação de e-mail pendente e não armazena senha', async () => {
    authMocks.signUp.mockResolvedValue({ data: { user: { id: 'user-demo' }, session: null }, error: null });
    const user = userEvent.setup();
    renderAuth(<AuthPage mode="cadastro" />);
    await user.type(screen.getByLabelText(/^Nome de exibição/), 'Pessoa Demo');
    await user.type(screen.getByLabelText(/^E-mail/), 'pessoa@example.invalid');
    await user.type(screen.getByLabelText(/^Senha/), 'Senha-demo-123');
    await user.type(screen.getByLabelText(/^Confirme a senha/), 'Senha-demo-123');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(await screen.findByText(/Confirme seu e-mail/i)).toBeVisible();
    const stored = sessionStorage.getItem(registrationDraftKey) || '';
    expect(stored).toContain('user-demo');
    expect(stored).not.toContain('Senha-demo-123');
  });

  it('usa mensagem genérica para credenciais inválidas', async () => {
    authMocks.signInWithPassword.mockResolvedValue({ data: { session: null }, error: new Error('Invalid login credentials') });
    const user = userEvent.setup();
    renderAuth(<AuthPage mode="login" />);
    await user.type(screen.getByLabelText(/^E-mail/), 'pessoa@example.invalid');
    await user.type(screen.getByLabelText(/^Senha/), 'Senha-errada-123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText(/Confira e-mail e senha/i)).toBeVisible();
    expect(screen.queryByText('Invalid login credentials')).not.toBeInTheDocument();
  });

  it('distingue falha de rede sem enumerar contas na recuperação', async () => {
    authMocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: new TypeError('Failed to fetch') });
    const user = userEvent.setup();
    renderAuth(<AuthPage mode="recuperar" />);
    await user.type(screen.getByLabelText(/^E-mail/), 'pessoa@example.invalid');
    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }));
    expect(await screen.findByText(/Não foi possível conectar/i)).toBeVisible();
  });

  it('ignora a conclusão quando a operação é cancelada ao sair da tela', async () => {
    let finish: ((value: unknown) => void) | undefined;
    authMocks.signInWithPassword.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    const view = renderAuth(<AuthPage mode="login" />);
    await user.type(screen.getByLabelText(/^E-mail/), 'pessoa@example.invalid');
    await user.type(screen.getByLabelText(/^Senha/), 'Senha-demo-123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    view.unmount();
    await act(async () => finish?.({ data: { session: null }, error: new Error('late error') }));

    expect(authMocks.signInWithPassword).toHaveBeenCalledOnce();
  });

  it('atualiza senha com sessão recuperada e impede envio duplicado', async () => {
    let finish: ((value: unknown) => void) | undefined;
    authMocks.updateUser.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    const session = { user: { id: 'user-demo' } } as Session;
    renderAuth(<ResetPasswordPage />, { ...context, session });
    await user.type(screen.getByLabelText(/^Nova senha/), 'Nova-senha-123');
    await user.type(screen.getByLabelText(/^Confirme a nova senha/), 'Nova-senha-123');
    const submit = screen.getByRole('button', { name: 'Atualizar senha' });
    await user.dblClick(submit);
    expect(authMocks.updateUser).toHaveBeenCalledOnce();
    await act(async () => finish?.({ data: {}, error: null }));
    expect(await screen.findByRole('status')).toHaveTextContent(/Senha atualizada/i);
  });

  it('explica sessão encerrada e bloqueia redirects externos', () => {
    renderAuth(<AuthPage mode="login" />, { ...context, authNotice: 'Sua sessão terminou. Entre novamente para continuar.' });
    expect(screen.getByText(/Sua sessão terminou/i)).toBeVisible();
    expect(safeInternalPath('/pedido/123')).toBe('/pedido/123');
    expect(safeInternalPath('//example.com')).toBe('/dashboard');
    expect(safeInternalPath('/\\example.com')).toBe('/dashboard');
    expect(authErrorMessage(new Error('User not found'), 'recovery')).not.toMatch(/not found/i);
  });
});
