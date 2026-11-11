import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, money, type Service, type ServiceModality, type ServicePriceType } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Alert, Breadcrumbs, Button, Card, ErrorState, Field, Input, LoadingState, Select, Textarea } from '../components/ui';
import { formatCentsForInput, parseBrlToCents, serviceRequestError } from '../utils/serviceForm';
import { ProviderNav } from './ProviderPages';

type Category = { slug: string; label: string };
type ServiceForm = {
  title: string;
  description: string;
  category: string;
  city: string;
  modality: ServiceModality;
  priceType: ServicePriceType;
  price: string;
};

const emptyForm: ServiceForm = {
  title: '',
  description: '',
  category: '',
  city: '',
  modality: 'presencial',
  priceType: 'orcamento',
  price: '',
};

function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCategories(await api<Category[]>('/categories'));
    } catch {
      setError('Não foi possível carregar as categorias permitidas.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { categories, loading, error, reload: load };
}

function ServiceFields({ form, setForm, categories, categoriesLoading }: {
  form: ServiceForm;
  setForm: (form: ServiceForm) => void;
  categories: Category[];
  categoriesLoading: boolean;
}) {
  return <>
    <Field label="Título" htmlFor="service-title" required hint="Entre 3 e 120 caracteres.">
      <Input id="service-title" required minLength={3} maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
    </Field>
    <Field label="Descrição" htmlFor="service-description" required hint="Explique o que está incluído, sem inserir dados pessoais ou de saúde.">
      <Textarea id="service-description" required minLength={10} maxLength={2000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
    </Field>
    <Field label="Categoria" htmlFor="service-category" required hint="As opções são fornecidas pela API.">
      <Select id="service-category" required disabled={categoriesLoading} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
        <option value="">{categoriesLoading ? 'Carregando categorias...' : 'Selecione'}</option>
        {categories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}
      </Select>
    </Field>
    <Field label="Cidade" htmlFor="service-city" required hint="Entre 2 e 100 caracteres.">
      <Input id="service-city" required minLength={2} maxLength={100} autoComplete="address-level2" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
    </Field>
    <Field label="Modalidade" htmlFor="service-modality" required>
      <Select id="service-modality" value={form.modality} onChange={(event) => setForm({ ...form, modality: event.target.value as ServiceModality })}>
        <option value="presencial">Presencial</option>
        <option value="online">Online</option>
      </Select>
    </Field>
    <Field label="Tipo de preço" htmlFor="service-price-type" required>
      <Select id="service-price-type" value={form.priceType} onChange={(event) => {
        const priceType = event.target.value as ServicePriceType;
        setForm({ ...form, priceType, price: priceType === 'orcamento' ? '' : form.price });
      }}>
        <option value="orcamento">Sob orçamento</option>
        <option value="fixo">Preço fixo</option>
        <option value="inicial">A partir de</option>
      </Select>
    </Field>
    {form.priceType !== 'orcamento' && <Field label="Valor em R$" htmlFor="service-price" required hint="Use até duas casas decimais, por exemplo 150,00.">
      <Input id="service-price" required inputMode="decimal" autoComplete="off" placeholder="0,00" pattern="[0-9]+([,.][0-9]{1,2})?" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
    </Field>}
    <Field label="Imagens" htmlFor="service-images" hint="Imagens indisponíveis no protótipo. O endpoint permanece bloqueado até a validação do backend.">
      <Input id="service-images" type="file" accept="image/jpeg,image/png,image/webp" disabled aria-disabled="true" />
    </Field>
  </>;
}

function ServiceReview({ form, categoryLabel, busy, submitLabel, onBack, onSave }: {
  form: ServiceForm;
  categoryLabel: string;
  busy: boolean;
  submitLabel: string;
  onBack: () => void;
  onSave: () => void;
}) {
  const cents = form.priceType === 'orcamento' ? null : parseBrlToCents(form.price);
  const pricePrefix = form.priceType === 'inicial' ? 'A partir de ' : '';
  return <Card className="service-review" as="section">
    <p className="eyebrow">Revisão antes de salvar</p>
    <h2>{form.title.trim()}</h2>
    <dl className="service-summary">
      <div><dt>Categoria</dt><dd>{categoryLabel}</dd></div>
      <div><dt>Local e modalidade</dt><dd>{form.city.trim()} · {form.modality === 'online' ? 'Online' : 'Presencial'}</dd></div>
      <div><dt>Preço</dt><dd>{pricePrefix}{money(cents)}</dd></div>
      <div className="service-summary__description"><dt>Descrição</dt><dd>{form.description.trim()}</dd></div>
    </dl>
    <Alert variant="info" title="Pedidos anteriores são preservados">Alterações neste anúncio não modificam propostas ou contratos já registrados.</Alert>
    <div className="service-form-actions">
      <Button type="button" variant="secondary" disabled={busy} onClick={onBack}>Voltar e editar</Button>
      <Button type="button" loading={busy} onClick={onSave}>{busy ? 'Salvando...' : submitLabel}</Button>
    </div>
  </Card>;
}

function ServiceFormPage({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams();
  const { session } = useApp();
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading, error: categoriesError, reload } = useCategories();
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [loading, setLoading] = useState(mode === 'edit');
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !session) return;
    let active = true;
    void api<Service[]>('/my/services', 'GET', undefined, session)
      .then((services) => {
        if (!active) return;
        const service = services.find((item) => item.id === id);
        if (!service) {
          setError('Anúncio não encontrado ou indisponível para esta conta.');
          return;
        }
        setForm({
          title: service.title,
          description: service.description,
          category: service.category,
          city: service.city,
          modality: service.modality,
          priceType: service.price_type,
          price: formatCentsForInput(service.price_cents),
        });
      })
      .catch((requestError) => setError(serviceRequestError(requestError)))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, mode, session]);

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (form.title.trim().length < 3 || form.description.trim().length < 10 || form.city.trim().length < 2) {
      setError('Revise título, descrição e cidade. Espaços no início ou no fim não contam para os limites.');
      return;
    }
    if (form.priceType !== 'orcamento' && parseBrlToCents(form.price) == null) {
      setError('Informe um valor válido de até R$ 1.000.000,00, com no máximo duas casas decimais.');
      return;
    }
    setReviewing(true);
    window.scrollTo({ top: 0 });
  }

  async function save() {
    if (busy) return;
    const priceCents = form.priceType === 'orcamento' ? null : parseBrlToCents(form.price);
    if (form.priceType !== 'orcamento' && priceCents == null) return;
    setBusy(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        city: form.city.trim(),
        modality: form.modality,
        price_type: form.priceType,
        price_cents: priceCents,
      };
      await api(mode === 'new' ? '/services' : `/services/${id}`, mode === 'new' ? 'POST' : 'PATCH', payload, session);
      navigate('/meus-servicos');
    } catch (submitError) {
      setError(serviceRequestError(submitError));
      setReviewing(false);
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'new' ? 'Novo serviço' : 'Editar serviço';
  if (loading) return <Layout><LoadingState label="Carregando anúncio..." /></Layout>;
  if (mode === 'edit' && error && !form.title) return <Layout><ErrorState description={error} onRetry={() => navigate('/meus-servicos')} /></Layout>;

  return <Layout>
    <Breadcrumbs items={[{ label: 'Painel', to: '/dashboard' }, { label: 'Meus serviços', to: '/meus-servicos' }, { label: title }]} />
    <div className="provider-page-heading">
      <div><p className="eyebrow">Painel do prestador</p><h1>{title}</h1></div>
      {!reviewing && <Button type="button" variant="secondary" onClick={() => navigate('/meus-servicos')}>Cancelar</Button>}
    </div>
    <ProviderNav />
    {categoriesError && <ErrorState description={categoriesError} onRetry={() => void reload()} />}
    {error && <Alert variant="error" title="Não foi possível continuar">{error}</Alert>}
    {reviewing ? <ServiceReview
      form={form}
      categoryLabel={categories.find((category) => category.slug === form.category)?.label ?? form.category}
      busy={busy}
      submitLabel={mode === 'new' ? 'Publicar serviço' : 'Salvar alterações'}
      onBack={() => setReviewing(false)}
      onSave={() => void save()}
    /> : <form className="ui-card service-form" onSubmit={review}>
      <ServiceFields form={form} setForm={setForm} categories={categories} categoriesLoading={categoriesLoading} />
      <p className="muted">A publicação depende da autorização da API. A interface não concede acesso de prestador.</p>
      <div className="service-form-actions">
        <Button type="button" variant="secondary" onClick={() => navigate('/meus-servicos')}>Cancelar</Button>
        <Button type="submit" disabled={categoriesLoading || Boolean(categoriesError)}>Revisar anúncio</Button>
      </div>
    </form>}
  </Layout>;
}

export function NewServicePage() {
  return <ServiceFormPage mode="new" />;
}

export function EditServicePage() {
  return <ServiceFormPage mode="edit" />;
}
