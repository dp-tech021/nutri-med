# Arquitetura do MVP — Nutri-Med

> **Nota de integração (10/11/2026):** este texto registra a arquitetura **proposta na etapa de planejamento**. Depois dessa etapa, o PR #4 passou a conter implementação de frontend, API e SQL, ainda sem QA integrado comprovado. Trechos abaixo que dizem que nada foi implementado ou que certos caminhos não existem descrevem o momento original da decisão; confira o estado atual do código antes de executar comandos. Nenhum merge ou deploy está autorizado.

**Situação:** decisão de referência para implementação, registrada em 2026-11-10. Nenhum serviço remoto foi criado. Nenhuma funcionalidade está implementada.

## 1. Contexto, requisitos e decisão

Produto: catálogo público de serviços com duas contas distintas (cliente e prestador), solicitações, propostas versionadas, aceite único e acompanhamento até conclusão. Orçamento operacional exigido: R$ 0. Dupla iniciante, uso de IA, GitHub com PRs, regras sensíveis no backend e banco não acessível diretamente pelo navegador.

**Decisão de referência:** uma aplicação React + TypeScript + Vite + Tailwind CSS + React Router; autenticação via **Supabase Auth**; API em **Supabase Edge Functions (TypeScript/Deno)**; dados de negócio em **PostgreSQL do Supabase**; imagens em **Supabase Storage** mediante autorização e verificação pela API; frontend estático a hospedar futuramente no **Cloudflare Pages Free**. Desenvolvimento local com Supabase CLI e runtime compatível com Docker. Não há dois backends.

Motivo: a arquitetura Firebase original exige habilitar o plano Blaze para publicar Cloud Functions, contrariando a política de não ativar faturamento. Supabase permite um MVP demonstrável com backend no plano Free, sujeito a quotas e pausa por inatividade; não garante operação contínua para clientes reais. Firebase emulado é segunda opção técnica, sem deploy da API no plano Spark.

Esta é uma recomendação para código novo, não uma migração. Rever caso haja necessidade de produção com disponibilidade garantida, crescimento acima das cotas, restrição a Docker, requisitos de região e conformidade LGPD, ou decisão formal de aceitar faturamento.

## 2. Comparação ponderada

Escala de 1 (pior) a 5 (melhor), notas como **avaliação técnica da equipe**, não benchmark externo.

| Critério | Peso | Supabase Auth + Edge + PostgreSQL | Firebase Auth + Functions + Firestore | Cloudflare Workers + D1 + autenticação a definir |
|---|---:|---:|---:|---:|
| Custo sem ativar faturamento para publicar a API | 30% | 5 | 1 | 3 |
| Segurança/autorização com API no backend | 25% | 4 | 4 | 3 |
| Curva de aprendizagem e documentação para dupla | 20% | 3 | 3 | 2 |
| Busca, filtros e transações de negócio | 15% | 5 | 3 | 4 |
| Maturidade, manutenção, portabilidade e lock-in | 10% | 4 | 3 | 3 |
| **Média ponderada** | **100%** | **4,25** | **2,65** | **3,00** |

Cloudflare é candidata, não segundo backend a implementar. Exigiria decisão separada sobre identidade/autenticação e maior trabalho de integração. Supabase tem lock-in de Auth, Edge e Storage, mas PostgreSQL e SQL facilitam migração de dados comparado com modelos proprietários. Infra local usa contêineres e consome recursos de máquina.

### Custos e limites verificados (2026-11-10)

- **Supabase Free:** 2 projetos ativos, 500 MB de banco por projeto, 1 GB de Storage, 50.000 usuários ativos mensais, 500.000 invocações de Edge Functions e 5 GB de egress; quotas/limites podem mudar. Projetos com baixa atividade podem ser pausados após aproximadamente 7 dias. Não selecionar Pro, add-ons nem criar organização paga.
- **Edge Functions Free:** limite de memória 256 MB e tempo de CPU de 2 s por requisição. Operações pesadas de imagem não devem ser executadas indiscriminadamente na função.
- **Cloudflare Pages Free:** 500 builds/mês e 20.000 arquivos/site; apenas hospedagem estática. Não publicar sem autorização.
- **Firebase:** emuladores executam localmente; deploy de Cloud Functions exige Blaze. Não ativar cobrança para este MVP.
- Domínio personalizado, e-mail transacional externo, uso de terceiros e disponibilidade contínua **não** estão garantidos como R$ 0. Verificar volume de e-mails de confirmação e recuperação e exigências para remetente real antes de liberar cadastro externo.

Fontes primárias:
- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://supabase.com/docs/guides/functions/limits
- https://supabase.com/docs/guides/functions/pricing
- https://supabase.com/docs/guides/local-development
- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://developers.cloudflare.com/pages/platform/limits/
- https://firebase.google.com/docs/functions/get-started

