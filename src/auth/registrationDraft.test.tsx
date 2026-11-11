import { describe, expect, it } from 'vitest';
import { readRegistrationDraft, registrationDraftKey, registrationDraftLifetimeMs, saveRegistrationDraft } from './registrationDraft';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe('rascunho temporário de cadastro', () => {
  it('guarda somente os campos mínimos e expira em 30 minutos', () => {
    const storage = memoryStorage();
    saveRegistrationDraft(storage, { userId: 'user-1', displayName: 'Pessoa Demo', kind: 'cliente' }, 1000);
    const raw = storage.getItem(registrationDraftKey) || '';
    expect(raw).not.toMatch(/senha|password|token|about|city/i);
    expect(readRegistrationDraft(storage, 'user-1', 1000 + registrationDraftLifetimeMs - 1)?.displayName).toBe('Pessoa Demo');
    expect(readRegistrationDraft(storage, 'user-1', 1000 + registrationDraftLifetimeMs)).toBeNull();
    expect(storage.getItem(registrationDraftKey)).toBeNull();
  });

  it('descarta rascunho inválido ou pertencente a outro usuário', () => {
    const storage = memoryStorage();
    saveRegistrationDraft(storage, { userId: 'user-1', displayName: 'Pessoa Demo', kind: 'prestador' }, 1000);
    expect(readRegistrationDraft(storage, 'user-2', 1001)).toBeNull();
  });
});
