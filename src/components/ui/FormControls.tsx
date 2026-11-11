import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { classNames } from './utils';

export function Field({ label, htmlFor, hint, error, required, children, className }: { label: string; htmlFor: string; hint?: string; error?: string; required?: boolean; children: ReactNode; className?: string }) {
  return <div className={classNames('ui-field', className)}>
    <label className="ui-label" htmlFor={htmlFor}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    {children}
    {hint && <p className="ui-field__hint" id={`${htmlFor}-hint`}>{hint}</p>}
    {error && <p className="ui-field__error" id={`${htmlFor}-error`}>{error}</p>}
  </div>;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={classNames('ui-control', className)} {...props} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={classNames('ui-control ui-control--textarea', className)} {...props} />;
});
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return <select ref={ref} className={classNames('ui-control', className)} {...props}>{children}</select>;
});
export function Checkbox({ label, description, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return <label className={classNames('ui-checkbox', className)}><input type="checkbox" {...props} /><span><strong>{label}</strong>{description && <small>{description}</small>}</span></label>;
}
