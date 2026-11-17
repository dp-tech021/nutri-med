import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { saveRegistrationDraft } from '../auth/registrationDraft';
import { supabase } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { PasswordField } from '../components/PasswordField';
import { Alert, Button, Field, Input, LinkButton } from '../components/ui';

type AuthOperation = 'login' | 'signup' | 'recovery' | 'password-update';

export function safeInternalPath(value: unknown) {
  return typeof value === 'string' && /^\/(?!\/)/.test(value) && !value.includes('\\') ? value : '/dashboard';
}

export function authErrorMessage(error: unknown, operation: AuthOperation) {
  const message = error instanceof Error ? `${error.name} ${error.message}` : '';
  if (error instanceof TypeError || /fetch|network|conex|offline/i.test(message)) {
    return 'Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente.';
  }
  if (operation === 'login') return 'Não foi possível entrar. Confira e-mail e senha e tente novamente.';
  if (operation === 'recovery') return 'Não foi possível enviar as instruções agora. Aguarde um momento e tente novamente.';
  if (operation === 'password-update') return 'Não foi possível atualizar a senha. Solicite um novo link e tente novamente.';
  return 'Não foi possível concluir o cadastro. Revise os dados ou tente entrar e recuperar sua senha.';
}

function authCallback(path: '/login' | '/atualizar-senha') {
  return new URL(path, window.location.origin).toString();
}

export function AuthPage({ mode }: { mode: 'login' | 'cadastro' | 'recuperar' }) {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const { authNotice, clearAuthNotice } = useApp();
  const mounted = useRef(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'cliente' | 'prestador'>(
    new URLSearchParams(routeLocation.search).get('tipo') === 'prestador' ? 'prestador' : 'cliente',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setOk('');
    if (mode === 'cadastro' && password !== passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'recuperar') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: authCallback('/atualizar-senha'),
        });
        if (authError) throw authError;
        if (mounted.current) setOk('Se a conta existir, você receberá instruções no e-mail.');
      } else if (mode === 'cadastro') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: authCallback('/login') },
        });
        if (authError) throw authError;
        if (!data.user?.id) throw new Error('Resposta de cadastro incompleta');
        saveRegistrationDraft(sessionStorage, {
          userId: data.user.id,
          kind,
          displayName: name.trim(),
        });
        if (!mounted.current) return;
        setPassword('');
        setPasswordConfirmation('');
        if (data.session) {
          navigate('/dashboard', { replace: true });
        } else {
          setOk('Cadastro solicitado. Confirme seu e-mail e depois entre para completar o perfil.');
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        if (!mounted.current) return;
        clearAuthNotice?.();
        const intendedPath = (routeLocation.state as { from?: unknown } | null)?.from;
        navigate(safeInternalPath(intendedPath), { replace: true });
      }
    } catch (submitError) {
      if (mounted.current) setError(authErrorMessage(submitError, mode === 'login' ? 'login' : mode === 'cadastro' ? 'signup' : 'recovery'));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  const title = mode === 'cadastro' ? 'Criar conta' : mode === 'recuperar' ? 'Recuperar senha' : 'Entrar';
  const subtitle = mode === 'cadastro'
    ? 'Crie uma conta para solicitar orçamentos ou publicar serviços.'
    : mode === 'recuperar'
      ? 'Informe seu e-mail. A resposta não confirma se existe uma conta cadastrada.'
      : 'Acesse sua conta para continuar de onde parou.';

  return <Layout>
    <div className="auth-layout">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">Conta Nutri-Med</p>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {authNotice && mode === 'login' && <Alert variant="info" title="Entre para continuar">{authNotice}</Alert>}
        <form onSubmit={(event) => void submit(event)} noValidate={false}>
          {mode === 'cadastro' && <>
            <Field label="Nome de exibição" htmlFor="auth-name" required hint="Use o nome que aparecerá no seu perfil.">
              <Input id="auth-name" required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Quero usar a plataforma como" htmlFor="auth-kind" required hint="Esta escolha orienta a interface. O servidor valida o papel e as permissões.">
              <select id="auth-kind" className="ui-control" value={kind} onChange={(event) => setKind(event.target.value as 'cliente' | 'prestador')}>
                <option value="cliente">Cliente — buscar e solicitar serviços</option>
                <option value="prestador">Prestador — publicar e responder propostas</option>
              </select>
            </Field>
          </>}
          <Field label="E-mail" htmlFor="auth-email" required>
            <Input id="auth-email" type="email" inputMode="email" required maxLength={254} autoComplete="email" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          {mode !== 'recuperar' && <PasswordField id="auth-password" label="Senha" value={password} onChange={setPassword} autoComplete={mode === 'cadastro' ? 'new-password' : 'current-password'} hint={mode === 'cadastro' ? 'Use de 8 a 72 caracteres.' : undefined} />}
          {mode === 'cadastro' && <PasswordField id="auth-password-confirmation" label="Confirme a senha" value={passwordConfirmation} onChange={setPasswordConfirmation} autoComplete="new-password" error={error === 'As senhas não coincidem.' ? error : undefined} />}
          {error && error !== 'As senhas não coincidem.' && <Alert variant="error" title="Não foi possível continuar">{error}</Alert>}
          {ok && <Alert variant="success" title="Verifique seu e-mail">{ok}</Alert>}
          <Button className="auth-submit" loading={busy}>{mode === 'login' ? 'Entrar' : mode === 'cadastro' ? 'Criar conta' : 'Enviar instruções'}</Button>
        </form>
        <div className="auth-links">
          {mode === 'login' && <><Link to="/recuperar">Esqueci minha senha</Link><span>Não tem conta? <Link to="/cadastro">Criar conta</Link></span></>}
          {mode === 'cadastro' && <span>Já tem conta? <Link to="/login">Entrar</Link></span>}
          {mode === 'recuperar' && <Link to="/login">Voltar para entrar</Link>}
        </div>
      </section>
      <aside className="auth-aside" aria-label="Informações de segurança">
        <span className="auth-aside__icon" aria-hidden="true">✓</span>
        <h2>Seus dados de acesso ficam com o serviço de autenticação</h2>
        <p>A interface não armazena sua senha. Permissões de cliente e prestador são verificadas novamente pelo backend.</p>
      </aside>
    </div>
  </Layout>;
}

