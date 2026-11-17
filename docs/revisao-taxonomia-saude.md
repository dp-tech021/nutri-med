# Revisão incremental: taxonomia e compatibilidade Saúde

Branch existente: `feat/nm-solicitacoes-paineis-por-dominio`. SHA inicial local/remoto: `9e34ad15321f1718b60b6471dea86dc544665245`; árvore limpa antes das alterações. A `main` remota estava em `900e3738f462b265daa8cc62942a9483d870b5e3`. Não foram criadas branches nem utilizados comandos ou APIs para abrir PR.

## Decisões de dados

A [visão do produto](visao-produto.md#domínio-profissional-clientes-e-evolução-futura) distingue o cliente transversal do domínio profissional do prestador, registra um domínio por prestador como simplificação intencional e explica a UNIQUE composta requerida pela FK. Nada disso altera papel de conta, autorizações ou o modelo existente. Multi-domínio para prestador fica como evolução, sem implementação.

A única migration nova é `202611170002_initial_health_taxonomy.sql`: cinco profissões solicitadas e uma opção técnica `atuacao-geral` por profissão. Não é certificação, taxonomia médica completa nem declaração de habilitação. Slugs estáveis, sem acentos; nenhum profissional ou anúncio é inventado. O seed é aditivo e idempotente, não apaga customizações ou dados legados. Não remover pares de profissão/especialidade já referenciados por perfis para desfazer o seed; recuperação preferida é manter os dados e corrigir apresentação/lista em migration posterior aprovada.

## Revisão de POST /services para Saúde (sem liberação de criação na UI)

O endpoint existente exige sessão de **prestador**, e-mail confirmado, limite de escrita e perfil cujo domínio armazenado seja `health`. Campos do payload:

| Campo | Validação atual |
| --- | --- |
| `domain` | `health`, coincidente com o perfil autenticado; a omissão continua default legado `services` e não transforma o perfil Saúde. |
| `title` | Texto profissional, 3–120 caracteres. |
| `description` | Apresentação da oferta, 10–2000 caracteres; não destinado a dados de pacientes ou informações clínicas. |
| `city` | Cidade operacional, 2–100 caracteres. |
| `modality` | `online` ou `presencial`. |
| `category` | Obrigatoriamente `outros` em Saúde, sentinela da FK legada de categorias de Serviços. Não é categoria clínica nem filtro de Saúde. |
| `price_type` | Obrigatoriamente `orcamento` em Saúde por compatibilidade estrutural do schema antigo. Não habilita orçamento médico ou negociação comercial. |
| `price_cents` | Nulo/omitido; valor monetário é rejeitado para Saúde. |

O dono é obtido da sessão; profissão/especialidade vêm do perfil, com FK de taxonomia; não podem ser escolhidos por campos extras do anúncio. O anúncio nasce ativo conforme o contrato já existente. O endpoint não verifica conselho ou habilitação; uma taxonomia inicial não substitui essa verificação. Nenhuma liberação adicional de publicação ou formulário de criação Saúde foi implementada aqui. A API permanece disponível somente conforme suas verificações anteriores; cadastro inicial pelo painel continua bloqueado.

O frontend centraliza a decisão de preço público em `visibleServicePrice`: retorna nulo para Saúde antes de interpretar sentinelas. Cards e detalhes não mostram preço nem “Sob orçamento”, inclusive se um payload sintético malformado trouxer valor numérico. Perfil público Saúde não usa categoria legada no cabeçalho. Serviços Gerais mantém categoria, preço fixo/inicial/sob orçamento e fluxo anterior. O catálogo Saúde usa profissão, especialidade, cidade e modalidade; o serializador descarta `category` mesmo se houver estado antigo da outra área. Serviços nunca envia profissão/especialidade.

Registro público é mostrado somente com consentimento, como “Registro informado pelo profissional” e “Não verificado oficialmente pela plataforma”. Não há selo ou verificação automática. `POST /requests` continua exclusivo de Serviços Gerais: Saúde é rejeitada a partir do anúncio no servidor e pelo trigger, mesmo sem campo `need`; o CTA permanece desabilitado, sem campos clínicos.

## Validação

| Comando/verificação | Resultado final |
| --- | --- |
| `npm ci --cache /tmp/nutri-npm-cache` | Aprovado, exit 0; 268 pacotes. Manifesto e lockfile preservados. |
| `npm run typecheck` | Aprovado, exit 0. |
| `npm test` | Aprovado, exit 0: 82 testes Vitest em 19 arquivos e 9 verificações Node. Os 3 testes integrados ficam ignorados no processo padrão sem chaves TEST, mas foram executados separadamente abaixo. |
| `npm run lint` | Aprovado, exit 0. |
| `npm run build` | Aprovado, exit 0; aviso de bundle >500 kB preservado. |
| `npm run test:integration` | Aprovado no Supabase local existente: **3 testes, 0 falhas e 0 skips**. Chaves locais obtidas da CLI e passadas apenas em memória, sem impressão. |
| `node scripts/test-domain-migration.mjs` | Aprovado em banco local descartável: migrações anteriores e dados legados antes do domínio, preservação de IDs/preços/categorias, seed aplicado duas vezes, cinco pares sem duplicação e dependência da FK na UNIQUE composta. |
| Nova migration na stack local existente | Seed aplicado por `docker exec ... psql`, somente na instância local. Não houve reset dos dados sintéticos anteriores nem migration remota. |
| `scripts/qa-marketplace.mjs` | Aprovado em 320, 375, 768, 1024 e 1440 px, visitante e cliente autenticado: Home, CTAs/rotas reais, Saúde, Serviços, menu mobile, foco e overflow. |
| `scripts/qa-domain-journeys.mjs` | Aprovado nas mesmas cinco larguras × cinco perfis (25 combinações). Painéis Saúde/Serviços, orçamento/histórico, terceiros e perfil público de **ambos** os domínios em cada combinação. Perfis Saúde sem preço/selo, registro como declaração; nenhum overflow e sem erros JS. |
| `git diff --check` | Aprovado. |

Os scripts de navegador existentes foram reutilizados e o de jornadas foi ampliado para perfis públicos. Resultados em [screenshots/taxonomy-review](screenshots/taxonomy-review/): 10 combinações da Home/catálogos e 25 de jornadas com perfis públicos; capturas de Saúde em 320 e 1440 px. O navegador usa respostas/sessões sintéticas interceptadas, enquanto a integração HTTP e PostgreSQL acima é real e separada. Não se afirma conformidade WCAG completa.

Os testes preservam orçamento/propostas/aceite/histórico de Serviços Gerais e verificam autenticação, propriedade, acesso de terceiros, domínio forjado, cadastro profissional/edição operacional, registro privado/público e taxonomia servida pelo banco. Testes adicionais cobrem o cliente navegando nos dois domínios, seleção do painel pelo perfil, filtros sem cruzamento e ocultação de preços de Saúde mesmo em payload inconsistente.

A tentativa inicial de ler o status local da CLI no sandbox não conseguiu acessar sua configuração fora do workspace; o comando integrado foi concluído após liberação da execução local, sem alterar ou expor credenciais. Não restaram falhas nos checks finais.

## Deliberadamente bloqueado e riscos restantes

Cadastro inicial Saúde na UI, solicitações administrativas de Saúde, agenda, contratação Saúde e pagamentos reais continuam indisponíveis. O envio Saúde ponta a ponta **não foi executado**, pois não existe contrato administrativo; o bloqueio foi testado. Médico/atuação geral é classificação declarada, não habilitação ou certificação; o modelo ainda exige uma especialidade técnica e um domínio por prestador. A API de publicação continua com sentinelas de schema e exige cuidado de rollout; a camada pública não deve mostrá-las como preço médico. Taxonomia, critérios comerciais e verificação oficial ainda podem evoluir por decisão de produto. O MVP não está concluído.

Nenhuma migration remota, reset destrutivo, alteração de credenciais, deploy ou cobrança foi realizada. Nenhum PR foi criado. Nenhum merge foi realizado. A main não foi alterada.

## Arquivos alterados nesta tarefa

- `README.md`
- `docs/backlog.md`
- `docs/revisao-taxonomia-saude.md`
- `docs/screenshots/taxonomy-review/health-1440.png`
- `docs/screenshots/taxonomy-review/health-320.png`
- `docs/screenshots/taxonomy-review/journeys-results.json`
- `docs/screenshots/taxonomy-review/marketplace-results.json`
- `docs/visao-produto.md`
- `scripts/qa-domain-journeys.mjs`
- `scripts/test-domain-migration.mjs`
- `src/api.ts`
- `src/components/ServiceCard.test.tsx`
- `src/components/ServiceCard.tsx`
- `src/pages/CatalogPage.test.tsx`
- `src/pages/CatalogPage.tsx`
- `src/pages/HealthDashboardPage.test.tsx`
- `src/pages/PublicProviderPage.test.tsx`
- `src/pages/PublicProviderPage.tsx`
- `src/pages/ServiceDetailsPage.tsx`
- `src/routes/AppRoutes.test.tsx`
- `supabase/migrations/202611170002_initial_health_taxonomy.sql`
- `tests/integration.test.mjs`
