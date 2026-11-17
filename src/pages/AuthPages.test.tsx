import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppContext, type AppContextValue } from '../app/AppContext';
import { registrationDraftKey } from '../auth/registrationDraft';
import { AuthPage, ResetPasswordPage, authCallback, authErrorMessage, safeInternalPath } from './AuthPages';

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

function renderAuth(page: ReactNode, value: AppContextValue = context, initialEntries: string[] = ['/']) {
  return render(<AppContext.Provider value={value}><MemoryRouter initialEntries={initialEntries}>{page}</MemoryRouter></AppContext.Provider>);
}

describe('autenticação', () => {
  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it.each([
    ['https://example.test', '/', '/login', 'https://example.test/login'],
    ['https://example.test', '/', '/atualizar-senha', 'https://example.test/atualizar-senha'],
    ['https://dp-tech021.github.io', '/nutri-med/', '/login', 'https://dp-tech021.github.io/nutri-med/login'],
    ['https://dp-tech021.github.io', '/nutri-med/', '/atualizar-senha', 'https://dp-tech021.github.io/nutri-med/atualizar-senha'],
  ] as const)('compõe callback %s + %s + %s', (origin, base, path, expected) => {
    expect(authCallback(path, base, origin)).toBe(expected);
  });

  it.each(['/', '/nutri-med/'])('envia callbacks com BASE_URL=%s nas duas operações Auth', async (base) => {
    vi.stubEnv('BASE_URL', base);
    authMocks.signUp.mockResolvedValue({ data: { user: { id: 'callback-demo' }, session: null }, error: null });
    authMocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    const user = userEvent.setup();
    const signup = renderAuth(<AuthPage mode="cadastro" />);
    await user.type(screen.getByLabelText(/^Nome de exibição/), 'Pessoa Demo');
    await user.type(screen.getByLabelText(/^E-mail/), 'pessoa@example.invalid');
    await user.type(screen.getByLabelText(/^Senha/), 'Senha-demo-123');
    await user.type(screen.getByLabelText(/^Confirme a senha/), 'Senha-demo-123');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(authMocks.signUp).toHaveBeenCalledWith(expect.objectContaining({
      options: { emailRedirectTo: `${window.location.origin}${base}login` },
    }));
    signup.unmount();
    renderAuth(<AuthPage mode="recuperar" />);
    await user.type(screen.getByLabelText(/^E-mail/), 'pessoa@example.invalid');
    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }));
    expect(authMocks.resetPasswordForEmail).toHaveBeenCalledWith('pessoa@example.invalid', {
      redirectTo: `${window.location.origin}${base}atualizar-senha`,
    });
  });

  it('preserva a escolha de prestador iniciada pela landing', () => {
    renderAuth(<AuthPage mode="cadastro" />, context, ['/cadastro?tipo=prestador']);
    expect(screen.getByRole('combobox', { name: /Quero usar a plataforma como/i })).toHaveValue('prestador');
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
