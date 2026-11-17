import { describe, expect, it } from 'vitest';
import { ApiError } from '../api';
import { formatRequestDate, requestErrorMessage, requestReference } from './requestUi';

describe('apresentação de solicitações', () => {
  it('diferencia validação, sessão, autorização, ausência, conflito e rede', () => {
    expect(requestErrorMessage(new ApiError('INVALID', 400), 'create')).toMatch(/Revise/);
    expect(requestErrorMessage(new ApiError('JWT', 401), 'list')).toMatch(/sessão terminou/);
    expect(requestErrorMessage(new ApiError('FORBIDDEN', 403), 'action')).toMatch(/não tem permissão/);
    expect(requestErrorMessage(new ApiError('MISSING', 404), 'details')).toMatch(/não encontrada/);
    expect(requestErrorMessage(new ApiError('CONFLICT', 409), 'action')).toMatch(/atualizada/);
    expect(requestErrorMessage(new TypeError('Failed to fetch'), 'create')).toMatch(/conectar/);
  });

  it('formata apenas datas válidas e reduz a referência exibida', () => {
    expect(formatRequestDate('2026-11-12')).toBe('12/11/2026');
    expect(formatRequestDate('invalid')).toBeNull();
    expect(requestReference('12345678-abcd-ef00-0000-000000000000')).toBe('12345678');
  });
});
