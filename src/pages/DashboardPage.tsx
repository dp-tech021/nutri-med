import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type RequestItem } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Notice } from '../components/Notice';
import { EmptyState, StatusBadge } from '../components/ui';
import { errorMessage } from '../utils/errors';
import { ProviderOverview } from './ProviderPages';

export function DashboardPage() {
  const { session, profile } = useApp();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session || profile?.kind !== 'cliente') return;
    void api<RequestItem[]>('/requests', 'GET', undefined, session)
      .then(setRequests)
      .catch((requestError) => setError(errorMessage(requestError)));
  }, [session, profile]);

  if (profile?.kind === 'prestador') return <ProviderOverview />;

  return <Layout>
    <h1 className="text-3xl font-bold">Painel do cliente</h1>
    <Notice error={error} />
    <h2 className="font-semibold text-xl my-4">Solicitações e atendimentos</h2>
    <div className="grid gap-3">
      {requests.map((request) => <Link className="ui-card block" key={request.id} to={'/pedido/' + request.id}>
        <strong>{request.snapshot_title}</strong><p><StatusBadge status={request.status} /></p>
      </Link>)}
      {!requests.length && <EmptyState title="Nenhuma solicitação ainda" description="Quando houver movimentações, elas aparecerão neste painel." />}
    </div>
  </Layout>;
}
