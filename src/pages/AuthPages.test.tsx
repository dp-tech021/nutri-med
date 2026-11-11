import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppContext } from '../app/AppContext';
import { AuthPage, safeInternalPath } from './AuthPages';

describe('cadastro a partir da landing', () => {
  it('preseleciona prestador quando solicitado pela URL', () => {
    render(<AppContext.Provider value={{ session: null, profile: null, refresh: async () => undefined }}>
      <MemoryRouter initialEntries={['/cadastro?tipo=prestador']}>
        <AuthPage mode="cadastro" />
      </MemoryRouter>
    </AppContext.Provider>);

    expect(screen.getByRole('combobox', { name: 'Tipo de conta' })).toHaveValue('prestador');
    expect(screen.getByRole('textbox', { name: 'Cidade' })).toBeVisible();
  });
});


describe('retorno após login', () => {
  it('aceita apenas caminhos internos e bloqueia redirecionamento externo', () => {
    expect(safeInternalPath('/servico/123')).toBe('/servico/123');
    expect(safeInternalPath('//example.com')).toBe('/dashboard');
    expect(safeInternalPath('/\\example.com')).toBe('/dashboard');
    expect(safeInternalPath('https://example.com')).toBe('/dashboard');
    expect(safeInternalPath(undefined)).toBe('/dashboard');
  });
});
