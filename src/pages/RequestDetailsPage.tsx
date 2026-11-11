import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, money, type Proposal, type RequestItem } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Notice } from '../components/Notice';
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
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Layout><Notice error={error || 'Carregando solicitação...'} /></Layout>;

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

  return <Layout>
    <h1 className="text-2xl font-bold">{request.snapshot_title}</h1>
    <p className="my-2">Estado: <strong>{request.status.replaceAll('_', ' ')}</strong></p>
    <p>Pedido: {request.need}</p>
    {lastProposal && <section className="card my-4">
      <h2 className="font-semibold">Proposta vigente — versão {lastProposal.version}</h2>
      <p>Valor: {money(lastProposal.price_cents)} • Prazo: {lastProposal.duration_days} dias</p>
      <p>{lastProposal.scope}</p>
    </section>}
    {actions.some((action) => ['enviar_proposta', 'revisar_proposta'].includes(action)) && <div className="card my-3">
      <label className="field">Valor proposto em R$<input type="number" min="0" step=".01" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
      <label className="field">Prazo (dias)<input type="number" min="1" max="365" value={days} onChange={(event) => setDays(event.target.value)} /></label>
      <label className="field">Escopo da proposta<textarea minLength={10} maxLength={2000} value={scope} onChange={(event) => setScope(event.target.value)} /></label>
    </div>}
    <div className="flex flex-wrap gap-2 my-4">
      {actions.map((action) => <button className="btn" disabled={busy} key={action} onClick={() => {
        const message = action === 'aceitar'
          ? 'Você confirma a versão e as condições da proposta?'
          : 'Confirmar ação: ' + action + '?';
        if (window.confirm(message)) void act(action);
      }}>{action.replaceAll('_', ' ')}</button>)}
    </div>
    <Notice error={error} />
    <h2 className="font-semibold text-xl mt-4">Histórico</h2>
    <ol className="list-decimal pl-5">
      {data.events.map((event, index) => <li key={index}>{event.action.replaceAll('_', ' ')} — {event.to_status.replaceAll('_', ' ')}</li>)}
    </ol>
    <p className="muted mt-4">Após o aceite, não é possível cancelar pelo fluxo comum. Conclusão exige confirmação do cliente.</p>
  </Layout>;
}
