# Nutri-Med — Saúde e Serviços Gerais

O Nutri-Med é uma plataforma única com duas áreas distintas: **Saúde** e **Serviços Gerais**, compartilhando conta, autenticação e infraestrutura. Esta branch `integration/nm-mvp-saude-servicos` reúne a aplicação, backend, migrations, homologação e hardening para revisão independente. **Não está publicada nem validada para produção.**

- **Saúde:** descoberta de médicos, nutricionistas, psicólogos, fisioterapeutas e outros profissionais da saúde, com profissão, especialidade informada, cidade, modalidade e perfil público.
- **Serviços Gerais:** descoberta e contratação por orçamento de prestadores, como eletricistas, encanadores, pintores, técnicos, diaristas e outros profissionais, conforme as categorias disponíveis. Esses exemplos não adicionam categorias à taxonomia.

A definição oficial e os limites estão em [visão do produto](docs/visao-produto.md). Decisões comerciais, elegibilidade e operação continuam nas [questões em aberto](docs/questoes-em-aberto.md).

## Estado atual e limites

| Área | Implementado | Limites |
| --- | --- | --- |
| Saúde | Catálogo por domínio, profissão/especialidade, filtros, perfil público e painel profissional para atributos e modalidade das ofertas existentes | Cadastro inicial Saúde pela UI e solicitação administrativa bloqueados; API rejeita request Saúde com 409. Sem agenda, prontuário ou atendimento clínico na plataforma. |
| Serviços Gerais | Catálogo, categorias, preços, perfis, anúncios, solicitação de orçamento, propostas versionadas, aceite, acompanhamento e confirmação de conclusão | Sem pagamento real; criação de solicitação não possui idempotência no servidor. |
| Autenticação e autorização | Supabase Auth, sessões, recuperação, perfis e verificações de token/papel/propriedade na API | Entrega de e-mail por SMTP externo ainda precisa de validação; JWT emitido pode durar até expirar após logout. |
| Banco e segurança | Migrations ordenadas, RLS/grants, limites transacionais de escrita, snapshots, histórico e contrato único por pedido | Hardening remoto exige aplicação futura autorizada; testes desta branch usam somente banco e contas sintéticas locais. |
| Upload | Endpoint bloqueado com 501, `UPLOAD_DISABLED_PENDING_VALIDATION` | Não enviar imagens, PDFs ou dados reais; liberação depende de revisão própria. |

Registro profissional significa somente **“Registro informado pelo profissional”**, **“Não verificado oficialmente pela plataforma”** quando exibido. Não há certificação ou habilitação oficial validada pela plataforma. A opção técnica “Atuação geral informada” não concede título de especialista.

**Aceitar proposta em Serviços Gerais registra contratação; não significa pagamento.** Não há gateway, split, cobrança ou transferência reais. Não foi integrada a branch de pagamento simulado. Atendimento Saúde, prontuário, coleta de sintomas, exames e histórico clínico permanecem fora do fluxo disponível.

Chat, avaliações públicas, notificações, agenda e cancelamento comum após contratação continuam fora do escopo disponível.

Cada conta tem um papel (`cliente` ou `prestador`); cliente pode descobrir ambas as áreas. No MVP, prestador tem um único domínio profissional. Cadastro público não cria administradores e não há painel administrativo.

## Stack efetivamente utilizada

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4, React Router 7 |
| Backend | Supabase Edge Functions, TypeScript/Deno, API `supabase/functions/api/index.ts` |
| Auth e banco | Supabase Auth, PostgreSQL, migrations SQL, RLS/grants e funções transacionais |
| Ambiente e testes | Node.js 24 LTS, npm 11, Supabase CLI 2.122.1, Docker, Node test runner, Vitest, Testing Library e Playwright |
| Colaboração e CI | Git, GitHub Issues, revisão cruzada e GitHub Actions |

