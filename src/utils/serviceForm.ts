import { ApiError } from '../api';

export const maxServicePriceCents = 100_000_000;

export function parseBrlToCents(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d{1,7}(?:[,.]\d{1,2})?$/.test(normalized)) return null;
  const [reais, decimals = ''] = normalized.replace(',', '.').split('.');
  const cents = Number(reais) * 100 + Number(decimals.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= maxServicePriceCents ? cents : null;
}

export function formatCentsForInput(cents: number | null): string {
  if (cents == null) return '';
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`;
}

export function serviceRequestError(error: unknown): string {
  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return 'Anúncio não encontrado ou indisponível para esta conta.';
  }
  if (error instanceof TypeError) return 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.';
  return 'Não foi possível salvar o anúncio. Revise os dados e tente novamente.';
}
