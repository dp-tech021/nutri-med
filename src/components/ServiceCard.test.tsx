import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Service } from '../api';
import { ServiceCard } from './ServiceCard';

const baseService: Service = {
  id: 'service-1',
  title: 'Consultoria de demonstração',
  description: 'Descrição sintética usada somente para validar o card público.',
  category: '',
  city: '',
  modality: 'online',
  price_type: 'orcamento',
  price_cents: null,
  provider_name: 'Prestador Demo',
};

describe('card de serviço', () => {
  it('trata preço nulo e categoria vazia sem inventar dados', () => {
    render(<MemoryRouter><ServiceCard service={baseService} /></MemoryRouter>);
    expect(screen.getByText('Sob orçamento')).toBeVisible();
    expect(screen.getByText('Sem categoria')).toBeVisible();
    expect(screen.getByText('Cidade não informada')).toBeVisible();
    expect(screen.queryByText(/estrela|avaliação/i)).not.toBeInTheDocument();
  });

  it('identifica preço inicial e preço fixo', () => {
    const { rerender } = render(<MemoryRouter><ServiceCard service={{ ...baseService, price_type: 'inicial', price_cents: 12500 }} /></MemoryRouter>);
    expect(screen.getByText('A partir de')).toBeVisible();
    expect(screen.getByText(/R\$\s*125,00/)).toBeVisible();
    rerender(<MemoryRouter><ServiceCard service={{ ...baseService, price_type: 'fixo', price_cents: 20000 }} /></MemoryRouter>);
    expect(screen.getByText('Preço fixo')).toBeVisible();
    expect(screen.getByText(/R\$\s*200,00/)).toBeVisible();
  });
});
