import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api, type RequestItem } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Alert, Breadcrumbs, EmptyState, ErrorState, LinkButton, LoadingState, StatusBadge } from '../components/ui';
import { formatRequestDate, requestErrorMessage, requestReference } from '../utils/requestUi';

export function ClientRequestsPage() {
  const { session } = useApp();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError('');
    setErrorStatus(null);
    try {
      setRequests(await api<RequestItem[]>('/requests', 'GET', undefined, session));
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'list'));
      setErrorStatus(requestError instanceof ApiError ? requestError.status : null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  return <Layout>
    <Breadcrumbs items={[{ label: 'Painel', to: '/dashboard' }, { label: 'Minhas solicitações' }]} />
    <div className="client-page-heading">
      <div><p className="eyebrow">Orçamentos</p><h1>Minhas solicitações</h1><p>Acompanhe propostas e mudanças de estado. Uma solicitação ainda não representa contratação ou pagamento.</p></div>
      <LinkButton to="/servicos">Explorar serviços</LinkButton>
    </div>
    {errorStatus === 401
      ? <Alert variant="error" title="Sessão encerrada"><p>{error}</p><Link to="/login" state={{ from: '/minhas-solicitacoes' }}>Entrar novamente</Link></Alert>
      : error && <ErrorState description={error} onRetry={() => void load()} />}
    {loading ? <LoadingState label="Carregando suas solicitações..." /> : !error && !requests.length ? <EmptyState
      title="Você ainda não enviou solicitações"
      description="Explore os serviços e peça um orçamento quando encontrar uma opção adequada."
      action={<LinkButton to="/servicos">Explorar serviços</LinkButton>}
    /> : !error && <div className="client-request-list">
      {requests.map((request) => {
        const created = formatRequestDate(request.created_at);
        const updated = formatRequestDate(request.updated_at);
        return <article className="ui-card client-request-card" key={request.id}>
          <div className="client-request-card__header"><div><p className="eyebrow">Referência {requestReference(request.id)}</p><h2>{request.snapshot_title}</h2></div><StatusBadge status={request.status} /></div>
          <dl className="client-request-meta">
            {request.provider_name && <div><dt>Prestador</dt><dd>{request.provider_name}</dd></div>}
            {created && <div><dt>Enviada em</dt><dd>{created}</dd></div>}
            {updated && request.updated_at !== request.created_at && <div><dt>Última atualização</dt><dd>{updated}</dd></div>}
          </dl>
          <LinkButton variant="secondary" to={`/pedido/${request.id}`}>Ver detalhes</LinkButton>
        </article>;
      })}
    </div>}
  </Layout>;
}
