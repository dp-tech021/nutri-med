import { useState } from 'react';
import { Layout } from '../components/Layout';
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  ConfirmationModal,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LinkButton,
  LoadingState,
  Select,
  StatusBadge,
  Textarea,
} from '../components/ui';

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return <Layout>
    <Breadcrumbs items={[{ label: 'Catálogo', to: '/' }, { label: 'Componentes de desenvolvimento' }]} />
    <Alert variant="warning" title="Somente desenvolvimento">Esta página reúne dados sintéticos e não existe no build de produção.</Alert>
    <h1>Sistema visual Nutri-Med</h1>
    <p className="muted">Vitrine para validar componentes, estados, teclado e responsividade.</p>

    <section className="my-8" aria-labelledby="buttons-title">
      <h2 id="buttons-title">Ações</h2>
      <div className="flex flex-wrap gap-3">
        <Button>Salvar alterações</Button>
        <Button variant="secondary">Voltar ao catálogo</Button>
        <Button variant="danger" onClick={() => setModalOpen(true)}>Excluir demonstração</Button>
        <Button disabled>Ação indisponível</Button>
        <LinkButton to="/">Abrir catálogo</LinkButton>
      </div>
    </section>

    <section className="my-8" aria-labelledby="forms-title">
      <h2 id="forms-title">Campos</h2>
      <Card className="max-w-xl">
        <Field label="Nome do serviço" htmlFor="demo-name" required hint="Use um nome claro e objetivo."><Input id="demo-name" defaultValue="Serviço demonstrativo" /></Field>
        <Field label="Categoria" htmlFor="demo-category"><Select id="demo-category" defaultValue="bem-estar"><option value="bem-estar">Bem-estar</option><option value="outros">Outros serviços</option></Select></Field>
        <Field label="Descrição" htmlFor="demo-description" error="Descreva o que está incluído no serviço."><Textarea id="demo-description" aria-describedby="demo-description-error" /></Field>
        <Checkbox label="Confirmo que os dados são sintéticos" description="Não use informações pessoais reais nesta vitrine." defaultChecked />
      </Card>
    </section>

    <section className="my-8" aria-labelledby="status-title">
      <h2 id="status-title">Estados e feedback</h2>
      <div className="flex flex-wrap gap-2 my-4"><Badge>Rascunho</Badge><Badge variant="info">Informativo</Badge><Badge variant="success">Concluído</Badge><Badge variant="warning">Atenção</Badge><Badge variant="danger">Recusado</Badge><StatusBadge status="aguardando_confirmacao" /></div>
      <Alert variant="success" title="Alterações salvas">A mensagem combina texto, borda e cor.</Alert>
      <Alert variant="error" title="Não foi possível salvar">Revise os campos informados e tente novamente.</Alert>
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <LoadingState label="Carregando demonstração..." />
        <EmptyState title="Nenhum item encontrado" description="Ajuste os filtros para continuar." />
        <ErrorState description="O conteúdo demonstrativo não respondeu." />
      </div>
    </section>

    <ConfirmationModal
      open={modalOpen}
      title="Excluir demonstração?"
      description="Esta ação é apenas visual e não altera nenhum dado."
      confirmLabel="Excluir demonstração"
      destructive
      onClose={() => setModalOpen(false)}
      onConfirm={() => setModalOpen(false)}
    />
  </Layout>;
}
