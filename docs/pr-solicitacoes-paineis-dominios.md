# PR incremental: solicitações e painéis por domínio

- Repositório: `dp-tech021/nutri-med`
- Título: `feat: adaptar painéis por domínio e explicitar bloqueio de atendimento Saúde`
- Head: `feat/nm-solicitacoes-paineis-por-dominio`
- Base: `feat/nm-catalogo-perfis-por-dominio`, ponta validada `52aa67c`
- Estado: **rascunho**, sem merge ou deploy.

Conferir se já existe um PR para esta head antes de abrir outro. Se a base tiver sido integrada, verificar a branch que efetivamente contém catálogo/perfis e usar essa base preservando o histórico.

## Estado da entrega

Implementação enviada no commit `7b4ee14`, seguida de documentação e capturas nesta mesma branch. A tentativa de criação com `gh pr create --draft` falhou: API GitHub bloqueada pelo proxy (HTTP 403). **Ainda não existe um PR deste incremento criado nesta execução.**

Comparação para abrir o PR em rascunho contra a base correta:
https://github.com/dp-tech021/nutri-med/compare/feat/nm-catalogo-perfis-por-dominio...feat/nm-solicitacoes-paineis-por-dominio?expand=1

Resultados finais: instalação, typecheck, lint e build passaram; 78 testes de interface e 9 verificações Node passaram. As 2 integrações são ignoradas pelo `npm test` sem variáveis locais, mas foram executadas separadamente no Supabase local real: 2 aprovadas, 0 skips. QA: 25 combinações (cinco larguras × cinco perfis), sem overflow. Envio/acompanhamento Saúde: bloqueado e não executado ponta a ponta, por falta de contrato administrativo. Capturas e matriz em `docs/screenshots/domain-journeys/`.

## Descrição proposta

Serviços Gerais mantém solicitações de orçamento, propostas, histórico, aceite, gerenciamento de anúncios e preços. Saúde recebe painel próprio para profissão/especialidade e modalidade de ofertas por endpoints existentes e validados. As ações não enviam domínio ou papel: a API deriva contexto do perfil/anúncio e preserva autenticação/propriedade.

O contrato atual não suporta solicitações administrativas de Saúde. O CTA “Solicitar atendimento” permanece desabilitado com aviso claro, sem descrição livre, dados clínicos, agenda ou simulação de envio. Não se replica o fluxo comercial de Serviços em Saúde. O painel do cliente identifica seu histórico de orçamentos como Serviços Gerais. Perfis Saúde não entram pelas rotas comerciais antigas de prestador.

Arquivos centrais: `HealthDashboardPage.tsx`, `HealthRequestNotice.tsx`, `DashboardPage.tsx`, `ServiceDetailsPage.tsx`, `ClientRequestsPage.tsx`, `AppRoutes.tsx`, testes correspondentes, integração e `scripts/qa-domain-journeys.mjs`. Sem alteração de API, migração ou credenciais nesta etapa. Contrato, decisões, resultados e riscos em `docs/solicitacoes-paineis-dominios.md`.

Validação: npm ci, typecheck, testes, lint e build; integração local real com orçamento/propostas/aceite, isolamento de terceiros, domínio inconsistente e edições de Saúde. QA Chromium em 320/375/768/1024/1440 com visitante, cliente, prestadores de Serviços/Saúde e terceiro, teclado/foco/overflow. Conferir contagens e status finais no relatório versionado. Smoke do navegador usa dados/respostas sintéticos; integração HTTP real é separada.

Bloqueio: envio/acompanhamento Saúde ponta a ponta **não executados**, porque falta contrato administrativo. O MVP não está concluído. Pendentes: campos operacionais fechados, estados, regras de acesso/histórico/retenção, avaliação de produto e testes antes de habilitar envio. Não há pagamento simulado nesta base, e nenhuma branch antiga de pagamento foi incorporada. Sem dados reais, alteração remota de banco, deploy, merge ou cobrança.
