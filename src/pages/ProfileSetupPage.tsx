import { useEffect, useRef, useState, type FormEvent } from 'react';
import { clearRegistrationDraft, readRegistrationDraft } from '../auth/registrationDraft';
import { api, ApiError } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Alert, Button, Field, Input, Select, Textarea } from '../components/ui';

function profileErrorMessage(error: unknown) {
  if (error instanceof TypeError || (error instanceof Error && /fetch|network|conex/i.test(`${error.name} ${error.message}`))) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }
  if (error instanceof ApiError && error.status === 409) {
    return 'O tipo desta conta já foi definido. Atualize a página para carregar o perfil existente.';
  }
  return 'Não foi possível salvar o perfil. Revise os campos e tente novamente.';
}

export function ProfileSetupPage() {
  const { session, refresh } = useApp();
  const mounted = useRef(true);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'cliente' | 'prestador'>('cliente');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [about, setAbout] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session?.user.id) return;
    const draft = readRegistrationDraft(sessionStorage, session.user.id);
    if (draft) {
      setName(draft.displayName);
      setKind(draft.kind);
    }
  }, [session?.user.id]);

  useEffect(() => () => { mounted.current = false; }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !session) return;
    setBusy(true);
    setError('');
    try {
      await api('/profiles', 'POST', {
        display_name: name.trim(),
        kind,
        city: city.trim(),
        category: kind === 'prestador' ? category.trim() : '',
        about: kind === 'prestador' ? about.trim() : '',
      }, session);
      clearRegistrationDraft(sessionStorage);
      await refresh();
    } catch (submitError) {
      if (mounted.current) setError(profileErrorMessage(submitError));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return <Layout>
    <div className="profile-setup-layout">
      <header>
        <p className="eyebrow">Última etapa</p>
        <h1>Complete seu perfil</h1>
        <p>Essas informações ajudam a adaptar a experiência para clientes e prestadores.</p>
      </header>
      <form className="profile-setup-form" onSubmit={(event) => void submit(event)}>
        <Field label="Nome de exibição" htmlFor="profile-name" required>
          <Input id="profile-name" required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Tipo de conta" htmlFor="profile-kind" required hint="A escolha enviada pela interface não concede permissões. O backend valida e mantém o papel da conta.">
          <Select id="profile-kind" value={kind} onChange={(event) => setKind(event.target.value as 'cliente' | 'prestador')}>
            <option value="cliente">Cliente</option>
            <option value="prestador">Prestador</option>
          </Select>
        </Field>
        <Field label="Cidade" htmlFor="profile-city">
          <Input id="profile-city" maxLength={100} autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)} />
        </Field>
        {kind === 'prestador' && <>
          <Field label="Categoria principal" htmlFor="profile-category" required>
            <Input id="profile-category" required minLength={2} maxLength={100} value={category} onChange={(event) => setCategory(event.target.value)} />
          </Field>
          <Field label="Apresentação pública" htmlFor="profile-about" hint="Não inclua dados médicos, documentos ou informações de clientes.">
            <Textarea id="profile-about" maxLength={1000} value={about} onChange={(event) => setAbout(event.target.value)} />
          </Field>
        </>}
        {error && <Alert variant="error" title="Não foi possível salvar">{error}</Alert>}
        <Button loading={busy}>Salvar perfil</Button>
      </form>
    </div>
  </Layout>;
}
