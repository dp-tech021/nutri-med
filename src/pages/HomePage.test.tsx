import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppContext } from '../app/AppContext';
import { HomePage } from './HomePage';

describe('página inicial', () => {
  it('explica o fluxo real e oferece CTAs para rotas existentes', () => {
    render(<AppContext.Provider value={{ session: null, profile: null, refresh: async () => undefined }}>
      <MemoryRouter><HomePage /></MemoryRouter>
    </AppContext.Provider>);

    expect(screen.getByRole('heading', { level: 1, name: /Encontre quem pode ajudar/i })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Encontre um serviço' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Solicite um orçamento' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Analise a proposta' })).toBeVisible();
    expect(screen.getAllByRole('link', { name: /Explorar serviços/i })[0]).toHaveAttribute('href', '/servicos');
    expect(screen.getByRole('link', { name: 'Criar conta de prestador' })).toHaveAttribute('href', '/cadastro');
    expect(screen.getByText(/não realiza pagamentos/i)).toBeVisible();
  });
});