## 3. Visão dos componentes

```text
Navegador
  ├─ React + TypeScript + Router + Tailwind
  ├─ Supabase Auth: cadastro/login/logout/recuperação, token de usuário
  └─ HTTPS → Edge Functions (API única para dados de negócio)
                 ├─ autenticar sessão e validar e-mail confirmado
                 ├─ validar payload/ownership/perfil/estado
                 ├─ SQL/transações para regras e concorrência
                 └─ Postgres (schema privado) e Storage
```

**Isolamento de dados:** tabelas de negócio em schema não exposto à Data API (e revogar privilégios de `anon` e `authenticated` quando aplicável); ativar RLS nas tabelas expostas, sem políticas permissivas para negócio. O navegador usa SDK Supabase apenas para autenticação e obter tokens, **nunca** para consultas SQL/PostgREST de negócio. Edge Functions usam credenciais administrativas exclusivamente no servidor, com verificação explícita de cada operação. Chave publishable pode ser pública; secret/service-role nunca fica no frontend. Testar tentativas de acesso direto aos dados.

**Identidade:** bearer token sobre HTTPS, validado no backend em cada chamada. Obter ID do usuário da autenticação verificada, nunca de campo `user_id` informado pelo cliente. Exigir e-mail confirmado para publicar, solicitar, enviar/revisar e aceitar propostas; consultar dados atualizados da autenticação no fluxo crítico para não confiar em claim obsoleta. Não usar cookie de sessão nesta versão; não incluir token em URL nem logs.

**Público:** endpoints de catálogo e perfil profissional não precisam de login, mas só retornam campos públicos. Endpoints privados verificam perfil e propriedade no backend. CORS restringe origens configuradas; CORS não autoriza requisições.

**Separação de camadas:**
- `src/pages`, `src/components`, `src/auth`, `src/api`: frontend.
- `supabase/functions/api`: roteamento HTTP e adaptadores.
- `supabase/functions/_shared`: identidade, validação, políticas de erro, domínio e autorização.
- `supabase/migrations`: esquema, índices, roles, funções de transação e regras.
- `supabase/tests`: testes de autorização e integridade.
Os caminhos são um **contrato proposto**; ainda não foram criados.

## 4. Telas do MVP

Públicas: início, catálogo, detalhes do serviço, perfil profissional, login, cadastro, recuperação de senha e verificação de e-mail.
Cliente: painel de solicitações, criação/consulta de pedido, proposta e confirmação do aceite, histórico e conclusão.
Prestador: perfil, serviços e imagens, pedidos recebidos, proposta/revisões, atendimentos e conclusão informada.
Comuns: 404, acesso negado, sessão expirada e erro de rede. Nenhum painel administrativo.

## 5. API inicial (contrato lógico, ainda não implementado)

Prefixo ilustrativo `/api/v1` (roteamento final via Edge Function será definido na Etapa 4). Corpo JSON em UTF-8, datas ISO 8601 UTC, dinheiro em centavos inteiros, moeda BRL. Erros: status HTTP + código estável, mensagem segura e identificador de correlação; nunca retornar stack trace.

| Método e caminho | Acesso | Operação |
|---|---|---|
| GET /catalog | público | listar serviços ativos com busca/filtros/paginação |
| GET /services/:id | público | serviço ativo e dados públicos do prestador |
| GET /providers/:id | público | perfil público e serviços ativos |
| POST /profiles | autenticado | criar perfil cliente ou prestador, idempotente |
| GET/PATCH /me | proprietário | consultar/editar campos permitidos |
| POST/GET/PATCH /my/services | prestador | criar, listar, editar serviços próprios |
| POST /my/services/:id/deactivate | dono prestador | desativar anúncio |
| POST/GET /requests | cliente | abrir e listar solicitações próprias |
| GET /requests/:id | cliente ou prestador vinculado | consultar pedido |
| POST /requests/:id/actions | parte vinculada | transição de estado autorizada |
| POST /requests/:id/proposals | prestador vinculado | criar/revisar proposta vigente |
| POST /requests/:id/accept | cliente vinculado | aceitar versão vigente atomicamente |

A especificação definitiva de entradas/saídas, restrições, status codes e idempotência fica na Etapa 4; não considerar estes caminhos já implementados.

## 6. Busca, filtros e paginação — contrato MVP

A busca será **restrita e explícita**, sem prometer busca avançada.

