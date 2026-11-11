import { describe, expect, it } from 'vitest';
import { safeInternalPath } from './AuthPages';

describe('retorno após login', () => {
  it('aceita apenas caminhos internos e bloqueia redirecionamento externo', () => {
    expect(safeInternalPath('/servico/123')).toBe('/servico/123');
    expect(safeInternalPath('//example.com')).toBe('/dashboard');
    expect(safeInternalPath('/\\example.com')).toBe('/dashboard');
    expect(safeInternalPath('https://example.com')).toBe('/dashboard');
    expect(safeInternalPath(undefined)).toBe('/dashboard');
  });
});
