import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, api, money, type Proposal, type RequestItem } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Notice } from '../components/Notice';
import { Alert, Breadcrumbs, Button, Card, ConfirmationModal, ErrorState, Field, Input, LoadingState, StatusBadge, Textarea } from '../components/ui';
import { formatRequestDate, requestErrorMessage, requestReference } from '../utils/requestUi';

type RequestView = {
  request: RequestItem;
  proposals: Proposal[];
  events: { action: string; to_status: string; created_at: string }[];
  contract: Proposal | null;
};

export function RequestDetailsPage() {
  const { id } = useParams();
  const { session, profile } = useApp();
  const [data, setData] = useState<RequestView | null>(null);
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [scope, setScope] = useState('');
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('7');
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    setErrorStatus(null);
    try {
      setData(await api<RequestView>('/requests/' + id, 'GET', undefined, session));
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'details'));
      setErrorStatus(requestError instanceof ApiError ? requestError.status : null);
    }
  }, [id, session]);

  useEffect(() => {
    if (session) void load();
  }, [session, load]);

  async function act(action: string) {
    setBusy(true);
    setError('');
    setErrorStatus(null);
    try {
      const updated = await api<RequestItem>('/requests/' + id + '/actions', 'POST', {
        action,
        ...(['enviar_proposta', 'revisar_proposta'].includes(action) ? {
          price_cents: Math.round(Number(price) * 100),
          duration_days: Number(days),
          scope,
        } : {}),
        ...(action === 'aceitar' ? { version: data?.request.current_version } : {}),
      }, session);
      setData((current) => current ? { ...current, request: updated } : current);
      await load();
      setPendingAction(null);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'action'));
      setErrorStatus(requestError instanceof ApiError ? requestError.status : null);
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Layout>{errorStatus === 401
    ? <Alert variant="error" title="Sessão encerrada"><p>{error}</p><Link to="/login" state={{ from: `/pedido/${id}` }}>Entrar novamente</Link></Alert>
    : error ? <ErrorState title={errorStatus === 404 ? 'Solicitação indisponível' : undefined} description={error} onRetry={errorStatus === 404 ? undefined : () => void load()} />
      : <LoadingState label="Carregando solicitação..." />}</Layout>;

  const request = data.request;
  const customer = profile?.kind === 'cliente';
  const lastProposal = data.proposals[0];
  const actions = customer
    ? request.status === 'aguardando_proposta' ? ['cancelar']
      : request.status === 'proposta_enviada' ? ['aceitar', 'recusar_proposta', 'cancelar']
        : request.status === 'aguardando_confirmacao' ? ['confirmar'] : []
    : request.status === 'aguardando_proposta' ? ['enviar_proposta', 'recusar_pedido']
      : request.status === 'proposta_enviada' ? ['revisar_proposta']
        : request.status === 'contratado' ? ['iniciar']
          : request.status === 'em_andamento' ? ['finalizar'] : [];
  const actionLabels: Record<string, string> = {
    cancelar: 'Cancelar solicitação',
    aceitar: 'Aceitar proposta',
    recusar_proposta: 'Recusar proposta',
    confirmar: 'Confirmar conclusão',
    enviar_proposta: 'Enviar proposta',
    recusar_pedido: 'Recusar solicitação',
    revisar_proposta: 'Enviar nova versão',
    iniciar: 'Iniciar atendimento',
    finalizar: 'Informar finalização',
  };
  const destructiveActions = ['cancelar', 'recusar_proposta', 'recusar_pedido'];

  return <Layout>
    <Breadcrumbs items={[{ label: customer ? 'Minhas solicitações' : 'Painel', to: customer ? '/minhas-solicitacoes' : '/dashboard' }, { label: request.snapshot_title }]} />
    <p className="eyebrow">Referência {requestReference(request.id)}</p>
    <h1 className="text-2xl font-bold">{request.snapshot_title}</h1>
    <p className="my-2">Estado: <StatusBadge status={request.status} /></p>
    <Card className="request-detail-summary">
      <h2>Necessidade informada</h2>
      <p>{request.need}</p>
      {request.desired_date && <p><strong>Data desejada:</strong> {formatRequestDate(request.desired_date)} <span className="muted">(preferência, não agendamento confirmado)</span></p>}
      {request.created_at && <p className="muted">Enviada em {formatRequestDate(request.created_at)}</p>}
    </Card>
    {lastProposal && <Card className="my-4">
      <h2 className="font-semibold">Proposta vigente — versão {lastProposal.version}</h2>
      <p>Valor: {money(lastProposal.price_cents)} • Prazo: {lastProposal.duration_days} dias</p>
      <p>{lastProposal.scope}</p>
    </Card>}
    {actions.some((action) => ['enviar_proposta', 'revisar_proposta'].includes(action)) && <Card className="my-3">
      <Field label="Valor proposto em R$" htmlFor="proposal-price" required><Input id="proposal-price" type="number" min="0" step=".01" value={price} onChange={(event) => setPrice(event.target.value)} /></Field>
      <Field label="Prazo (dias)" htmlFor="proposal-days" required><Input id="proposal-days" type="number" min="1" max="365" value={days} onChange={(event) => setDays(event.target.value)} /></Field>
      <Field label="Escopo da proposta" htmlFor="proposal-scope" required><Textarea id="proposal-scope" minLength={10} maxLength={2000} value={scope} onChange={(event) => setScope(event.target.value)} /></Field>
    </Card>}
    <div className="flex flex-wrap gap-2 my-4">
      {actions.map((action) => <Button variant={destructiveActions.includes(action) ? 'danger' : 'primary'} disabled={busy} key={action} onClick={() => setPendingAction(action)}>{actionLabels[action] ?? action.replaceAll('_', ' ')}</Button>)}
    </div>
    {errorStatus === 401
      ? <Alert variant="error" title="Sessão encerrada"><p>{error}</p><Link to="/login" state={{ from: `/pedido/${id}` }}>Entrar novamente</Link></Alert>
      : <Notice error={error} />}
    <h2 className="font-semibold text-xl mt-4">Histórico</h2>
    {data.events.length ? <ol className="request-history">
      {data.events.map((event, index) => <li key={index}><span>{event.action.replaceAll('_', ' ')}</span><StatusBadge status={event.to_status} />{formatRequestDate(event.created_at) && <small>{formatRequestDate(event.created_at)}</small>}</li>)}
    </ol> : <p className="muted">Nenhuma atualização registrada além da criação.</p>}
    <p className="muted mt-4">Após o aceite, não é possível cancelar pelo fluxo comum. Conclusão exige confirmação do cliente.</p>
    <ConfirmationModal
      open={Boolean(pendingAction)}
      title={pendingAction === 'aceitar' ? 'Aceitar esta proposta?' : pendingAction === 'cancelar' ? 'Cancelar solicitação?' : pendingAction === 'recusar_proposta' ? 'Recusar proposta?' : 'Confirmar ação'}
      description={pendingAction === 'aceitar'
        ? 'Você confirma a versão vigente e as condições apresentadas nesta proposta.'
        : pendingAction === 'cancelar'
          ? 'A solicitação será cancelada se o estado atual ainda permitir. Esta ação não pode ser desfeita pela interface.'
          : pendingAction === 'recusar_proposta'
            ? 'A proposta vigente será recusada se o estado atual ainda permitir.'
            : `Você deseja ${pendingAction ? (actionLabels[pendingAction] ?? pendingAction).toLowerCase() : 'continuar'}?`}
      confirmLabel={pendingAction ? (actionLabels[pendingAction] ?? 'Confirmar') : 'Confirmar'}
      destructive={pendingAction ? destructiveActions.includes(pendingAction) : false}
      busy={busy}
      onClose={() => setPendingAction(null)}
      onConfirm={() => { if (pendingAction) void act(pendingAction); }}
    />
  </Layout>;
}