export function ResetPasswordPage() {
  const { session } = useApp();
  const mounted = useRef(true);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setOk('');
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      if (mounted.current) {
        setPassword('');
        setConfirmation('');
        setOk('Senha atualizada. Você já pode continuar com a sessão recuperada.');
      }
    } catch (submitError) {
      if (mounted.current) setError(authErrorMessage(submitError, 'password-update'));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return <Layout>
    <section className="auth-card auth-card--centered" aria-labelledby="reset-title">
      <p className="eyebrow">Recuperação de conta</p>
      <h1 id="reset-title">Definir nova senha</h1>
      {!session
        ? <div className="auth-expired">
          <Alert variant="warning" title="Link inválido ou expirado">Abra o link mais recente enviado ao seu e-mail ou solicite novas instruções.</Alert>
          <LinkButton to="/recuperar">Solicitar novo link</LinkButton>
        </div>
        : <form onSubmit={(event) => void submit(event)}>
          <PasswordField id="reset-password" label="Nova senha" value={password} onChange={setPassword} autoComplete="new-password" hint="Use de 8 a 72 caracteres." />
          <PasswordField id="reset-confirmation" label="Confirme a nova senha" value={confirmation} onChange={setConfirmation} autoComplete="new-password" error={error === 'As senhas não coincidem.' ? error : undefined} />
          {error && error !== 'As senhas não coincidem.' && <Alert variant="error" title="Não foi possível atualizar">{error}</Alert>}
          {ok && <Alert variant="success" title="Senha atualizada">{ok}</Alert>}
          <Button loading={busy}>Atualizar senha</Button>
        </form>}
    </section>
  </Layout>;
}
