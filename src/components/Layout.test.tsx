import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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
