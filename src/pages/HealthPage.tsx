import { Layout } from '../components/Layout';
import { Card, LinkButton } from '../components/ui';

export function HealthPage() {
  return <Layout>
    <section aria-labelledby="health-title">
      <p className="eyebrow">Uma aplicação, duas áreas</p>
      <h1 id="health-title">Saúde</h1>
      <Card>
        <h2>Catálogo de Saúde em preparação</h2>
        <p>Esta área é distinta de Serviços Gerais e compartilha a mesma conta do Nutri-Med. Ainda não é possível buscar profissionais, agendar ou solicitar atendimento de saúde por aqui.</p>
        <p>Categorias, regiões de atuação, critérios de participação e verificação profissional ainda precisam ser definidos. Não há profissionais listados ou verificados nesta página.</p>
        <p>Não envie sintomas, exames ou informações clínicas. O Nutri-Med não oferece atendimento de urgência.</p>
        <LinkButton to="/servicos">Conhecer Serviços Gerais</LinkButton>
      </Card>
    </section>
  </Layout>;
}
