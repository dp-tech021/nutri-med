import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, servicePrice, type Service } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { readableLabel } from '../components/ServiceCard';
import { Breadcrumbs, Button, Card, ErrorState, Field, Input, LinkButton, LoadingState, Textarea } from '../components/ui';
import { errorMessage } from '../utils/errors';

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
  const [busy, setBusy] = useState(false);
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

  async function request(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      navigate('/login', { state: { from: `/servico/${id}` } });
      return;
    }
    setBusy(true);
    setSubmitError('');
    try {
      await api('/requests', 'POST', { service_id: id, need, desired_date: date || null }, session);
      navigate('/dashboard');
    } catch (requestError) {
      setSubmitError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return <Layout>
    <Breadcrumbs items={[{ label: 'Serviços', to: '/servicos' }, { label: item?.service.title || 'Detalhes' }]} />
    {loadError && <ErrorState title="Não foi possível carregar o serviço" description="O serviço pode estar indisponível ou sua conexão pode ter sido interrompida." onRetry={() => setRequestKey((current) => current + 1)} />}
    {!item && !loadError && <LoadingState label="Carregando detalhes do serviço..." />}
    {item && <ServiceDetailsContent item={item} profileKind={profile?.kind} sessionActive={Boolean(session)} need={need} date={date} busy={busy} submitError={submitError} onNeedChange={setNeed} onDateChange={setDate} onSubmit={request} />}
  </Layout>;
}

function ServiceDetailsContent({ item, profileKind, sessionActive, need, date, busy, submitError, onNeedChange, onDateChange, onSubmit }: {
  item: ServiceDetails;
  profileKind?: 'cliente' | 'prestador';
  sessionActive: boolean;
  need: string;
  date: string;
  busy: boolean;
  submitError: string;
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
      <p>Descreva sua necessidade. O envio do pedido ainda não cria um contrato nem realiza pagamento.</p>
      {profileKind === 'prestador'
        ? <p className="request-panel__notice">Use uma conta de cliente para solicitar um orçamento.</p>
        : !sessionActive
          ? <LinkButton to="/login" state={{ from: `/servico/${item.service.id}` }}>Entrar para solicitar orçamento</LinkButton>
          : <form onSubmit={(event) => void onSubmit(event)}>
            <Field label="Descreva sua necessidade" htmlFor="request-need" required error={submitError || undefined}>
              <Textarea id="request-need" required minLength={10} maxLength={2000} value={need} onChange={(event) => onNeedChange(event.target.value)} aria-describedby={submitError ? 'request-need-error' : undefined} />
            </Field>
            <Field label="Data desejada (opcional)" htmlFor="request-date">
              <Input id="request-date" type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />
            </Field>
            <Button loading={busy}>Enviar solicitação</Button>
          </form>}
    </aside>
  </div>;
}
