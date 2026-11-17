import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
      <span className="visual-tag">Saúde e Serviços</span>
    </div>
    <div className="hero-visual__card hero-visual__card--proposal">
      <span className="visual-check">✓</span>
      <strong>Escolha sua área</strong>
      <span className="visual-line visual-line--wide" />
      <span className="visual-line" />
    </div>
    <div className="hero-visual__person hero-visual__person--one" />
    <div className="hero-visual__person hero-visual__person--two" />
  </div>;
}

export function HomePage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash === '#como-funciona') {
      document.getElementById('como-funciona')?.scrollIntoView();
    }
  }, [hash]);

  return <Layout>
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">Saúde e serviços gerais</p>
        <h1 id="hero-title">Saúde e Serviços Gerais em uma só aplicação.</h1>
        <p className="hero-subtitle">Escolha a área que combina com sua necessidade. Explore Serviços Gerais ou busque profissionais na área de Saúde.</p>
        <div className="hero-actions">
          <LinkButton to="/servicos">Explorar serviços <span aria-hidden="true">→</span></LinkButton>
          <LinkButton to="/#como-funciona" variant="secondary">Como funciona</LinkButton>
        </div>
        <p className="prototype-note">Este é um protótipo em desenvolvimento. A plataforma não realiza pagamentos.</p>
      </div>
      <MarketplaceIllustration />
    </section>

    <section className="landing-section audience-grid" aria-label="Áreas do Nutri-Med">
      <Card className="audience-card"><h2>Saúde</h2><p>Busque por profissão, especialidade, cidade e modalidade. Registros profissionais são informados pelos próprios prestadores.</p><LinkButton to="/saude">Encontrar profissional</LinkButton></Card>
      <Card className="audience-card"><h2>Serviços Gerais</h2><p>Explore os serviços publicados, consulte as condições e solicite um orçamento.</p><LinkButton to="/servicos">Encontrar serviço</LinkButton></Card>
    </section>
    <section id="como-funciona" className="landing-section how-it-works" aria-labelledby="how-title">
      <div className="section-heading">
        <p className="eyebrow">Como funciona</p>
        <h2 id="how-title">Em Serviços Gerais: do pedido à conclusão</h2>
        <p>Este fluxo é do catálogo de Serviços Gerais. Em Saúde, a descoberta está disponível; não há agendamento ou solicitação de atendimento.</p>
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
        <p className="eyebrow">Clientes e prestadores</p>
        <h2 id="audience-title">Escolha como participar</h2>
      </div>
      <div className="audience-grid">
        <Card className="audience-card audience-card--client">
          <span className="audience-icon" aria-hidden="true">⌕</span>
          <p className="eyebrow">Para clientes</p>
          <h3>Escolha a área de que precisa</h3>
          <p>Em Serviços Gerais, consulte anúncios e peça propostas. Em Saúde, descubra profissionais e consulte seus perfis.</p>
          <LinkButton to="/servicos">Explorar serviços</LinkButton>
        </Card>
        <Card className="audience-card audience-card--provider">
          <span className="audience-icon" aria-hidden="true">＋</span>
          <p className="eyebrow">Para prestadores</p>
          <h3>Apresente seu trabalho e responda pedidos</h3>
          <p>Crie uma conta de prestador para publicar em Serviços Gerais e responder com escopo, prazo e valor. O cadastro de ofertas em Saúde depende da configuração profissional pela API; este formulário atende Serviços Gerais.</p>
          <LinkButton to="/cadastro?tipo=prestador" variant="secondary">Criar conta de prestador</LinkButton>
        </Card>
      </div>
    </section>

    <section className="landing-cta" aria-labelledby="cta-title">
      <div>
        <p className="eyebrow">Catálogo de Serviços Gerais</p>
        <h2 id="cta-title">Explore os serviços publicados</h2>
        <p>Para Serviços Gerais, consulte as opções e condições. Para Saúde, acesse a página informativa acima.</p>
      </div>
      <LinkButton to="/servicos">Explorar agora <span aria-hidden="true">→</span></LinkButton>
    </section>
  </Layout>;
}
