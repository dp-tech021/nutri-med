import { act, render, screen, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useApp } from './AppContext';
import { AppProvider } from './AppProvider';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return { ...actual, api: mocks.api, supabase: { auth: { getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange } } };
});

function SessionSnapshot() {
  const { session, authNotice } = useApp();
  return <div><span>{session ? 'sessão ativa' : 'sem sessão'}</span>{authNotice && <span>{authNotice}</span>}</div>;
}

describe('sessão da aplicação', () => {
  beforeEach(() => vi.clearAllMocks());

  it('informa quando uma sessão ativa termina', async () => {
    const session = { user: { id: 'user-demo' } } as Session;
    let listener: ((event: string, nextSession: Session | null) => void) | undefined;
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.api.mockResolvedValue({ kind: 'cliente', display_name: 'Pessoa Demo', city: '', category: '', about: '' });
    mocks.onAuthStateChange.mockImplementation((callback) => {
      listener = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    render(<AppProvider><SessionSnapshot /></AppProvider>);
    expect(await screen.findByText('sessão ativa')).toBeVisible();
    act(() => listener?.('SIGNED_OUT', null));
    await waitFor(() => expect(screen.getByText(/Sua sessão terminou/i)).toBeVisible());
    expect(screen.getByText('sem sessão')).toBeVisible();
  });
});
