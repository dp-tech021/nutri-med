import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ApiError, api, money, type RequestItem, type Service } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Alert, Badge, Breadcrumbs, Button, Card, ConfirmationModal, EmptyState, ErrorState, LinkButton, LoadingState, StatusBadge } from '../components/ui';

function privateResourceError(error: unknown, fallback: string) {
  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return 'Conteúdo não encontrado ou indisponível para esta conta.';
  }
  if (error instanceof TypeError) return 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.';
  return fallback;
}

export function ProviderNav() {
  const location = useLocation();
  const items = [
    { to: '/dashboard', label: 'Visão geral' },
    { to: '/meus-servicos', label: 'Meus serviços' },
    { to: '/novo-servico', label: 'Novo serviço' },
    { to: '/solicitacoes-recebidas', label: 'Solicitações recebidas' },
    { to: '/propostas', label: 'Propostas' },
  ];
  return <nav className="provider-nav" aria-label="Área do prestador">
    {items.map((item) => <Link key={item.to} to={item.to} aria-current={location.pathname === item.to ? 'page' : undefined}>{item.label}</Link>)}
  </nav>;
}

function useProviderOverview() {
  const { session } = useApp();
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!session) return;
    setLoading(true);
    setError('');
    setServices([]);
    setRequests([]);
    try {
      const [nextServices, nextRequests] = await Promise.all([
        api<Service[]>('/my/services', 'GET', undefined, session),
        api<RequestItem[]>('/requests', 'GET', undefined, session),
      ]);
      if (version === requestVersion.current) {
        setServices(nextServices);
        setRequests(nextRequests);
      }
    } catch (requestError) {
      if (version === requestVersion.current) setError(privateResourceError(requestError, 'Não foi possível carregar o painel do prestador.'));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    void load();
    return () => { requestVersion.current += 1; };
  }, [load]);
  return { services, requests, loading, error, reload: load };
}

export function ProviderOverview() {
  const { services, requests, loading, error, reload } = useProviderOverview();
  const activeServices = services.filter((service) => service.active !== false).length;
  const received = requests.filter((request) => request.status === 'aguardando_proposta' && request.current_version === 0).length;
  const proposals = requests.filter((request) => request.current_version > 0).length;

  return <Layout>
    <div className="provider-page-heading"><div><p className="eyebrow">Área de trabalho</p><h1>Painel do prestador</h1></div><LinkButton to="/novo-servico">Novo serviço</LinkButton></div>
    <ProviderNav />
    {loading ? <LoadingState label="Carregando visão geral..." /> : error ? <ErrorState description={error} onRetry={() => void reload()} /> : <div className="provider-metrics">
      <Link className="ui-card provider-metric" to="/meus-servicos"><span>Serviços ativos</span><strong>{activeServices}</strong><small>{services.length} no total</small></Link>
      <Link className="ui-card provider-metric" to="/solicitacoes-recebidas"><span>Novas solicitações</span><strong>{received}</strong><small>Aguardando resposta</small></Link>
      <Link className="ui-card provider-metric" to="/propostas"><span>Com proposta</span><strong>{proposals}</strong><small>Acompanhe versões e estados</small></Link>
    </div>}
    <Alert variant="info" title="Controle de acesso no servidor">Esta área organiza suas ações. A API continua responsável por validar conta, propriedade dos anúncios e mudanças de estado.</Alert>
  </Layout>;
}

