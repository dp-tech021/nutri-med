import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { classNames } from './utils';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', loading = false, disabled, children, ...props },
  ref,
) {
  return <button ref={ref} className={classNames('ui-button', `ui-button--${variant}`, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{children}</button>;
});

export type LinkButtonProps = LinkProps & { variant?: Exclude<ButtonVariant, 'danger'> };
export function LinkButton({ className, variant = 'primary', children, ...props }: LinkButtonProps) {
  return <Link className={classNames('ui-button', `ui-button--${variant}`, className)} {...props}>{children}</Link>;
}
