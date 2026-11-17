import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, type ServiceModality } from '../api';
import { useApp } from '../app/AppContext';
import { HealthRequestNotice } from '../components/HealthRequestNotice';
import { Layout } from '../components/Layout';
import { Alert, Button, Card, EmptyState, ErrorState, Field, LoadingState, Select } from '../components/ui';
import type { Profile } from '../types';

type Offer = { id: string; title: string; domain: 'health'; modality: ServiceModality; active: boolean };
type Taxonomy = { professions: {slug: string; label: string}[]; specialties: {profession: string; slug: string; label: string}[] };

export function HealthDashboardPage() {
  const { session } = useApp();
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [profession, setProfession] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const writeLock = useRef(false);
  const restoreFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!busy && restoreFocus.current) {
      if (document.activeElement === document.body && restoreFocus.current.isConnected) restoreFocus.current.focus();
      restoreFocus.current = null;
    }
  }, [busy]);

  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    writeLock.current = false; setBusy(false);
    setLoading(true); setError(''); setNotice(''); setTaxonomy(null); setOffers([]);
    void Promise.all([
      api<Profile>('/me', 'GET', undefined, session, abort.signal),
      api<Taxonomy>('/health-taxonomy', 'GET', undefined, undefined, abort.signal),
      api<Offer[]>('/my/services', 'GET', undefined, session, abort.signal),
    ]).then(([current, categories, items]) => {
      if (abort.signal.aborted) return;
      if (current.kind !== 'prestador' || current.domain !== 'health' || items.some(item => item.domain !== 'health')) {
        throw new Error('DOMAIN_MISMATCH');
      }
      setProfession(current.profession); setSpecialty(current.specialty);
      setTaxonomy(categories); setOffers(items);
    }).catch(() => {
      if (!abort.signal.aborted) setError('Não foi possível carregar o painel de Saúde. Tente novamente.');
    }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [session, attempt]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (writeLock.current || !session) return;
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    writeLock.current = true; setBusy(true); setError(''); setNotice('');
    const signal = controller.current?.signal;
    try {
      await api('/me', 'PATCH', { profession, specialty }, session, signal);
      if (!signal?.aborted) setNotice('Perfil profissional atualizado. Registro informado não equivale a verificação oficial.');
    } catch {
      if (!signal?.aborted) setError('Não foi possível salvar o perfil. Confira a profissão e a especialidade e tente novamente.');
    } finally {
      if (controller.current?.signal === signal) writeLock.current = false;
      if (!signal?.aborted) {
        setBusy(false);
      }
    }
  }

  async function saveModality(offer: Offer, modality: ServiceModality) {
    if (writeLock.current || !session || modality === offer.modality) return;
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    writeLock.current = true; setBusy(true); setError(''); setNotice('');
    const signal = controller.current?.signal;
    try {
      await api(`/services/${offer.id}`, 'PATCH', { modality }, session, signal);
      if (!signal?.aborted) {
        setOffers(current => current.map(item => item.id === offer.id ? {...item, modality} : item));
        setNotice(`Modalidade de ${offer.title} atualizada.`);
      }
    } catch {
      if (!signal?.aborted) setError('Não foi possível alterar a modalidade. Nenhuma alteração foi confirmada; tente novamente.');
    } finally {
      if (controller.current?.signal === signal) writeLock.current = false;
      if (!signal?.aborted) {
        setBusy(false);
      }
    }
  }

  return <Layout>
    <header className="provider-page-heading"><div><p className="eyebrow">Área profissional</p><h1>Painel de Saúde</h1></div>
      <Link to={`/prestador/${session?.user.id}`}>Ver perfil público</Link>
    </header>
    <HealthRequestNotice />
    {error && <ErrorState description={error} onRetry={taxonomy ? undefined : () => setAttempt(n => n + 1)} />}
    {notice && <Alert variant="success" title="Alteração salva">{notice}</Alert>}
    {loading ? <LoadingState label="Carregando painel de Saúde..." /> : taxonomy && <>
      <Card>
        <h2>Perfil profissional</h2>
        <p>Atualize apenas informações profissionais públicas. Não inclua dados de pacientes. Não há verificação oficial de registro nesta etapa.</p>
        <form onSubmit={event => void saveProfile(event)}>
          <Field label="Profissão" htmlFor="health-profession" required><Select id="health-profession" required disabled={busy} value={profession} onChange={event => {setProfession(event.target.value); setSpecialty('');}}>
            <option value="">Selecione a profissão</option>{taxonomy.professions.map(item => <option key={item.slug} value={item.slug}>{item.label}</option>)}
          </Select></Field>
          <Field label="Especialidade" htmlFor="health-specialty" required><Select id="health-specialty" required disabled={busy} value={specialty} onChange={event => setSpecialty(event.target.value)}>
            <option value="">Selecione a especialidade</option>{taxonomy.specialties.filter(item => item.profession === profession).map(item => <option key={item.slug} value={item.slug}>{item.label}</option>)}
          </Select></Field>
          <Button loading={busy} disabled={!profession || !specialty}>Salvar perfil profissional</Button>
        </form>
      </Card>
      <section aria-labelledby="health-offers-title">
        <h2 id="health-offers-title">Modalidades das ofertas</h2>
        <p>A modalidade descreve como a oferta é apresentada no catálogo. Alterá-la não cria agenda, proposta ou contratação.</p>
        {!offers.length ? <EmptyState title="Nenhuma oferta de Saúde cadastrada" description="O cadastro inicial de ofertas de Saúde ainda não está disponível neste painel." /> : offers.map(offer => <Card key={offer.id} as="article">
          <h3>{offer.title}</h3><p>{offer.active ? 'Oferta ativa' : 'Oferta inativa'}</p>
          <Field label={`Modalidade de ${offer.title}`} htmlFor={`modality-${offer.id}`}><Select id={`modality-${offer.id}`} disabled={busy} value={offer.modality} onChange={event => void saveModality(offer, event.target.value as ServiceModality)}>
            <option value="online">Online</option><option value="presencial">Presencial</option>
          </Select></Field>
        </Card>)}
      </section>
    </>}
  </Layout>;
}
