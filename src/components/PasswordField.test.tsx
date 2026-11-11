import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordField } from './PasswordField';

describe('campo de senha', () => {
  it('mostra e oculta a senha sem alterar o valor', async () => {
    const user = userEvent.setup();
    render(<PasswordField id="password" label="Senha" value="Senha-demo-123" onChange={() => undefined} autoComplete="current-password" />);
    const input = screen.getByLabelText(/^Senha/);
    const toggle = screen.getByRole('button', { name: 'Mostrar senha' });
    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true');
  });
});
