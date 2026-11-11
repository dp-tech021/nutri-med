import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Notice } from '../components/Notice';
import { errorMessage } from '../utils/errors';

export function safeInternalPath(value: unknown) {
  return typeof value === 'string' && /^\/(?!\/)/.test(value) && !value.includes('\\') ? value : '/dashboard';
}

export function AuthPage({ mode }: { mode: 'login' | 'cadastro' | 'recuperar' }) {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'cliente' | 'prestador'>('cliente');
  const [city, setCity] = useState('');
  const [about, setAbout] = useState('');
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setOk('');
    try {
      if (mode === 'recuperar') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + '/atualizar-senha',
        });
        if (authError) throw authError;
        setOk('Se a conta existir, você receberá instruções no e-mail.');
      } else if (mode === 'cadastro') {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: location.origin + '/login' },
        });
        if (authError) throw authError;
        sessionStorage.setItem('registration', JSON.stringify({
          kind,
          display_name: name,
          city,
          category,
          about,
        }));
        setOk('Cadastro solicitado. Confirme seu e-mail e faça login para finalizar seu perfil.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        const intendedPath = (routeLocation.state as { from?: unknown } | null)?.from;
        navigate(safeInternalPath(intendedPath), { replace: true });
      }
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'cadastro'
    ? 'Criar conta'
    : mode === 'recuperar' ? 'Recuperar senha' : 'Entrar';

  return <Layout>
    <div className="card max-w-lg mx-auto">
      <h1 className="font-bold text-2xl mb-4">{title}</h1>
      <form onSubmit={(event) => void submit(event)}>
        {mode === 'cadastro' && <>
          <label className="field">Nome
            <input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="field">Tipo de conta
            <select value={kind} onChange={(event) => setKind(event.target.value as 'cliente' | 'prestador')}>
              <option value="cliente">Cliente</option>
              <option value="prestador">Prestador</option>
            </select>
          </label>
          {kind === 'prestador' && <>
            <label className="field">Cidade
              <input value={city} maxLength={100} onChange={(event) => setCity(event.target.value)} />
            </label>
            <label className="field">Categoria
              <input value={category} maxLength={100} onChange={(event) => setCategory(event.target.value)} />
            </label>
            <label className="field">Apresentação
              <textarea value={about} maxLength={1000} onChange={(event) => setAbout(event.target.value)} />
            </label>
          </>}
        </>}
        <label className="field">E-mail
          <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {mode !== 'recuperar' && <label className="field">Senha
          <input
            type="password"
            minLength={8}
            required
            autoComplete={mode === 'cadastro' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>}
        <button className="btn mt-3" disabled={busy}>{busy ? 'Processando...' : 'Continuar'}</button>
        <Notice error={error} ok={ok} />
      </form>
      <p className="mt-4"><Link to="/recuperar">Esqueci a senha</Link></p>
    </div>
  </Layout>;
}

export function ResetPasswordPage() {
  const { session } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      setOk('Senha atualizada. Agora você pode entrar com a nova senha.');
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  return <Layout>
    <section className="card max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">Definir nova senha</h1>
      {!session
        ? <p>Abra o link de recuperação recebido por e-mail. Se estiver expirado, solicite outro.</p>
        : <form onSubmit={(event) => void submit(event)}>
          <label className="field">Nova senha
            <input required type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button disabled={busy} className="btn">Atualizar senha</button>
        </form>}
      <Notice error={error} ok={ok} />
    </section>
  </Layout>;
}
