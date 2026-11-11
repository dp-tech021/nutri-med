import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, money, type Service } from '../api';
import { Layout } from '../components/Layout';
import { Button, Card, EmptyState, ErrorState, LoadingState } from '../components/ui';
import { errorMessage } from '../utils/errors';

type Filters = { category: string; city: string; term: string; searchIn: string; modality: string };

function catalogParams(filters: Filters, cursor?: string) {
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

export function CatalogPage() {
  const [categories, setCategories] = useState<{ slug: string; label: string }[]>([]);
  const [items, setItems] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [term, setTerm] = useState('');
  const [searchIn, setSearchIn] = useState('service');
  const [modality, setModality] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({ category: '', city: '', term: '', searchIn: 'service', modality: '' });

  useEffect(() => {
    void api<{ slug: string; label: string }[]>('/categories').then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    void api<{ items: Service[]; next_cursor: string | null }>('/catalog?' + catalogParams(filters))
      .then((response) => {
        if (live) {
          setItems(response.items);
          setCursor(response.next_cursor);
        }
      })
      .catch((requestError) => {
        if (live) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => { live = false; };
  }, [filters]);

  async function more() {
    if (!cursor) return;
    setLoading(true);
    try {
      const response = await api<{ items: Service[]; next_cursor: string | null }>('/catalog?' + catalogParams(filters, cursor));
      setItems((current) => [...current, ...response.items]);
      setCursor(response.next_cursor);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setFilters({ category: category.trim(), city: city.trim(), term: term.trim(), searchIn, modality });
  }

  return <Layout>
    <h1 className="text-3xl font-bold">Encontre serviços</h1>
    <p className="muted my-3">Explore prestadores e solicite orçamentos sem pagar pela plataforma.</p>
    <form className="card grid md:grid-cols-2 gap-3 mb-5" onSubmit={submit}>
      <label className="field">Busca por prefixo<input value={term} maxLength={60} onChange={(event) => setTerm(event.target.value)} placeholder="Ex.: limpeza" /></label>
      <label className="field">Pesquisar em<select value={searchIn} onChange={(event) => setSearchIn(event.target.value)}><option value="service">Serviço</option><option value="provider">Prestador</option></select></label>
      <label className="field">Categoria<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></label>
      <label className="field">Cidade<input value={city} onChange={(event) => setCity(event.target.value)} /></label>
      <label className="field">Modalidade<select value={modality} onChange={(event) => setModality(event.target.value)}><option value="">Todas</option><option value="online">Online</option><option value="presencial">Presencial</option></select></label>
      <div className="self-end"><Button disabled={loading}>Aplicar filtros</Button></div>
    </form>
    {error && <ErrorState description={error} onRetry={() => setFilters({ ...filters })} />}
    {loading && <LoadingState label="Carregando serviços..." />}
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((service) => <Card as="article" key={service.id}>
        <h2 className="text-xl font-semibold">{service.title}</h2>
        <p>{service.provider_name} • {service.category} • {service.city} • {service.modality}</p>
        <p>{service.description.slice(0, 180)}</p>
        <p className="font-semibold my-2">{money(service.price_cents)}</p>
        <Link to={'/servico/' + service.id}>Ver detalhes</Link>
      </Card>)}
    </div>
    {!items.length && !error && !loading && <EmptyState title="Nenhum serviço ativo encontrado" description="Tente remover filtros ou buscar outro termo." />}
    {cursor && <Button variant="secondary" className="my-6" disabled={loading} onClick={() => void more()}>Carregar mais serviços</Button>}
  </Layout>;
}