- `q`: termo opcional, de 2 a 60 caracteres depois de normalização.
- `search_in`: `service` (padrão) ou `provider`. Busca por **prefixo** do título do serviço ou nome público do prestador, respectivamente. Não há busca dentro de descrições, correspondência difusa, plural, sinônimos ou substring.
- Normalizar entradas e campos indexados removendo acentos, convertendo para minúsculas e espaços simples. Manter versões legíveis separadas. Implementar a mesma rotina para indexação e busca no backend.
- Filtros combináveis com AND: `category_id` (uma categoria), `city` (cidade normalizada, uma), `modality` (`online` ou `presencial`). Pesquisa `q` é opcional. Não há raio geográfico.
- Retornar só serviços ativos, sem dados privados.
- Ordem estável: `created_at DESC, id DESC` (UUID como desempate); timestamps de criação gerados no servidor. Paginação por cursor de pares `(created_at, id)` validados/assinados, com `limit` padrão 20 e máximo 50.
- Consultas no PostgreSQL devem aplicar filtros e `LIMIT` no servidor; índices compostos para filtros comuns e índice específico para prefixos normalizados, após aferir o plano de execução. Não carregar tabela inteira no navegador.
- Os resultados podem mudar entre páginas quando há novo anúncio/ativação/desativação; isso não é snapshot transacional.
- Combinatórias de índices e desempenho devem ser avaliados com dados de teste. Expor erro claro se filtro inválido, em vez de ignorá-lo silenciosamente.

## 7. Consistência, proposta e contratação

A máquina de estados oficial continua em `docs/escopo-mvp.md` quando o PR de preparação for integrado. Até lá, a implementação seguirá a especificação original fornecida.

- Uma solicitação tem uma proposta vigente, revisão gera nova versão imutável.
- Aceite exige `proposal_version_id` visto pelo cliente e confirmação explícita.
- Transação SQL verifica estado, versão, ator e vínculo; bloqueia linha da solicitação (ex.: `SELECT ... FOR UPDATE`) e insere aceite + termos snapshot + histórico na mesma transação.
- Chave de idempotência para repetir aceite com segurança e restrição `UNIQUE(request_id)` em contratações.
- Se revisão vencer a corrida, rejeitar aceite desatualizado (HTTP 409); se aceite vencer, rejeitar revisão.
- Não permitir cancelamento após contratação ou conclusão automática.
- Logs de mudança de estado registram ator, data, estado anterior e próximo, sem dados sensíveis indevidos.

## 8. Imagens

Storage privado; fluxo: autorizar upload por Edge Function, reservar caminho aleatório atrelado ao proprietário e serviço, limitar extensão e tamanho e validar **conteúdo real** antes de publicar. Upload com URL assinada pode enviar bytes diretamente ao Storage, mas exige estado `pending` até inspeção/validação backend; tokens de upload não equivalem a arquivo aprovado. Evitar URL pública permanente para arquivos não verificados. Proposta inicial: JPG/PNG/WebP, no máximo 3 imagens por serviço e 2 MiB por imagem; estes limites são decisão de produto, não limites oficiais do provedor. Não pressupor antivírus ou processamento de imagem sem integração comprovada; se não houver validação confiável, manter imagens desabilitadas até sua implementação segura.

Referência: https://supabase.com/docs/guides/storage/uploads/standard-uploads

## 9. Execução local e ambientes

Requer Node.js LTS compatível com as dependências selecionadas, npm, Git, e Docker/Podman (motor de contêiner ativo). Confirmar as versões reais e lockfile na Etapa 3; não fixar versões inventadas.

Após instalação das ferramentas, **somente quando a Etapa 3 tiver criado os arquivos**, executar na raiz:
```bash
npm install
npx supabase start
npm run dev
```
Comandos esperados depois de configurados; neste momento **não executáveis no repositório**, pois ainda não há `package.json` nem `supabase/config.toml`. O Supabase Studio local costuma usar `http://localhost:54323`; verificar saída da CLI. Credenciais locais de desenvolvimento jamais devem ser reutilizadas em produção.

Para testar Edge Functions localmente, a configuração e scripts específicos serão documentados na Etapa 3. Nenhuma conta cloud é necessária para executar o ambiente local. Nunca expor emuladores/stack local à internet.

Ambientes separados: local, homologação (somente se criado com consentimento) e produção (requer autorização explícita). Deploy e segredos de serviço exclusivamente via configurações seguras, fora do Git.

## 10. Verificação planejada e critérios de aceite

Etapa 3: instalação, build, typecheck e teste básico em ambiente local; CI em PR.
Etapas seguintes: testes integrados de autenticidade, separação cliente/prestador, acesso cruzado, RLS/grants, listas e índices, dados privados, upload inválido e concorrência no aceite.
Verificar falhas e casos negativos. Não classificar o MVP como pronto para produção com testes exclusivamente locais.

**Pendências de decisão:** disponibilidade operacional no Free (pausa por inatividade); configuração real do SMTP e limites de envio; região/data residency/LGPD; se as imagens poderão receber validação robusta gratuita; seleção do plano e domínio estático na publicação.

**Fontes adicionais:** https://supabase.com/docs/guides/local-development/cli-workflows e https://supabase.com/docs/guides/functions/auth-headers