export function MyServicesPage() {
  const { session } = useApp();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingService, setPendingService] = useState<Service | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const requestVersion = useRef(0);

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!session) return;
    setLoading(true);
    setError('');
    setServices([]);
    try {
      const nextServices = await api<Service[]>('/my/services', 'GET', undefined, session);
      if (version === requestVersion.current) setServices(nextServices);
    } catch (requestError) {
      if (version === requestVersion.current) setError(privateResourceError(requestError, 'Não foi possível carregar seus serviços.'));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    void load();
    return () => { requestVersion.current += 1; };
  }, [load]);

  async function setActive(service: Service, active: boolean) {
    if (busyId) return;
    setBusyId(service.id);
    setError('');
    try {
      await api(`/services/${service.id}`, 'PATCH', { active }, session);
      setServices((current) => current.map((item) => item.id === service.id ? { ...item, active } : item));
      setPendingService(null);
    } catch (requestError) {
      setError(privateResourceError(requestError, 'Não foi possível alterar o status do anúncio.'));
    } finally {
      setBusyId(null);
    }
  }

  return <Layout>
    <Breadcrumbs items={[{ label: 'Painel', to: '/dashboard' }, { label: 'Meus serviços' }]} />
    <div className="provider-page-heading"><div><p className="eyebrow">Anúncios</p><h1>Meus serviços</h1></div><LinkButton to="/novo-servico">Novo serviço</LinkButton></div>
    <ProviderNav />
    {error && <ErrorState description={error} onRetry={() => void load()} />}
    {loading ? <LoadingState label="Carregando serviços..." /> : error ? null : !services.length ? <EmptyState title="Nenhum serviço publicado" description="Crie seu primeiro anúncio para que ele possa aparecer no catálogo após a validação da API." action={<LinkButton to="/novo-servico">Criar serviço</LinkButton>} /> : <div className="provider-list">
      {services.map((service) => <Card key={service.id} as="article" className="provider-service-card">
        <div className="provider-service-card__header"><div><h2>{service.title}</h2><p>{service.city} · {service.modality === 'online' ? 'Online' : 'Presencial'}</p></div><Badge variant={service.active === false ? 'neutral' : 'success'}>{service.active === false ? 'Inativo' : 'Ativo'}</Badge></div>
        <p>{service.price_type === 'inicial' ? 'A partir de ' : ''}{money(service.price_cents)}</p>
        <div className="provider-card-actions">
          <LinkButton variant="secondary" to={`/editar-servico/${service.id}`}>Editar</LinkButton>
          {service.active === false
            ? <Button loading={busyId === service.id} onClick={() => void setActive(service, true)}>Reativar</Button>
            : <Button variant="danger" disabled={Boolean(busyId)} onClick={() => setPendingService(service)}>Desativar</Button>}
        </div>
      </Card>)}
    </div>}
    <ConfirmationModal
      open={Boolean(pendingService)}
      title="Desativar anúncio?"
      description="Ele deixará de aparecer no catálogo. Solicitações, propostas e contratos anteriores serão preservados."
      confirmLabel="Desativar anúncio"
      destructive
      busy={Boolean(busyId)}
      onClose={() => setPendingService(null)}
      onConfirm={() => { if (pendingService) void setActive(pendingService, false); }}
    />
  </Layout>;
}

function ProviderRequestsPage({ view }: { view: 'received' | 'proposals' }) {
  const { session } = useApp();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!session) return;
    setLoading(true);
    setError('');
    setRequests([]);
    try {
      const nextRequests = await api<RequestItem[]>('/requests', 'GET', undefined, session);
      if (version === requestVersion.current) setRequests(nextRequests);
    } catch (requestError) {
      if (version === requestVersion.current) setError(privateResourceError(requestError, 'Não foi possível carregar as solicitações.'));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    void load();
    return () => { requestVersion.current += 1; };
  }, [load]);

  const items = useMemo(() => view === 'received'
    ? requests.filter((request) => request.status === 'aguardando_proposta' && request.current_version === 0)
    : requests.filter((request) => request.current_version > 0), [requests, view]);
  const received = view === 'received';
  const title = received ? 'Solicitações recebidas' : 'Propostas';

  return <Layout>
    <Breadcrumbs items={[{ label: 'Painel', to: '/dashboard' }, { label: title }]} />
    <div className="provider-page-heading"><div><p className="eyebrow">Atendimento</p><h1>{title}</h1></div></div>
    <ProviderNav />
    {error && <ErrorState description={error} onRetry={() => void load()} />}
    {loading ? <LoadingState label={`Carregando ${received ? 'solicitações' : 'propostas'}...`} /> : error ? null : !items.length ? <EmptyState
      title={received ? 'Nenhuma solicitação aguardando resposta' : 'Nenhuma proposta enviada'}
      description={received ? 'Novos pedidos destinados à sua conta aparecerão aqui.' : 'Após responder a uma solicitação, acompanhe aqui as versões e o andamento.'}
    /> : <div className="provider-list">
      {items.map((request) => <Link className="ui-card provider-request-card" key={request.id} to={`/pedido/${request.id}`}>
        <div><h2>{request.snapshot_title}</h2><p>{received ? 'Analise o pedido antes de enviar uma proposta.' : `Versão atual: ${request.current_version}`}</p></div>
        <StatusBadge status={request.status} />
      </Link>)}
    </div>}
  </Layout>;
}

export function ReceivedRequestsPage() {
  return <ProviderRequestsPage view="received" />;
}

export function ProviderProposalsPage() {
  return <ProviderRequestsPage view="proposals" />;
}
