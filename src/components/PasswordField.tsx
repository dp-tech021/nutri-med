import { useState } from 'react';
import { Field, Input } from './ui';

export function PasswordField({ id, label, value, onChange, autoComplete, hint, error }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  hint?: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return <Field label={label} htmlFor={id} required hint={hint} error={error}>
    <div className="password-control">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        required
        minLength={8}
        maxLength={72}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={describedBy}
      />
      <button type="button" className="password-toggle" aria-pressed={visible} aria-controls={id} onClick={() => setVisible((current) => !current)}>
        {visible ? 'Ocultar' : 'Mostrar'} senha
      </button>
    </div>
  </Field>;
}
