import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, money, type Proposal, type RequestItem } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Notice } from '../components/Notice';
import { Breadcrumbs, Button, Card, ConfirmationModal, ErrorState, Field, Input, LoadingState, StatusBadge, Textarea } from '../components/ui';
import { errorMessage } from '../utils/errors';

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
  const [scope, setScope] = useState('');
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('7');
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api<RequestView>('/requests/' + id, 'GET', undefined, session));
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }, [id, session]);

  useEffect(() => {
    if (session) void load();
  }, [session, load]);

  async function act(action: string) {
    setBusy(true);
    setError('');
    try {
      await api('/requests/' + id + '/actions', 'POST', {
        action,
        ...(['enviar_proposta', 'revisar_proposta'].includes(action) ? {
          price_cents: Math.round(Number(price) * 100),
          duration_days: Number(days),
          scope,
        } : {}),
        ...(action === 'aceitar' ? { version: data?.request.current_version } : {}),
      }, session);
      await load();
      setPendingAction(null);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Layout>{error ? <ErrorState description={error} onRetry={() => void load()} /> : <LoadingState label="Carregando solicitação..." />}</Layout>;

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
    <Breadcrumbs items={[{ label: 'Painel', to: '/dashboard' }, { label: request.snapshot_title }]} />
    <h1 className="text-2xl font-bold">{request.snapshot_title}</h1>
    <p className="my-2">Estado: <StatusBadge status={request.status} /></p>
    <p>Pedido: {request.need}</p>
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
    <Notice error={error} />
    <h2 className="font-semibold text-xl mt-4">Histórico</h2>
    <ol className="list-decimal pl-5">
      {data.events.map((event, index) => <li key={index}>{event.action.replaceAll('_', ' ')} — {event.to_status.replaceAll('_', ' ')}</li>)}
    </ol>
    <p className="muted mt-4">Após o aceite, não é possível cancelar pelo fluxo comum. Conclusão exige confirmação do cliente.</p>
    <ConfirmationModal
      open={Boolean(pendingAction)}
      title={pendingAction === 'aceitar' ? 'Aceitar esta proposta?' : 'Confirmar ação'}
      description={pendingAction === 'aceitar' ? 'Você confirma a versão vigente e as condições apresentadas nesta proposta.' : `Você deseja ${pendingAction ? (actionLabels[pendingAction] ?? pendingAction).toLowerCase() : 'continuar'}?`}
      confirmLabel={pendingAction ? (actionLabels[pendingAction] ?? 'Confirmar') : 'Confirmar'}
      destructive={pendingAction ? destructiveActions.includes(pendingAction) : false}
      busy={busy}
      onClose={() => setPendingAction(null)}
      onConfirm={() => { if (pendingAction) void act(pendingAction); }}
    />
  </Layout>;
}
