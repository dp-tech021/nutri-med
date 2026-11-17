import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@supabase/supabase-js';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppContext } from '../app/AppContext';
import { Layout } from './Layout';

describe('navegação responsiva', () => {
  it('expõe o estado do menu, move o foco e fecha com Escape', async () => {
    const user = userEvent.setup();
    render(<AppContext.Provider value={{ session: null, profile: null, refresh: async () => undefined }}>
      <MemoryRouter><Layout><h1>Conteúdo</h1></Layout></MemoryRouter>
    </AppContext.Provider>);

    const menuButton = screen.getByRole('button', { name: 'Abrir menu' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(menuButton);
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link', { name: 'Início' })[0]).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(menuButton).toHaveFocus();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });
});

it.each([false, true])('preserva links das áreas e estado autenticado=%s', async (authenticated) => {
  const user = userEvent.setup();
  render(<AppContext.Provider value={{
    session: authenticated ? { user: { id: 'synthetic' } } as Session : null,
    profile: authenticated ? { kind: 'cliente', display_name: 'Cliente sintético', city: '', category: '', about: '' } : null,
    refresh: async () => undefined,
  }}>
    <MemoryRouter><Layout><h1>Conteúdo</h1></Layout><LocationSnapshot /></MemoryRouter>
  </AppContext.Provider>);
  for (const label of ['Navegação principal', 'Navegação do rodapé']) {
    const nav = within(screen.getByRole('navigation', { name: label }));
    expect(nav.getByRole('link', { name: 'Saúde' })).toHaveAttribute('href', '/saude');
    expect(nav.getByRole('link', { name: 'Serviços' })).toHaveAttribute('href', '/servicos');
    expect(nav.getByRole('link', { name: 'Como funciona' })).toHaveAttribute('href', '/#como-funciona');
    expect(nav.queryByRole('link', { name: 'Entrar' }) !== null).toBe(!authenticated);
    expect(nav.queryByRole('link', { name: 'Painel' }) !== null).toBe(authenticated);
  }
  if (authenticated) {
    expect(screen.getByText('Cliente sintético')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Criar conta' })).not.toBeInTheDocument();
  }
  const toggle = screen.getByRole('button', { name: 'Abrir menu' });
  toggle.focus();
  await user.keyboard('{Enter}');
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await user.keyboard('{Tab}{Enter}');
  expect(screen.getByLabelText('destino')).toHaveTextContent('/saude');
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

function LocationSnapshot() {
  return <output aria-label="destino">{useLocation().pathname}</output>;
}
