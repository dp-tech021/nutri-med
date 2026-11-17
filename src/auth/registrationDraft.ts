export const registrationDraftKey = 'nutri-med:registration-draft';
export const registrationDraftLifetimeMs = 30 * 60 * 1000;

export type RegistrationDraft = {
  userId: string;
  displayName: string;
  kind: 'cliente' | 'prestador';
  expiresAt: number;
};

type DraftInput = Omit<RegistrationDraft, 'expiresAt'>;
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function saveRegistrationDraft(storage: StorageLike, input: DraftInput, now = Date.now()) {
  const draft: RegistrationDraft = { ...input, expiresAt: now + registrationDraftLifetimeMs };
  storage.setItem(registrationDraftKey, JSON.stringify(draft));
}

export function readRegistrationDraft(storage: StorageLike, userId: string, now = Date.now()) {
  try {
    const parsed = JSON.parse(storage.getItem(registrationDraftKey) || 'null') as Partial<RegistrationDraft> | null;
    const valid = parsed
      && parsed.userId === userId
      && (parsed.kind === 'cliente' || parsed.kind === 'prestador')
      && typeof parsed.displayName === 'string'
      && parsed.displayName.length >= 2
      && parsed.displayName.length <= 100
      && typeof parsed.expiresAt === 'number'
      && parsed.expiresAt > now;
    if (!valid) {
      storage.removeItem(registrationDraftKey);
      return null;
    }
    return parsed as RegistrationDraft;
  } catch {
    storage.removeItem(registrationDraftKey);
    return null;
  }
}

export function clearRegistrationDraft(storage: StorageLike) {
  storage.removeItem(registrationDraftKey);
}
