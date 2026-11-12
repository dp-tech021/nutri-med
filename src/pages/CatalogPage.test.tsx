import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { CatalogPage, catalogParams } from './CatalogPage';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return { ...actual, api: vi.fn() };
});
const apiMock = vi.mocked(api);
function LocationProbe() {
  const location = useLocation();
  return <output aria-label="URL atual">{location.pathname}{location.search}</output>;
}

describe('categoria na URL do catálogo', () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation(async (path) => path === '/categories' ? [{ slug: 'organizacao', label: 'Organização' }] : { items: [], next_cursor: null });
  });

  it('inicializa o filtro pela query string e permite limpá-lo', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/servicos?category=organizacao']}><CatalogPage /><LocationProbe /></MemoryRouter>);
    expect(await screen.findByRole('option', { name: 'Organização' })).toBeInTheDocument();
    expect(screen.getByLabelText('Categoria')).toHaveValue('organizacao');
    await waitFor(() => expect(apiMock.mock.calls.some(([path]) => String(path).includes('category=organizacao'))).toBe(true));
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByLabelText('Categoria')).toHaveValue('');
    expect(screen.getByLabelText('URL atual')).toHaveTextContent('/servicos');
  });

  it('mantém a serialização dos filtros e da paginação existentes', () => {
    expect(catalogParams({ category: 'organizacao', city: 'Recife', term: 'org', searchIn: 'service', modality: 'presencial' }, 'cursor-demo').toString()).toBe('limit=12&cursor=cursor-demo&category=organizacao&city=Recife&modality=presencial&q=org&search_in=service');
  });
});
