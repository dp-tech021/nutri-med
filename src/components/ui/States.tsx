import type { ReactNode } from 'react';
import { Button } from './Button';
import { classNames } from './utils';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';
export function Alert({ children, title, variant = 'info' }: { children?: ReactNode; title?: string; variant?: AlertVariant }) {
  return <div className={classNames('ui-alert', `ui-alert--${variant}`)} role={variant === 'error' ? 'alert' : 'status'}>{title && <strong>{title}</strong>}{children && <div>{children}</div>}</div>;
}
export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return <div className="ui-state" role="status"><span className="ui-spinner" aria-hidden="true" /><span>{label}</span></div>;
}
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="ui-state ui-state--empty"><strong>{title}</strong>{description && <p>{description}</p>}{action}</div>;
}
export function ErrorState({ title = 'Não foi possível concluir', description, onRetry }: { title?: string; description: string; onRetry?: () => void }) {
  return <div className="ui-state ui-state--error" role="alert"><strong>{title}</strong><p>{description}</p>{onRetry && <Button variant="secondary" onClick={onRetry}>Tentar novamente</Button>}</div>;
}
