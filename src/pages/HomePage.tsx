import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Service } from '../api';
import { Layout } from '../components/Layout';
import { ServiceCard } from '../components/ServiceCard';
import { Card, EmptyState, ErrorState, LinkButton, LoadingState } from '../components/ui';

type Category = { slug: string; label: string };

const steps = [
  { number: '01', icon: '⌕', title: 'Encontre serviços', description: 'Explore o catálogo e confira as informações publicadas.' },
  { number: '02', icon: '≡', title: 'Solicite um orçamento', description: 'Explique o que precisa para o prestador preparar uma proposta.' },
  { number: '03', icon: '✓', title: 'Analise a proposta', description: 'Confira escopo, prazo e valor antes de decidir.' },
];

function MarketplaceIllustration() {
  return <div className="marketplace-mockup" role="img" aria-label="Exemplo ilustrativo de um serviço e uma proposta no marketplace">
    <p className="mockup-label">Demonstração visual</p>
    <div className="mockup-service-card">
      <div className="mockup-card-heading"><span className="mockup-icon" aria-hidden="true">⌂</span><div><small>Serviço de exemplo</small><strong>Organização de ambientes</strong></div></div>
      <p>Descrição ilustrativa de uma atividade oferecida no marketplace.</p>
      <div className="mockup-meta"><span>Categoria ilustrativa</span><span>Presencial</span></div>
      <p className="mockup-price"><small>Valor demonstrativo</small><strong>R$ 150,00</strong></p>
    </div>
    <div className="mockup-proposal-card">
      <div><small>Exemplo ilustrativo</small><strong>Proposta recebida</strong></div>
      <dl><div><dt>Valor</dt><dd>R$ 180,00</dd></div><div><dt>Prazo</dt><dd>3 dias</dd></div></dl>
      <span className="mockup-status">Aguardando análise</span>
    </div>
  </div>;
}

function CatalogPreview() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const load = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    void api<{ items: Service[] }>('/catalog?limit=3')
      .then((response) => { if (live) setItems(response.items.slice(0, 3)); })
      .catch(() => { if (live) setError('A prévia do catálogo está indisponível agora. Você ainda pode abrir o catálogo completo e tentar novamente.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [attempt]);

  return <section className="landing-section catalog-preview" aria-labelledby="catalog-preview-title">
    <div className="section-heading section-heading--with-action">
      <div><p className="eyebrow">Catálogo</p><h2 id="catalog-preview-title">Explore serviços disponíveis</h2><p>Conheça opções publicadas no marketplace para diferentes necessidades.</p></div>
      <LinkButton to="/servicos" variant="secondary">Ver catálogo completo</LinkButton>
    </div>
    {loading ? <LoadingState label="Carregando prévia do catálogo..." />
      : error ? <ErrorState title="Prévia temporariamente indisponível" description={error} onRetry={load} />
        : items.length ? <div className="services-grid services-grid--preview">{items.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
          : <EmptyState title="Nenhum serviço disponível nesta prévia" description="Novos anúncios aparecerão aqui quando forem publicados e ativados." action={<LinkButton to="/servicos" variant="secondary">Abrir catálogo</LinkButton>} />}
  </section>;
}

function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    void api<Category[]>('/categories')
      .then((response) => { if (live) setCategories(response); })
      .catch(() => { if (live) setError(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  return <section className="landing-section categories-section" aria-labelledby="categories-title">
    <div className="section-heading"><p className="eyebrow">Descoberta</p><h2 id="categories-title">Explore por categoria</h2><p>As categorias abaixo são fornecidas pelo catálogo da plataforma.</p></div>
    {loading ? <LoadingState label="Carregando categorias..." />
      : error ? <p className="categories-note">Não foi possível carregar as categorias agora. Use o catálogo completo para explorar os serviços.</p>
        : categories.length ? <div className="category-links">{categories.map((category) => <Link key={category.slug} to={`/servicos?category=${encodeURIComponent(category.slug)}`}><span aria-hidden="true">→</span>{category.label}</Link>)}</div>
          : <p className="categories-note">As categorias aparecerão aqui quando estiverem disponíveis no catálogo.</p>}
  </section>;
}

export function HomePage() {
  useEffect(() => {
    if (window.location.hash === '#como-funciona') document.getElementById('como-funciona')?.scrollIntoView();
  }, []);

  return <Layout>
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">Marketplace de serviços</p>
        <h1 id="hero-title">Encontre o serviço certo para o que você precisa</h1>
        <p className="hero-subtitle">Explore serviços, solicite orçamentos e compare propostas antes de contratar.</p>
        <div className="hero-actions">
          <LinkButton to="/servicos">Encontrar serviços <span aria-hidden="true">→</span></LinkButton>
          <LinkButton to="/cadastro?tipo=prestador" variant="secondary">Quero oferecer meus serviços</LinkButton>
        </div>
        <a className="hero-anchor-link" href="#como-funciona">Entenda como funciona</a>
        <p className="prototype-note">Protótipo em desenvolvimento. A plataforma não realiza pagamentos.</p>
      </div>
      <MarketplaceIllustration />
    </section>

    <section id="como-funciona" className="landing-section how-it-works" aria-labelledby="how-title">
      <div className="section-heading"><p className="eyebrow">Como funciona</p><h2 id="how-title">Do pedido à proposta em três passos</h2><p>Você confere as condições antes de tomar uma decisão.</p></div>
      <ol className="steps-grid">{steps.map((step) => <li key={step.number}><span className="step-icon" aria-hidden="true">{step.icon}</span><span className="step-number" aria-hidden="true">{step.number}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol>
    </section>

    <CatalogPreview />
    <CategoriesSection />

    <section className="landing-section audience-section" aria-labelledby="audience-title">
      <div className="section-heading"><p className="eyebrow">Uma plataforma, dois caminhos</p><h2 id="audience-title">Escolha como participar</h2></div>
      <div className="audience-grid">
        <Card className="audience-card audience-card--client"><span className="audience-icon" aria-hidden="true">⌕</span><div className="audience-card__copy"><p className="eyebrow">Para clientes</p><h3>Encontre o serviço que precisa</h3><p>Explore opções, explique sua necessidade e analise as condições recebidas antes de decidir.</p></div><LinkButton to="/servicos">Encontrar serviços</LinkButton></Card>
        <Card className="audience-card audience-card--provider"><span className="audience-icon" aria-hidden="true">＋</span><div className="audience-card__copy"><p className="eyebrow">Para prestadores</p><h3>Divulgue seus serviços</h3><p>Crie uma conta de prestador, publique suas atividades e responda solicitações com propostas.</p></div><LinkButton to="/cadastro?tipo=prestador" variant="secondary">Anunciar meus serviços</LinkButton></Card>
      </div>
    </section>

    <section className="landing-cta" aria-labelledby="cta-title"><div><p className="eyebrow">Comece pelo catálogo</p><h2 id="cta-title">Veja o que está disponível</h2><p>Explore os anúncios ativos e encontre um ponto de partida para sua solicitação.</p></div><LinkButton to="/servicos">Conhecer os serviços <span aria-hidden="true">→</span></LinkButton></section>
  </Layout>;
}
