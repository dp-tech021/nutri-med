import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type RequestItem, type Service } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Notice } from '../components/Notice';
import { errorMessage } from '../utils/errors';

export function DashboardPage() {
  const { session, profile } = useApp();
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session || !profile) return;
    void api<RequestItem[]>('/requests', 'GET', undefined, session)
      .then(setRequests)
      .catch((requestError) => setError(errorMessage(requestError)));
    if (profile.kind === 'prestador') {
      void api<Service[]>('/my/services', 'GET', undefined, session)
        .then(setServices)
        .catch((requestError) => setError(errorMessage(requestError)));
    }
  }, [session, profile]);

  async function deactivate(id: string) {
    if (!window.confirm('Desativar anúncio? Pedidos anteriores serão preservados.')) return;
    try {
      await api('/services/' + id, 'PATCH', { active: false }, session);
      setServices((current) => current.map((service) => service.id === id ? { ...service, active: false } : service));
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  return <Layout>
    <h1 className="text-3xl font-bold">Painel {profile?.kind === 'prestador' ? 'do prestador' : 'do cliente'}</h1>
    <Notice error={error} />
    {profile?.kind === 'prestador' && <>
      <p className="my-4"><Link className="btn" to="/novo-servico">Publicar serviço</Link></p>
      <h2 className="font-semibold text-xl my-3">Meus anúncios</h2>
      <div className="grid gap-3">
        {services.map((service) => <div className="card" key={service.id}>
          <strong>{service.title}</strong> — {service.city}
          <Link className="ml-3" to={'/editar-servico/' + service.id}>Editar</Link>
          <button className="btn btn-outline ml-3" onClick={() => void deactivate(service.id)}>Desativar</button>
        </div>)}
      </div>
    </>}
    <h2 className="font-semibold text-xl my-4">Solicitações e atendimentos</h2>
    <div className="grid gap-3">
      {requests.map((request) => <Link className="card block" key={request.id} to={'/pedido/' + request.id}>
        <strong>{request.snapshot_title}</strong><p>{request.status.replaceAll('_', ' ')}</p>
      </Link>)}
      {!requests.length && <p>Nenhuma solicitação ainda.</p>}
    </div>
  </Layout>;
}
