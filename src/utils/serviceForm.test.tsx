import { describe, expect, it } from 'vitest';
import { formatCentsForInput, parseBrlToCents } from './serviceForm';

describe('valores de serviços em BRL', () => {
  it('converte reais em centavos sem cálculo de ponto flutuante', () => {
    expect(parseBrlToCents('150')).toBe(15000);
    expect(parseBrlToCents('150,5')).toBe(15050);
    expect(parseBrlToCents('0.09')).toBe(9);
    expect(formatCentsForInput(15050)).toBe('150,50');
  });

  it('rejeita casas extras, separadores de milhar e valores acima do contrato', () => {
    expect(parseBrlToCents('12,345')).toBeNull();
    expect(parseBrlToCents('1.200,00')).toBeNull();
    expect(parseBrlToCents('1000000,01')).toBeNull();
    expect(parseBrlToCents('-1')).toBeNull();
  });
});
