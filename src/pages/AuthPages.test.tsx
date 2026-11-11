import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppContext } from '../app/AppContext';
import { AuthPage } from './AuthPages';

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
