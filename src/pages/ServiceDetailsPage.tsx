import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money, type Service } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Notice } from '../components/Notice';
import { errorMessage } from '../utils/errors';

type ServiceDetails = {
  service: Service;
  provider: { user_id: string; display_name: string; about: string };
};

export function ServiceDetailsPage() {
  const { id } = useParams();
  const { session, profile } = useApp();
  const navigate = useNavigate();
  const [item, setItem] = useState<ServiceDetails | null>(null);
  const [need, setNeed] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<ServiceDetails>('/services/' + id).then(setItem).catch((requestError) => setError(errorMessage(requestError)));
  }, [id]);

  async function request(event: FormEvent) {
    event.preventDefault();
    if (!session) return navigate('/login', { state: { from: `/servico/${id}` } });
    setBusy(true);
    setError('');
    try {
      await api('/requests', 'POST', { service_id: id, need, desired_date: date || null }, session);
      navigate('/dashboard');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return <Layout>{!item
    ? <Notice error={error || 'Carregando...'} />
    : <>
      <h1 className="text-3xl font-bold">{item.service.title}</h1>
      <p className="my-3">{item.service.description}</p>
      <p><Link to={'/prestador/' + item.provider.user_id}>{item.provider.display_name}</Link> • {item.service.city} • {item.service.modality}</p>
      <p className="font-semibold my-3">{money(item.service.price_cents)}</p>
      {profile?.kind === 'prestador'
        ? <p>Entre como cliente para solicitar orçamento.</p>
        : <form className="card max-w-xl mt-4" onSubmit={(event) => void request(event)}>
          <h2 className="font-semibold text-xl">Solicitar orçamento</h2>
          <label className="field">Descreva sua necessidade<textarea required minLength={10} maxLength={2000} value={need} onChange={(event) => setNeed(event.target.value)} /></label>
          <label className="field">Data desejada<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <button className="btn" disabled={busy}>{session ? 'Enviar solicitação' : 'Entrar para continuar'}</button>
          <Notice error={error} />
        </form>}
    </>}
  </Layout>;
}
