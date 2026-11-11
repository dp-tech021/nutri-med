import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppContext } from '../app/AppContext';
import { AppRoutes } from './AppRoutes';

function LocationSnapshot() {
  const location = useLocation();
  return <output aria-label="localização">{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>;
}

describe('proteção de rotas', () => {
  it('leva visitante ao login e preserva somente a intenção interna', async () => {
    render(<AppContext.Provider value={{ session: null, profile: null, refresh: async () => undefined }}>
      <MemoryRouter initialEntries={['/pedido/abc?origem=painel']}><AppRoutes /><LocationSnapshot /></MemoryRouter>
    </AppContext.Provider>);
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeVisible();
    expect(screen.getByLabelText('localização')).toHaveTextContent('"pathname":"/login"');
    expect(screen.getByLabelText('localização')).toHaveTextContent('/pedido/abc?origem=painel');
  });
});
