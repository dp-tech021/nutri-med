import { ApiError } from '../api';

export type RequestOperation = 'create' | 'list' | 'details' | 'action';

export function requestErrorMessage(error: unknown, operation: RequestOperation): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return 'Revise os dados informados e tente novamente.';
    if (error.status === 401) return 'Sua sessão terminou. Entre novamente para continuar.';
    if (error.status === 403) return 'Esta conta não tem permissão para realizar essa ação.';
    if (error.status === 404) return operation === 'create'
      ? 'O serviço não está mais disponível para receber solicitações.'
      : 'Solicitação não encontrada ou indisponível para esta conta.';
    if (error.status === 409) return 'Esta solicitação foi atualizada em outra operação. Recarregue os dados antes de tentar novamente.';
  }
  if (error instanceof TypeError) return 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.';
  return operation === 'create'
    ? 'Não foi possível enviar a solicitação. Tente novamente.'
    : 'Não foi possível carregar as solicitações. Tente novamente.';
}

export function formatRequestDate(value?: string | null, withTime = false): string | null {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', withTime
    ? { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }
    : { dateStyle: 'short', timeZone: 'UTC' }).format(date);
}

export function requestReference(id: string): string {
  return id.replaceAll('-', '').slice(0, 8).toLocaleUpperCase('pt-BR');
}
