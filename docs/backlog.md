# Nutri-Med — Backlog e roadmap de desenvolvimento

> Registro criado em 2026-11-10. Esta branch contém **apenas planejamento e templates**. As Issues estão criadas e abertas; nenhuma delas foi concluída automaticamente.

## Visão e limites do projeto
Plataforma web em que **clientes** encontram prestadores, solicitam orçamento, recebem propostas versionadas, aceitam condições e acompanham a execução e conclusão. O MVP **não processa pagamentos**. O posicionamento entre marketplace genérico e saúde/nutrição depende da decisão de [NM-01](https://github.com/dp-tech021/nutri-med/issues/6). Não presumir tratamento de dados de saúde sem avaliação de risco.

## Donos das áreas (GitHub assignees)
- **Frontend, UX, acessibilidade, configurações de segurança do frontend, revisão de privacidade e coordenação da segurança:** [@Id-UserDanilo](https://github.com/Id-UserDanilo).
- **Backend, API, Supabase Auth do lado do servidor, PostgreSQL, RLS, regras de negócio, transações e infraestrutura backend:** [@o-tedd](https://github.com/o-tedd).
- **Decisões de escopo e processo:** ambos; cada Issue compartilhada contém duas atribuições.
- **Responsabilidade de segurança:** o-tedd implementa controles no servidor; Id-UserDanilo coordena checklist/auditoria e valida impacto no frontend. Nenhuma autorização pode depender apenas da interface.

## Prioridades
- **P0 — bloqueante:** fundamental para MVP confiável, liberar merge e homologação.
- **P1 — importante:** entrega prevista antes da conclusão comercial do MVP.
- **P2 — opcional:** protótipo demonstrativo isolado do fluxo financeiro.
- **P3 — futuro:** gateway e operação financeira, fora do escopo autorizado.

## Fases e gates de saída
| Fase | Conteúdo | Gate para avançar |
| --- | --- | --- |
| **F1 — Fundação** | Produto, documentação, stack, design system, landing page | Público-alvo decidido, comandos locais reproduzíveis, PRs revistos |
| **F2 — Plataforma** | Login, perfis, serviços, catálogo, imagens, solicitações | Dados reais persistem, contas isoladas, interfaces integradas |
| **F3 — Contratação e qualidade** | Propostas, aceite, estados, testes, homologação | Teste integrado sem skips críticos, segurança e concorrência verificadas |
| **F4 — Evolução financeira** | Pagamento demonstrativo, gateway, checkout, repasses | Só após decisão comercial, análise de custos/regulação e autorização explícita |

**Observação:** F4 não é necessária para entregar o MVP original. A landing page é separada do catálogo; começar pela UI não substitui regras de autorização no backend.

## Registro das Issues

| ID / Issue | Fase | Prioridade | Área | Atribuído a | Entrega |
| --- | --- | --- | --- | --- | --- |
| [NM-01](https://github.com/dp-tech021/nutri-med/issues/6) | F1 | P0 | Produto | Id-UserDanilo + o-tedd | Definir nicho, público-alvo e proposta de valor |
| [NM-02](https://github.com/dp-tech021/nutri-med/issues/7) | F1 | P0 | Processo | Id-UserDanilo + o-tedd | Consolidar fluxo Git e documentos iniciais |
| [NM-03](https://github.com/dp-tech021/nutri-med/issues/8) | F1 | P0 | Backend | o-tedd | Fixar dependências, lockfile e ambiente local |
| [NM-04](https://github.com/dp-tech021/nutri-med/issues/9) | F1 | P0 | Frontend | Id-UserDanilo | Identidade visual, design system e acessibilidade |
| [NM-05](https://github.com/dp-tech021/nutri-med/issues/10) | F1 | P1 | Frontend | Id-UserDanilo | Landing page de apresentação |
| [NM-06](https://github.com/dp-tech021/nutri-med/issues/11) | F2 | P0 | Backend | o-tedd | Autenticação e perfis no servidor |
| [NM-07](https://github.com/dp-tech021/nutri-med/issues/12) | F2 | P0 | Frontend | Id-UserDanilo | Cadastro, login, recuperação e perfis |
| [NM-08](https://github.com/dp-tech021/nutri-med/issues/13) | F2 | P0 | Segurança | Id-UserDanilo | Configurações de segurança do frontend |
| [NM-09](https://github.com/dp-tech021/nutri-med/issues/14) | F2 | P0 | Backend | o-tedd | PostgreSQL, RLS e migrações |
| [NM-10](https://github.com/dp-tech021/nutri-med/issues/15) | F2 | P0 | Backend | o-tedd | API de catálogo, busca e filtros |
| [NM-11](https://github.com/dp-tech021/nutri-med/issues/16) | F2 | P1 | Frontend | Id-UserDanilo | Interface de catálogo, filtros e detalhes |
| [NM-12](https://github.com/dp-tech021/nutri-med/issues/17) | F2 | P0 | Backend | o-tedd | CRUD de serviços e categorias |
| [NM-13](https://github.com/dp-tech021/nutri-med/issues/18) | F2 | P1 | Frontend | Id-UserDanilo | Painel do prestador e formulários |
| [NM-14](https://github.com/dp-tech021/nutri-med/issues/19) | F2 | P1 | Backend | o-tedd | Validação e armazenamento de uploads |
| [NM-15](https://github.com/dp-tech021/nutri-med/issues/20) | F2 | P1 | Frontend | Id-UserDanilo | Upload e galeria na interface |
| [NM-16](https://github.com/dp-tech021/nutri-med/issues/21) | F2 | P0 | Backend | o-tedd | Solicitações, consulta e cancelamento |
| [NM-17](https://github.com/dp-tech021/nutri-med/issues/22) | F2 | P0 | Frontend | Id-UserDanilo | Formulário e histórico de solicitações |
| [NM-18](https://github.com/dp-tech021/nutri-med/issues/23) | F3 | P0 | Backend | o-tedd | Propostas versionadas e recusa |
| [NM-19](https://github.com/dp-tech021/nutri-med/issues/24) | F3 | P0 | Frontend | Id-UserDanilo | Jornada de proposta e revisão |
| [NM-20](https://github.com/dp-tech021/nutri-med/issues/25) | F3 | P0 | Backend | o-tedd | Aceite atômico e idempotente |
| [NM-21](https://github.com/dp-tech021/nutri-med/issues/26) | F3 | P0 | Frontend | Id-UserDanilo | Confirmação explícita da contratação |
| [NM-22](https://github.com/dp-tech021/nutri-med/issues/27) | F3 | P0 | Backend | o-tedd | Início, finalização e auditoria |
| [NM-23](https://github.com/dp-tech021/nutri-med/issues/28) | F3 | P0 | Frontend | Id-UserDanilo | Painéis, histórico e conclusão |
| [NM-24](https://github.com/dp-tech021/nutri-med/issues/29) | F3 | P0 | Backend | o-tedd | QA integrado de banco, API e concorrência |
| [NM-25](https://github.com/dp-tech021/nutri-med/issues/30) | F3 | P0 | Segurança | Id-UserDanilo | QA de UX, privacidade e segurança frontend |
| [NM-26](https://github.com/dp-tech021/nutri-med/issues/31) | F3 | P1 | Backend | o-tedd | Homologação backend, SMTP e limites |
| [NM-27](https://github.com/dp-tech021/nutri-med/issues/32) | F3 | P1 | Frontend | Id-UserDanilo | Plano de preview e publicação frontend |
| [NM-28](https://github.com/dp-tech021/nutri-med/issues/33) | F1-F3 | P0 | Segurança | Id-UserDanilo | LGPD e riscos específicos do produto |
| [NM-29](https://github.com/dp-tech021/nutri-med/issues/34) | F4 | P2 | Frontend | Id-UserDanilo | Checkout demonstrativo sem cobrança |
| [NM-30](https://github.com/dp-tech021/nutri-med/issues/35) | F4 | P3 | Backend | o-tedd | Integração futura com gateway |
| [NM-31](https://github.com/dp-tech021/nutri-med/issues/36) | F4 | P3 | Frontend | Id-UserDanilo | Interface futura de checkout real |
| [NM-32](https://github.com/dp-tech021/nutri-med/issues/37) | F4 | P3 | Backend | o-tedd | Webhooks, split, repasses e estornos |

## PRs pré-existentes e cuidados com integração
- [PR #2](https://github.com/dp-tech021/nutri-med/pull/2): diretrizes e escopo do MVP; revisão antes do merge.
- [PR #3](https://github.com/dp-tech021/nutri-med/pull/3): arquitetura Supabase e custo zero; reconciliar com a base.
- [PR #4](https://github.com/dp-tech021/nutri-med/pull/4): implementação de frontend/backend em branch **não integrada**. Existe CI frontend, mas testes de banco e fluxo completo seguem pendentes.
- [PR #5](https://github.com/dp-tech021/nutri-med/pull/5): pagamento **simulado**, baseado na branch do PR #4; não cobrar nem fazer merge isolado sem revisão.
- [PR #1](https://github.com/dp-tech021/nutri-med/pull/1): teste de conexão encerrado sem merge.

## Consultas rápidas
- [Todas as Issues](https://github.com/dp-tech021/nutri-med/issues)
- [Issues atribuídas a Id-UserDanilo](https://github.com/dp-tech021/nutri-med/issues?q=is%3Aissue+assignee%3AId-UserDanilo)
- [Issues atribuídas a o-tedd](https://github.com/dp-tech021/nutri-med/issues?q=is%3Aissue+assignee%3Ao-tedd)
- [Issues P0](https://github.com/dp-tech021/nutri-med/issues?q=is%3Aissue+is%3Aopen+in%3Atitle+P0)
- [PRs](https://github.com/dp-tech021/nutri-med/pulls)

## Como acompanhar
1. Abrir Issue com objetivo, passos, **critérios verificáveis**, prioridade, área, responsável e dependências.
2. Iniciar branch separada e registrar na Issue o link do PR; não trabalhar simultaneamente na mesma branch sem coordenação.
3. Anotar testes **realmente executados**. Código escrito ou CI verde com integração ignorada **não** equivale a concluído.
4. Revisão cruzada, verificação de segredos e aprovação de segurança antes de merge.
5. Fechar Issue apenas quando os critérios de aceite estiverem satisfeitos; registrar bloqueios sem mascarar a situação.
6. Para visualização tipo Kanban, criar manualmente um GitHub Project com colunas **Backlog / A fazer / Em andamento / Em revisão / Bloqueado / Concluído** e adicionar as Issues. **O Project ainda não foi criado automaticamente** por esta integração.

## Regras de custo e produção
- Prioridade para ferramentas gratuitas; quotas, limitações de uptime, região, SMTP e domínio precisam ser verificadas na data da implantação.
- Não ativar faturamento, publicar produção, criar pagamento real ou coletar dados sensíveis sem decisão e autorização explícitas.
- Nada de chaves administrativas no frontend, em commits ou em chats com IA.
