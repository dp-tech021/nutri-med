import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Alert } from './States';
import { Button } from './Button';
import { ConfirmationModal } from './ConfirmationModal';
import { Field, Input } from './FormControls';

describe('componentes essenciais do design system', () => {
  it('desabilita botão durante carregamento e comunica o estado', () => {
    render(<Button loading>Salvar alterações</Button>);
    const button = screen.getByRole('button', { name: 'Salvar alterações' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('associa rótulo, ajuda e erro ao campo', () => {
    render(<Field label="E-mail" htmlFor="email" hint="Use seu e-mail de acesso." error="E-mail inválido" required>
      <Input id="email" aria-describedby="email-hint email-error" />
    </Field>);
    expect(screen.getByLabelText(/E-mail/)).toHaveAttribute('aria-describedby', 'email-hint email-error');
    expect(screen.getByText('E-mail inválido')).toBeVisible();
  });

  it('distingue feedback crítico de feedback informativo', () => {
    const { rerender } = render(<Alert variant="error">Falha ao salvar.</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao salvar.');
    rerender(<Alert variant="success">Alterações salvas.</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('Alterações salvas.');
  });

  it('mantém foco no modal, fecha com Escape e devolve o foco', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const opener = document.createElement('button');
    opener.textContent = 'Abrir confirmação';
    document.body.append(opener);
    opener.focus();
    const { rerender } = render(<ConfirmationModal
      open
      title="Confirmar ação"
      description="Revise antes de continuar."
      confirmLabel="Confirmar"
      onConfirm={vi.fn()}
      onClose={onClose}
    />);

    const cancel = screen.getByRole('button', { name: 'Voltar' });
    const confirm = screen.getByRole('button', { name: 'Confirmar' });
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();

    rerender(<ConfirmationModal open={false} title="Confirmar ação" description="Revise antes de continuar." confirmLabel="Confirmar" onConfirm={vi.fn()} onClose={onClose} />);
    expect(opener).toHaveFocus();
    opener.remove();
  });
});
