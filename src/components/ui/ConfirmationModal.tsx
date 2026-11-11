import { useEffect, useRef, type KeyboardEvent } from 'react';
import { Button } from './Button';

export function ConfirmationModal({ open, title, description, confirmLabel, cancelLabel = 'Voltar', destructive = false, busy = false, onConfirm, onClose }: { open: boolean; title: string; description: string; confirmLabel: string; cancelLabel?: string; destructive?: boolean; busy?: boolean; onConfirm: () => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, [open]);
  if (!open) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); return; }
    if (event.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  return <div className="ui-modal-backdrop"><div ref={dialogRef} className="ui-modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-description" onKeyDown={handleKeyDown}>
    <h2 id="confirmation-title">{title}</h2><p id="confirmation-description">{description}</p>
    <div className="ui-modal__actions"><Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={busy}>{cancelLabel}</Button><Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>{confirmLabel}</Button></div>
  </div></div>;
}
