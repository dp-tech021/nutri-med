import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Service } from '../api';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { Notice } from '../components/Notice';
import { errorMessage } from '../utils/errors';

type Category = { slug: string; label: string };

function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    void api<Category[]>('/categories').then(setCategories).catch(() => undefined);
  }, []);
  return categories;
}

export function NewServicePage() {
  const categories = useCategories();
  const { session } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    city: '',
    modality: 'presencial',
    price_type: 'orcamento',
    price_cents: '',
  });
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api('/services', 'POST', {
        ...form,
        price_cents: form.price_type === 'orcamento' ? null : Math.round(Number(form.price_cents) * 100),
      }, session);
      navigate('/dashboard');
    } catch (submitError) {
      setError(errorMessage(submitError));
    }
  }

  const textFields = ['title', 'description', 'city'] as const;
  const labels = { title: 'Título', description: 'Descrição', city: 'Cidade' };

  return <Layout>
    <h1 className="text-2xl font-bold">Publicar serviço</h1>
    <form className="card max-w-xl mt-4" onSubmit={(event) => void submit(event)}>
      {textFields.map((key) => <label key={key} className="field">{labels[key]}
        <input required minLength={key === 'description' ? 10 : 2} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
      </label>)}
      <label className="field">Categoria
        <select value={form.category} required onChange={(event) => setForm({ ...form, category: event.target.value })}>
          <option value="">Selecione</option>
          {categories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}
        </select>
      </label>
      <label className="field">Modalidade
        <select value={form.modality} onChange={(event) => setForm({ ...form, modality: event.target.value })}>
          <option value="presencial">Presencial</option><option value="online">Online</option>
        </select>
      </label>
      <label className="field">Preço
        <select value={form.price_type} onChange={(event) => setForm({ ...form, price_type: event.target.value })}>
          <option value="orcamento">Sob orçamento</option><option value="fixo">Fixo</option><option value="inicial">A partir de</option>
        </select>
      </label>
      {form.price_type !== 'orcamento' && <label className="field">Valor (R$)
        <input required type="number" min="0" max="1000000" step=".01" value={form.price_cents} onChange={(event) => setForm({ ...form, price_cents: event.target.value })} />
      </label>}
      <button className="btn">Publicar</button>
      <Notice error={error} />
    </form>
  </Layout>;
}

export function EditServicePage() {
  const { id } = useParams();
  const { session } = useApp();
  const navigate = useNavigate();
  const [item, setItem] = useState<Service | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    void api<Service[]>('/my/services', 'GET', undefined, session)
      .then((items) => {
        const chosen = items.find((service) => service.id === id);
        if (chosen) setItem(chosen);
        else setError('Serviço não encontrado ou sem autorização');
      })
      .catch((requestError) => setError(errorMessage(requestError)));
  }, [session, id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!item) return;
    setBusy(true);
    setError('');
    try {
      await api('/services/' + id, 'PATCH', {
        title: item.title,
        description: item.description,
        city: item.city,
        category: item.category,
        modality: item.modality,
        price_type: item.price_type,
        price_cents: item.price_type === 'orcamento' ? null : item.price_cents,
        active: item.active ?? true,
      }, session);
      navigate('/dashboard');
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  if (!item) return <Layout><Notice error={error || 'Carregando serviço...'} /></Layout>;

  return <Layout>
    <h1 className="text-2xl font-bold">Editar anúncio</h1>
    <p className="my-3 muted">Mudanças não alteram pedidos anteriores nem propostas aceitas.</p>
    <form className="card max-w-xl" onSubmit={(event) => void submit(event)}>
      <label className="field">Título<input required minLength={3} maxLength={120} value={item.title} onChange={(event) => setItem({ ...item, title: event.target.value })} /></label>
      <label className="field">Descrição<textarea required minLength={10} maxLength={2000} value={item.description} onChange={(event) => setItem({ ...item, description: event.target.value })} /></label>
      <label className="field">Cidade<input required minLength={2} value={item.city} onChange={(event) => setItem({ ...item, city: event.target.value })} /></label>
      <label className="field">Modalidade<select value={item.modality} onChange={(event) => setItem({ ...item, modality: event.target.value })}><option value="presencial">Presencial</option><option value="online">Online</option></select></label>
      <label className="field">Preço<select value={item.price_type} onChange={(event) => setItem({ ...item, price_type: event.target.value, price_cents: event.target.value === 'orcamento' ? null : item.price_cents ?? 0 })}><option value="orcamento">Sob orçamento</option><option value="fixo">Fixo</option><option value="inicial">A partir de</option></select></label>
      {item.price_type !== 'orcamento' && <label className="field">Valor em centavos (BRL)<input type="number" min="0" max="100000000" step="1" required value={item.price_cents ?? ''} onChange={(event) => setItem({ ...item, price_cents: Number(event.target.value) })} /></label>}
      <label className="field">Status<select value={item.active ? 'ativo' : 'inativo'} onChange={(event) => setItem({ ...item, active: event.target.value === 'ativo' })}><option value="ativo">Ativo</option><option value="inativo">Desativado</option></select></label>
      <button className="btn" disabled={busy}>Salvar alterações</button>
      <Notice error={error} />
    </form>
  </Layout>;
}
