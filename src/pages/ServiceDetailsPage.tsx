import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api, servicePrice, type RequestItem, type Service } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { readableLabel } from '../components/ServiceCard';
import { Alert, Breadcrumbs, Button, Card, ConfirmationModal, ErrorState, Field, Input, LinkButton, LoadingState, StatusBadge, Textarea } from '../components/ui';
import { errorMessage } from '../utils/errors';
import { requestErrorMessage, requestReference } from '../utils/requestUi';

type ServiceDetails = {
  service: Service;
  provider: { user_id: string; display_name: string; about: string; city: string; category: string };
};

export function ServiceDetailsPage() {
  const { id } = useParams();
  const { session, profile } = useApp();
  const navigate = useNavigate();
  const [item, setItem] = useState<ServiceDetails | null>(null);
  const [need, setNeed] = useState('');
  const [date, setDate] = useState('');
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitStatus, setSubmitStatus] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<RequestItem | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setItem(null);
    setLoadError('');
    void api<ServiceDetails>(`/services/${id}`, 'GET', undefined, undefined, controller.signal)
      .then(setItem)
      .catch((requestError) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(requestError));
      });
    return () => controller.abort();
  }, [id, requestKey]);

  function reviewRequest(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      navigate('/login', { state: { from: `/servico/${id}` } });
      return;
    }
    if (profile?.kind !== 'cliente') {
      setSubmitError('Esta conta não tem permissão para enviar solicitações de orçamento.');
      setSubmitStatus(403);
      return;
    }
    if (need.trim().length < 10 || need.trim().length > 2000) {
      setSubmitError('Descreva sua necessidade com 10 a 2.000 caracteres.');
      setSubmitStatus(400);
      return;
    }
    setSubmitError('');
    setSubmitStatus(null);
    setConfirming(true);
  }

  async function request() {
    if (busy || !session || profile?.kind !== 'cliente') return;
    setBusy(true);
    setSubmitError('');
    setSubmitStatus(null);
    try {
      const created = await api<RequestItem>('/requests', 'POST', { service_id: id, need: need.trim(), desired_date: date || null }, session);
      setCreatedRequest(created);
      setConfirming(false);
      setNeed('');
      setDate('');
    } catch (requestError) {
      setSubmitError(requestErrorMessage(requestError, 'create'));
      setSubmitStatus(requestError instanceof ApiError ? requestError.status : null);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return <Layout>
    <Breadcrumbs items={[{ label: 'Serviços', to: '/servicos' }, { label: item?.service.title || 'Detalhes' }]} />
    {loadError && <ErrorState title="Não foi possível carregar o serviço" description="O serviço pode estar indisponível ou sua conexão pode ter sido interrompida." onRetry={() => setRequestKey((current) => current + 1)} />}
    {!item && !loadError && <LoadingState label="Carregando detalhes do serviço..." />}
    {item && <ServiceDetailsContent item={item} profileKind={profile?.kind} sessionActive={Boolean(session)} need={need} date={date} busy={busy} submitError={submitError} submitStatus={submitStatus} createdRequest={createdRequest} onNeedChange={setNeed} onDateChange={setDate} onSubmit={reviewRequest} />}
    <ConfirmationModal
      open={confirming}
      title="Enviar solicitação de orçamento?"
      description="Você está pedindo uma proposta ao prestador. Isso não confirma agendamento, contratação ou pagamento."
      confirmLabel="Enviar solicitação"
      busy={busy}
      onClose={() => setConfirming(false)}
      onConfirm={() => void request()}
    />
  </Layout>;
}

function ServiceDetailsContent({ item, profileKind, sessionActive, need, date, busy, submitError, submitStatus, createdRequest, onNeedChange, onDateChange, onSubmit }: {
  item: ServiceDetails;
  profileKind?: 'cliente' | 'prestador';
  sessionActive: boolean;
  need: string;
  date: string;
  busy: boolean;
  submitError: string;
  submitStatus: number | null;
  createdRequest: RequestItem | null;
  onNeedChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const price = servicePrice(item.service);
  const providerInitial = item.provider.display_name.trim().charAt(0).toLocaleUpperCase('pt-BR') || 'P';
  return <div className="service-details-layout">
    <article className="service-details-main">
      <div className="service-details-tags">
        <span>{readableLabel(item.service.category, 'Sem categoria')}</span>
        <span>{readableLabel(item.service.modality, 'Modalidade não informada')}</span>
      </div>
      <h1>{item.service.title}</h1>
      <p className="service-details-location">{item.service.city || 'Cidade não informada'}</p>
      <p className="service-price service-price--details"><span>{price.label}</span><strong>{price.value}</strong></p>
      <section className="service-description" aria-labelledby="service-description-title">
        <h2 id="service-description-title">Sobre o serviço</h2>
        <p>{item.service.description}</p>
      </section>
      <Card className="provider-summary">
        <div className="provider-avatar" role="img" aria-label="Prestador sem foto disponível"><span aria-hidden="true">{providerInitial}</span></div>
        <div>
          <p className="eyebrow">Prestador</p>
          <h2>{item.provider.display_name}</h2>
          <p>{item.provider.about || 'O prestador ainda não adicionou uma apresentação pública.'}</p>
          <p className="provider-summary__meta">{item.provider.city || 'Cidade não informada'}{item.provider.category ? ` · ${readableLabel(item.provider.category, '')}` : ''}</p>
          <Link to={`/prestador/${item.provider.user_id}`}>Ver perfil e outros serviços</Link>
        </div>
      </Card>
    </article>

    <aside className="request-panel" aria-labelledby="request-title">
      <h2 id="request-title">Solicitar orçamento</h2>
      <p>Descreva sua necessidade para pedir uma proposta. O envio não confirma horário, contratação ou pagamento.</p>
      {profileKind === 'prestador'
        ? <p className="request-panel__notice">Use uma conta de cliente para solicitar um orçamento.</p>
        : !sessionActive
          ? <LinkButton to="/login" state={{ from: `/servico/${item.service.id}` }}>Entrar para solicitar orçamento</LinkButton>
          : createdRequest ? <div className="request-success">
            <Alert variant="success" title="Solicitação enviada">O prestador poderá analisar sua necessidade e preparar uma proposta.</Alert>
            <dl><div><dt>Referência</dt><dd>{requestReference(createdRequest.id)}</dd></div><div><dt>Status</dt><dd><StatusBadge status={createdRequest.status} /></dd></div></dl>
            <LinkButton to={`/pedido/${createdRequest.id}`}>Acompanhar solicitação</LinkButton>
            <Link to="/minhas-solicitacoes">Ver todas as solicitações</Link>
          </div> : <form onSubmit={(event) => void onSubmit(event)}>
            <Field label="Descreva sua necessidade" htmlFor="request-need" required hint="Use de 10 a 2.000 caracteres e não inclua dados médicos ou informações pessoais desnecessárias." error={submitError || undefined}>
              <Textarea id="request-need" required minLength={10} maxLength={2000} value={need} onChange={(event) => onNeedChange(event.target.value)} aria-describedby={`request-need-hint${submitError ? ' request-need-error' : ''}`} />
            </Field>
            <Field label="Data desejada (opcional)" htmlFor="request-date" hint="É apenas uma preferência. O envio não confirma agendamento.">
              <Input id="request-date" type="date" value={date} onChange={(event) => onDateChange(event.target.value)} aria-describedby="request-date-hint" />
            </Field>
            {submitStatus === 401 && <Link to="/login" state={{ from: `/servico/${item.service.id}` }}>Entrar novamente</Link>}
            <Button loading={busy}>Enviar solicitação de orçamento</Button>
          </form>}
    </aside>
  </div>;
}
