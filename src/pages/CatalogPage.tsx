import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, type Service } from '../api';
import { Layout } from '../components/Layout';
import { ServiceCard } from '../components/ServiceCard';
import { Alert, Button, EmptyState, ErrorState, Field, Input, LoadingState, Select } from '../components/ui';
import { errorMessage } from '../utils/errors';

export type CatalogFilters = { category: string; city: string; term: string; searchIn: 'service' | 'provider'; modality: string };
type CatalogResponse = { items: Service[]; next_cursor: string | null };
type Category = { slug: string; label: string };

export const emptyFilters: CatalogFilters = { category: '', city: '', term: '', searchIn: 'service', modality: '' };

export function catalogParams(filters: CatalogFilters, cursor?: string) {
  const params = new URLSearchParams({ limit: '12' });
  if (cursor) params.set('cursor', cursor);
  if (filters.category) params.set('category', filters.category);
  if (filters.city) params.set('city', filters.city);
  if (filters.modality) params.set('modality', filters.modality);
  if (filters.term) {
    params.set('q', filters.term);
    params.set('search_in', filters.searchIn);
  }
  return params;
}

export function mergeUniqueServices(current: Service[], incoming: Service[]) {
  const seen = new Set(current.map((service) => service.id));
  return [...current, ...incoming.filter((service) => {
    if (seen.has(service.id)) return false;
    seen.add(service.id);
    return true;
  })];
}

export function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const [items, setItems] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<CatalogFilters>(emptyFilters);
  const [filters, setFilters] = useState<CatalogFilters>(emptyFilters);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [requestKey, setRequestKey] = useState(0);
  const requestVersion = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    setCategoryError('');
    void api<Category[]>('/categories', 'GET', undefined, undefined, controller.signal)
      .then(setCategories)
      .catch((requestError) => {
        if (!controller.signal.aborted) setCategoryError(errorMessage(requestError));
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;
    setLoading(true);
    setLoadingMore(false);
    setError('');
    setItems([]);
    setCursor(null);
    void api<CatalogResponse>(`/catalog?${catalogParams(filters)}`, 'GET', undefined, undefined, controller.signal)
      .then((response) => {
        if (version === requestVersion.current) {
          setItems(mergeUniqueServices([], response.items));
          setCursor(response.next_cursor);
        }
      })
      .catch((requestError) => {
        if (!controller.signal.aborted && version === requestVersion.current) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, requestKey]);

  async function more() {
    if (!cursor || loadingMore) return;
    const version = requestVersion.current;
    const currentCursor = cursor;
    setLoadingMore(true);
    setError('');
    try {
      const response = await api<CatalogResponse>(`/catalog?${catalogParams(filters, currentCursor)}`);
      if (version === requestVersion.current) {
        setItems((current) => mergeUniqueServices(current, response.items));
        setCursor(response.next_cursor);
      }
    } catch (requestError) {
      if (version === requestVersion.current) setError(errorMessage(requestError));
    } finally {
      if (version === requestVersion.current) setLoadingMore(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setFilters({ ...draft, city: draft.city.trim(), term: draft.term.trim() });
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
    setRequestKey((current) => current + 1);
  }

  return <Layout>
    <header className="catalog-heading">
      <p className="eyebrow">Catálogo público</p>
      <h1>Encontre serviços</h1>
      <p>Busque pelo início do nome de um serviço ou prestador e solicite um orçamento antes de decidir.</p>
    </header>

    <form className="catalog-filters" onSubmit={submit} aria-label="Filtros do catálogo">
      <Field label="Buscar" htmlFor="catalog-term" hint="A busca encontra nomes que começam com o texto digitado.">
        <Input id="catalog-term" value={draft.term} minLength={2} maxLength={60} onChange={(event) => setDraft({ ...draft, term: event.target.value })} placeholder="Ex.: limp" />
      </Field>
      <Field label="Buscar por" htmlFor="catalog-search-in">
        <Select id="catalog-search-in" value={draft.searchIn} onChange={(event) => setDraft({ ...draft, searchIn: event.target.value as CatalogFilters['searchIn'] })}>
          <option value="service">Serviço</option>
          <option value="provider">Prestador</option>
        </Select>
      </Field>
      <Field label="Categoria" htmlFor="catalog-category">
        <Select id="catalog-category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
          <option value="">Todas as categorias</option>
          {categories.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}
        </Select>
      </Field>
      <Field label="Cidade" htmlFor="catalog-city">
        <Input id="catalog-city" value={draft.city} maxLength={100} onChange={(event) => setDraft({ ...draft, city: event.target.value })} placeholder="Ex.: São Paulo" />
      </Field>
      <Field label="Modalidade" htmlFor="catalog-modality">
        <Select id="catalog-modality" value={draft.modality} onChange={(event) => setDraft({ ...draft, modality: event.target.value })}>
          <option value="">Todas as modalidades</option>
          <option value="online">Online</option>
          <option value="presencial">Presencial</option>
        </Select>
      </Field>
      <div className="catalog-filter-actions">
        <Button type="submit" loading={loading}>Buscar</Button>
        <Button type="button" variant="secondary" disabled={loading} onClick={clearFilters}>Limpar filtros</Button>
      </div>
    </form>

    {categoryError && <Alert variant="warning" title="Categorias indisponíveis">Você ainda pode buscar por nome, cidade e modalidade.</Alert>}
    <div className="catalog-results-heading" aria-live="polite">
      <h2>Serviços disponíveis</h2>
      {!loading && !error && <span>{items.length} {items.length === 1 ? 'resultado exibido' : 'resultados exibidos'}</span>}
    </div>
    {error && <ErrorState title="Não foi possível carregar o catálogo" description="Verifique sua conexão e tente novamente." onRetry={() => setRequestKey((current) => current + 1)} />}
    {loading && <LoadingState label="Carregando serviços..." />}
    {!loading && !error && items.length > 0 && <div className="services-grid">
      {items.map((service) => <ServiceCard key={service.id} service={service} />)}
    </div>}
    {!loading && !error && items.length === 0 && <EmptyState title="Nenhum serviço encontrado" description="Tente limpar os filtros ou buscar pelo início de outro nome." action={<Button variant="secondary" onClick={clearFilters}>Limpar filtros</Button>} />}
    {cursor && !loading && <div className="catalog-pagination"><Button variant="secondary" loading={loadingMore} onClick={() => void more()}>Carregar mais serviços</Button></div>}
  </Layout>;
}
