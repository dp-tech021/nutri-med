import { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card, LinkButton } from '../components/ui';

const steps = [
  {
    number: '01',
    title: 'Encontre um serviço',
    description: 'Explore o catálogo e compare as informações publicadas pelos prestadores.',
  },
  {
    number: '02',
    title: 'Solicite um orçamento',
    description: 'Descreva o que precisa para que o prestador possa preparar uma proposta.',
  },
  {
    number: '03',
    title: 'Analise a proposta',
    description: 'Confira escopo, prazo e valor antes de aceitar. Depois, acompanhe a execução e confirme a conclusão.',
  },
];

function MarketplaceIllustration() {
  return <div className="hero-visual" aria-hidden="true">
    <div className="hero-visual__glow" />
    <div className="hero-visual__card hero-visual__card--primary">
      <span className="visual-icon">⌕</span>
      <span className="visual-line visual-line--wide" />
      <span className="visual-line" />
      <span className="visual-tag">Serviço</span>
    </div>
    <div className="hero-visual__card hero-visual__card--proposal">
      <span className="visual-check">✓</span>
      <strong>Proposta recebida</strong>
      <span className="visual-line visual-line--wide" />
      <span className="visual-line" />
    </div>
    <div className="hero-visual__person hero-visual__person--one" />
    <div className="hero-visual__person hero-visual__person--two" />
  </div>;
}

export function HomePage() {
  useEffect(() => {
    if (window.location.hash === '#como-funciona') {
      document.getElementById('como-funciona')?.scrollIntoView();
    }
  }, []);

  return <Layout>
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">Serviços e orçamentos em um só lugar</p>
        <h1 id="hero-title">Encontre quem pode ajudar no seu próximo serviço</h1>
        <p className="hero-subtitle">A Nutri-Med conecta clientes e prestadores para descobrir serviços, solicitar orçamentos e analisar propostas com clareza.</p>
        <div className="hero-actions">
          <LinkButton to="/servicos">Explorar serviços <span aria-hidden="true">→</span></LinkButton>
          <LinkButton to="/#como-funciona" variant="secondary">Como funciona</LinkButton>
        </div>
        <p className="prototype-note">Este é um protótipo em desenvolvimento. A plataforma não realiza pagamentos.</p>
      </div>
      <MarketplaceIllustration />
    </section>

    <section id="como-funciona" className="landing-section how-it-works" aria-labelledby="how-title">
      <div className="section-heading">
        <p className="eyebrow">Como funciona</p>
        <h2 id="how-title">Do pedido à conclusão, passo a passo</h2>
        <p>Você mantém o controle da decisão antes de aceitar uma proposta.</p>
      </div>
      <ol className="steps-grid">
        {steps.map((step) => <li key={step.number}>
          <span className="step-number" aria-hidden="true">{step.number}</span>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </li>)}
      </ol>
    </section>

    <section className="landing-section audience-section" aria-labelledby="audience-title">
      <div className="section-heading">
        <p className="eyebrow">Uma plataforma, dois caminhos</p>
        <h2 id="audience-title">Escolha como participar</h2>
      </div>
      <div className="audience-grid">
        <Card className="audience-card audience-card--client">
          <span className="audience-icon" aria-hidden="true">⌕</span>
          <p className="eyebrow">Para clientes</p>
          <h3>Encontre serviços e peça propostas</h3>
          <p>Explore opções, explique sua necessidade e analise as condições recebidas antes de decidir.</p>
          <LinkButton to="/servicos">Explorar serviços</LinkButton>
        </Card>
        <Card className="audience-card audience-card--provider">
          <span className="audience-icon" aria-hidden="true">＋</span>
          <p className="eyebrow">Para prestadores</p>
          <h3>Apresente seu trabalho e responda pedidos</h3>
          <p>Crie uma conta de prestador, publique serviços e envie propostas com escopo, prazo e valor.</p>
          <LinkButton to="/cadastro" variant="secondary">Criar conta de prestador</LinkButton>
        </Card>
      </div>
    </section>

    <section className="landing-cta" aria-labelledby="cta-title">
      <div>
        <p className="eyebrow">Comece pelo catálogo</p>
        <h2 id="cta-title">Veja os serviços disponíveis</h2>
        <p>Conheça as opções publicadas e encontre um ponto de partida para sua solicitação.</p>
      </div>
      <LinkButton to="/servicos">Explorar agora <span aria-hidden="true">→</span></LinkButton>
    </section>
  </Layout>;
}
