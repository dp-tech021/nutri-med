import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Notice } from '../components/Notice';
import { errorMessage } from '../utils/errors';

export function ProfileSetupPage() {
  const { session, refresh } = useApp();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'cliente' | 'prestador'>('cliente');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [about, setAbout] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const profileDraft = JSON.parse(sessionStorage.getItem('registration') || 'null');
      if (profileDraft) {
        setName(profileDraft.display_name || '');
        setKind(profileDraft.kind === 'prestador' ? 'prestador' : 'cliente');
        setCity(profileDraft.city || '');
        setCategory(profileDraft.category || '');
        setAbout(profileDraft.about || '');
      }
    } catch {
      sessionStorage.removeItem('registration');
    }
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api('/profiles', 'POST', { display_name: name, kind, city, category, about }, session);
      sessionStorage.removeItem('registration');
      await refresh();
    } catch (submitError) {
      setError(errorMessage(submitError));
    }
  }

  return <Layout>
    <h1 className="text-2xl font-semibold">Complete seu perfil</h1>
    <form className="card max-w-lg mt-3" onSubmit={(event) => void submit(event)}>
      <label className="field">Nome<input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="field">Conta<select value={kind} onChange={(event) => setKind(event.target.value as 'cliente' | 'prestador')}><option value="cliente">Cliente</option><option value="prestador">Prestador</option></select></label>
      <label className="field">Cidade<input value={city} onChange={(event) => setCity(event.target.value)} /></label>
      {kind === 'prestador' && <>
        <label className="field">Categoria<input value={category} onChange={(event) => setCategory(event.target.value)} /></label>
        <label className="field">Sobre seus serviços<textarea value={about} onChange={(event) => setAbout(event.target.value)} /></label>
      </>}
      <button className="btn">Salvar perfil</button>
      <Notice error={error} />
    </form>
  </Layout>;
}
