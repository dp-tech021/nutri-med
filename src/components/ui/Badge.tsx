import { classNames } from './utils';

type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export function Badge({ children, variant = 'neutral' }: { children: string; variant?: BadgeVariant }) {
  return <span className={classNames('ui-badge', `ui-badge--${variant}`)}>{children}</span>;
}

const statusLabels: Record<string, { label: string; variant: BadgeVariant }> = {
  aguardando_proposta: { label: 'Aguardando proposta', variant: 'warning' },
  proposta_enviada: { label: 'Proposta recebida', variant: 'info' },
  contratado: { label: 'Contratado', variant: 'success' },
  em_andamento: { label: 'Em andamento', variant: 'info' },
  aguardando_confirmacao: { label: 'Aguardando confirmação', variant: 'warning' },
  concluido: { label: 'Concluído', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'neutral' },
  recusado: { label: 'Recusado', variant: 'danger' },
  pedido_recusado: { label: 'Pedido recusado', variant: 'danger' },
  proposta_recusada: { label: 'Proposta recusada', variant: 'danger' },
};
export function StatusBadge({ status }: { status: string }) {
  const current = statusLabels[status] ?? { label: status.replaceAll('_', ' '), variant: 'neutral' as const };
  return <Badge variant={current.variant}>{current.label}</Badge>;
}
