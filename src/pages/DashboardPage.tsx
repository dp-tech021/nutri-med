import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type RequestItem, type Service } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Notice } from '../components/Notice';
import { Button, Card, ConfirmationModal, EmptyState, LinkButton, StatusBadge } from '../components/ui';
import { errorMessage } from '../utils/errors';
import { ClientRequestsPage } from './ClientRequestsPage';

export function DashboardPage() {
  const { session, profile } = useApp();
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [error, setError] = useState('');
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (!session || !profile) return;
    if (profile.kind === 'prestador') {
      void api<RequestItem[]>('/requests', 'GET', undefined, session)
        .then(setRequests)
        .catch((requestError) => setError(errorMessage(requestError)));
      void api<Service[]>('/my/services', 'GET', undefined, session)
        .then(setServices)
        .catch((requestError) => setError(errorMessage(requestError)));
    }
  }, [session, profile]);

  async function deactivate(id: string) {
    setDeactivating(true);
    try {
      await api('/services/' + id, 'PATCH', { active: false }, session);
      setServices((current) => current.map((service) => service.id === id ? { ...service, active: false } : service));
      setPendingServiceId(null);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setDeactivating(false);
    }
  }

  if (profile?.kind === 'cliente') return <ClientRequestsPage />;

  return <Layout>
    <h1 className="text-3xl font-bold">Painel do prestador</h1>
    <Notice error={error} />
    {profile?.kind === 'prestador' && <>
      <p className="my-4"><LinkButton to="/novo-servico">Publicar novo serviço</LinkButton></p>
      <h2 className="font-semibold text-xl my-3">Meus anúncios</h2>
      <div className="grid gap-3">
        {services.map((service) => <Card as="div" key={service.id}>
          <strong>{service.title}</strong> — {service.city}
          <Link className="ml-3" to={'/editar-servico/' + service.id}>Editar</Link>
          {service.active !== false && <Button className="ml-3" variant="secondary" onClick={() => setPendingServiceId(service.id)}>Desativar anúncio</Button>}
        </Card>)}
        {!services.length && <EmptyState title="Nenhum anúncio publicado" description="Publique um serviço para começar a receber solicitações." />}
      </div>
    </>}
    <h2 className="font-semibold text-xl my-4">Solicitações e atendimentos</h2>
    <div className="grid gap-3">
      {requests.map((request) => <Link className="ui-card block" key={request.id} to={'/pedido/' + request.id}>
        <strong>{request.snapshot_title}</strong><p><StatusBadge status={request.status} /></p>
      </Link>)}
      {!requests.length && <EmptyState title="Nenhuma solicitação ainda" description="Quando houver movimentações, elas aparecerão neste painel." />}
    </div>
    <ConfirmationModal
      open={Boolean(pendingServiceId)}
      title="Desativar anúncio?"
      description="O anúncio deixa de aparecer no catálogo. Pedidos anteriores serão preservados."
      confirmLabel="Desativar anúncio"
      destructive
      busy={deactivating}
      onClose={() => setPendingServiceId(null)}
      onConfirm={() => { if (pendingServiceId) void deactivate(pendingServiceId); }}
    />
  </Layout>;
}