Dependências diretas e lockfile estão fixados; o SDK da Edge Function usa `npm:@supabase/supabase-js@2.119.0`. Não há backend Firebase ativo. Supabase Storage/upload e hospedagem de produção não são funcionalidades habilitadas nesta entrega. A escolha histórica de arquitetura está registrada no [PR #3](https://github.com/dp-tech021/nutri-med/pull/3).

## Execução local

Pré-requisitos: Git, Node.js 24 LTS, npm 11 e, para banco/API, Docker disponível. `.nvmrc` registra Node 24. Não ativar faturamento nem usar banco remoto para testes.

```bash
git clone https://github.com/dp-tech021/nutri-med.git
cd nutri-med
git fetch origin
git checkout integration/nm-mvp-saude-servicos
npm ci
npm run dev
```

O Vite informa a URL local, normalmente `http://127.0.0.1:5173`. Sem API/banco, a interface abre, mas as jornadas de catálogo, login e persistência não funcionam.

Verificações frontend:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

Para executar a stack local, a partir da mesma pasta:

```bash
npm run db:start
npx supabase status
```

Copie `.env.example` para `.env.local` e configure somente as variáveis públicas locais `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_API_URL`. **Nunca inserir secret/service_role, senha de banco ou token administrativo em variáveis `VITE_`, arquivos versionados, chat ou screenshots.** Não publicar a saída de status com chaves.

Em dois terminais separados:

```bash
npm run api:serve
```

```bash
npm run dev
```

A API usa `verify_jwt=false` porque há rotas públicas; **cada rota privada verifica o token via Supabase Auth**, além de perfil, domínio e propriedade no servidor. Não expor a stack local à internet.

`ALLOWED_ORIGINS` na Edge Function é a fonte de verdade do CORS. Se o Kong da CLI local sobrescrever os headers, a adaptação opcional `python scripts/configure-local-cors.py` remove somente essa interferência. Esse script não é requisito de produção, não configura o ambiente gerenciado e não substitui a política da função. Python/PyYAML são ferramentas locais opcionais.

Testes integrados, exclusivamente contra a stack local:

```bash
node scripts/test-security-migration.mjs
node scripts/test-domain-migration.mjs
node scripts/audit-local-database.mjs
node scripts/run-local-homologation.mjs --all
```

O runner carrega as chaves do status local para o processo filho, sem imprimi-las. `npm test` sem essas chaves declara os testes HTTP ignorados; isso não prova integração aprovada. `npm run test:integration` continua disponível para os cenários integrados originais. `npm run db:reset` recria destrutivamente o banco **local**; use somente para fixtures sintéticas.

Problemas de proxy, CA, DNS, espaço Docker ou healthcheck e a preparação legítima do cache npm estão documentados na seção [Hardening pré-integração](docs/homologacao-integrada.md#hardening-pré-integração). O entrypoint original foi homologado sem bundle ou configuração alternativa.

## Evidências e pendências

A origem validada `32c6a48` teve 96 testes aprovados, sem skips, além de migrations limpas, legado, autorização, concorrência de aceite e CORS locais. Os resultados específicos após integrar a main ficam em [homologação integrada](docs/homologacao-integrada.md). Histórico útil também está em [catálogo por domínio](docs/catalogo-dominios.md), [painéis e solicitações](docs/solicitacoes-paineis-dominios.md) e [taxonomia Saúde](docs/revisao-taxonomia-saude.md).

Persistem: avaliação comercial/legal e privacidade antes de dados reais; SMTP externo; testes de carga; revisão manual de acessibilidade; idempotência de criação de solicitações no servidor; aviso de bundle de aproximadamente 563 kB. A migration `20261117162451_revoke_rls_auto_enable_public_execute.sql` está preparada e testada localmente, **não aplicada ao Supabase remoto por estas etapas**. Publicação e migração remota precisam de autorização separada.

## Time, responsabilidades e revisão

| Conta GitHub | Responsabilidade principal |
| --- | --- |
| [@Id-UserDanilo](https://github.com/Id-UserDanilo) | Frontend, landing, React, formulários, UX, acessibilidade, configurações de segurança frontend e coordenação da revisão de segurança |
| [@o-tedd](https://github.com/o-tedd) | Backend, API, PostgreSQL, migrations, autenticação/autorização no servidor, RLS, integrações, transações e testes integrados |
| Ambos | Produto, decisões de custo/regulação, revisão cruzada e aprovação das entregas |

A UI indica estados; somente o backend autoriza acesso e transações. Segredos administrativos permanecem no servidor.

Fluxo de colaboração: Issue → branch → implementação/testes → revisão cruzada → autorização de merge → atualização da Issue. O [processo da dupla](docs/processo-colaboracao.md) preserva os critérios de Ready/Done e o fluxo de PRs para etapas de revisão autorizadas. **Esta preparação termina com a branch publicada, sem criar PR nem fazer merge na main.** Nenhuma Issue foi fechada automaticamente.

- [Backlog, fases e 38 Issues registradas](docs/backlog.md)
- [Questões comerciais, operacionais e licença](docs/questoes-em-aberto.md)
- [Todas as Issues](https://github.com/dp-tech021/nutri-med/issues)
- [Issues de Id-UserDanilo](https://github.com/dp-tech021/nutri-med/issues?q=is%3Aissue+assignee%3AId-UserDanilo)
- [Issues de o-tedd](https://github.com/dp-tech021/nutri-med/issues?q=is%3Aissue+assignee%3Ao-tedd)

Fases preservadas: F1 fundação/documentação; F2 plataforma; F3 contratação e qualidade; F4 evolução financeira futura, dependente de autorização. Decisões de categorias comerciais, regiões, critérios de elegibilidade, verificação oficial, monetização, suporte, disputas, métricas e licença continuam nas Issues. A decisão Saúde + Serviços Gerais não encerra NM-01.

## Histórico administrativo e custos

Os PRs [#2](https://github.com/dp-tech021/nutri-med/pull/2) (escopo), [#3](https://github.com/dp-tech021/nutri-med/pull/3) (arquitetura), [#4](https://github.com/dp-tech021/nutri-med/pull/4) (primeira implementação) e [#38](https://github.com/dp-tech021/nutri-med/pull/38) (organização, backlog e templates) são referências históricas; não se presume seu status atual. A entrega das duas áreas foi evoluída após o [PR #56](https://github.com/dp-tech021/nutri-med/pull/56). O [PR #5](https://github.com/dp-tech021/nutri-med/pull/5) é referência histórica de pagamento simulado, não integrado nesta branch e sem cobrança real.

**Orçamento autorizado: R$ 0.** Supabase Free, GitHub Free e eventual hospedagem gratuita têm quotas; disponibilidade, SMTP, domínio e operação comercial não são garantidos sem custo. Não ativar billing, deploy ou recursos pagos sem autorização expressa. Consultar os limites oficiais de [Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase) e [GitHub](https://docs.github.com/) antes de qualquer decisão futura. Cloudflare Pages Free foi uma candidata histórica de hospedagem, sem deploy; os [limites oficiais](https://developers.cloudflare.com/pages/platform/limits/) devem ser reavaliados em eventual decisão futura. Não há hospedagem de produção definida por esta preparação.

**Licença ainda não definida.** Um repositório público não concede automaticamente permissão geral de copiar ou redistribuir. Os colaboradores devem decidir direitos e licença na [NM-38](https://github.com/dp-tech021/nutri-med/issues/44).
