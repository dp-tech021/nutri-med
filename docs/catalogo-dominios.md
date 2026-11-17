# Catálogo e perfis por domínio — entrega incremental

Base: PR #56 aberto em rascunho, commit revisado `63ed0ff4560e4220ee53abe9a0c5f5859808c9ad`. Este trabalho usa branch incremental `feat/nm-catalogo-perfis-por-dominio`; a base do novo PR deve ser `feat/nm-redefinicao-saude-servicos` enquanto #56 estiver aberto.

## Modelo e relações

`MarketplaceDomain = 'health' | 'services'` é compartilhado por frontend e API em `supabase/functions/_shared/marketplace.ts`, reexportado por `src/marketplace.ts`. `DomainAttributes` é uma união discriminada com atributos específicos de Saúde; o tipo base de perfil e anúncio mantém os campos comuns. `domain` ausente em respostas/fixtures antigas equivale a Serviços Gerais. A API nova devolve domínio explícito.

A conta continua com `kind: cliente | prestador`. Nesta entrega há **um perfil por conta**, associado a um domínio profissional: um prestador de Saúde publica apenas em Saúde; um prestador de Serviços Gerais publica apenas em Serviços Gerais. O domínio é imutável pela API de edição. Clientes mantêm o default legado `services`, mas podem descobrir ambas as áreas; domínio nunca concede papel ou autorização. Permitir o mesmo prestador em ambos os domínios exigirá uma relação adicional de perfis profissionais por conta em etapa própria, preservando IDs.

Dependências inspecionadas antes do SQL: `auth.users → profiles → services → requests → proposals/contracts/request_events`; `categories → services`; `action_limits → auth.users`. As cinco migrações existentes permanecem intactas. A nova migração adiciona:

- `profiles.domain`, profissão/especialidade, registro declarado e consentimento de publicação; default seguro `registration_public=false`.
- `services.domain`, índice de catálogo e FK composta `(owner_id, domain) → profiles(user_id, domain)`. Não basta enviar outro domínio no anúncio; API e banco rejeitam a inconsistência. As verificações de papel continuam no servidor.
- `health_professions` e `health_specialties`, com RLS e acesso direto negado a `anon/authenticated`. A FK composta garante que a especialidade pertence à profissão.
- Guardas de formato e de solicitação: anúncios de Saúde não usam preço de orçamento/contratação nem o formulário livre existente de pedidos. O campo estrutural legado `category='outros'` é apenas compatibilidade de armazenamento em Saúde, não categoria ou filtro clínico; `price_type='orcamento'`/valor nulo é sentinela interna, não exibida como oferta de orçamento nessa área.

A taxonomia de Serviços Gerais permanece na tabela `categories`. **Nenhuma profissão/especialidade comercial foi aprovada ou inserida por esta entrega.** A taxonomia de Saúde inicia vazia; testes locais inserem categorias exclusivamente sintéticas. O catálogo vazio é honesto até aprovação e cadastro de ofertas. Não inferir profissão ou domínio por texto livre.

## Contrato da API

| Operação | Contrato |
| --- | --- |
| `GET /catalog` | Mantém default `services`, filtros `category`, cidade normalizada, modalidade e prefixo de título/prestador. Preço continua informativo no anúncio; não se inventa filtro por preço. |
| `GET /catalog?domain=health` | Escopo obrigatório no servidor, profissão/especialidade reais via relação de perfil, cidade, modalidade e prefixo. Categoria de Serviços Gerais é rejeitada. |
| `GET /categories` | Taxonomia legada de Serviços Gerais; domínio health deve usar endpoint próprio. |
| `GET /health-taxonomy` | Slug/rótulo de profissões e especialidades, com profissão vinculada; dados do banco, sem mocks na aplicação. |
| `GET /services/:id` | Link antigo preservado para ambos os domínios. Filtro opcional `domain` rejeita item de outra área (404). |
| `GET /providers/:id` | Link antigo preservado; domínio do próprio perfil e anúncios ativos desse domínio. Filtro opcional `domain` produz 404 se incompatível. Modalidades derivam dos anúncios ativos. |
| `POST /profiles` | Aceita domínio e atributos profissionais. Omissão de domínio conserva clientes legados em `services`; health exige prestador, profissão/especialidade da taxonomia e nenhuma categoria geral. |
| `PATCH /me` | Edita apresentação/atributos próprios sem mudar domínio ou papel. Registro pode ser removido com três campos nulos e publicação false. Nenhum campo de verificação oficial é aceito. |
| `POST /services` | O domínio deve coincidir com o perfil; omissão preserva clientes da API antiga em `services`. Escrita exige conta de prestador e e-mail confirmado. |
| `PATCH /services/:id` | Domínio imutável; mantém verificação de dono e validações do anúncio. |
| `POST /requests` | Continua Serviços Gerais; Saúde retorna `HEALTH_REQUESTS_UNAVAILABLE` (409), reforçado por trigger no banco. |

Consulta de catálogo rejeita domínio inválido, filtros de outro domínio, parâmetros desconhecidos e duplicados. Paginação ordena por data + UUID, aplica sempre o domínio e codifica-o no cursor. Cursores antigos sem domínio continuam válidos somente em Serviços Gerais. Um cursor de Saúde usado em Serviços Gerais (ou vice-versa) é rejeitado. Filtros são aplicados também a cada página, sem mesclar listas.

Respostas públicas usam projeções explícitas. Não retornam e-mail, chave, papel da conta, indicadores privados de publicação, campos de busca internos ou atributos administrativos. O ID público do prestador já faz parte do contrato legado de links. Registro só é projetado quando `registration_public=true`: conselho, número e jurisdição declarados. Essa autorização de exposição não verifica identidade, validade ou habilitação. A interface diz “Registro informado pelo profissional” e informa a ausência de verificação oficial; não há selo nem status oficial gravável pelo cliente.

## Interface e roteamento

`CatalogPage` é reutilizado em `/saude` e `/servicos`, com remount entre domínios para limpar itens/filtros/cursor e evitar respostas anteriores na outra área. Filtros de Saúde consultam `/health-taxonomy`; se a consulta falha, a seleção de taxonomia é desabilitada e há feedback de erro, mantendo busca por nome/cidade/modalidade. Não há resultados fictícios na aplicação.

`/servico/:id` e `/prestador/:id` permanecem canônicos. Perfil Saúde mostra profissão, especialidade, cidade, modalidades das ofertas ativas e registro somente se autorizado. Serviços Gerais preserva apresentação, categoria, cidade/área de atendimento e anúncios com preço/orçamento. Detalhes de Saúde ocultam preço sentinela e o formulário de necessidade livre. Nenhum diagnóstico, sintoma, exame, receita ou prontuário foi adicionado ao modelo.

As taxonomias por slug preparam filtros/categorias futuras, sem criar páginas detalhadas ou rotas vazias. Navegação adicional deverá reutilizar esses filtros e as duas rotas, não criar um site por profissão. Nesta entrega o estado dos filtros fica no catálogo, sem novas URLs de categoria.

Limite de autoria: os formulários existentes de cadastro/publicação continuam destinados a Serviços Gerais. Perfis e ofertas de Saúde podem ser cadastrados pela API autenticada com as validações acima; um formulário profissional completo e aprovação da taxonomia ficam para a próxima etapa. Nenhum cadastro Saúde real foi criado neste trabalho.

## Implantação futura e recuperação (não executadas remotamente)

1. Fazer backup consistente de dados e migrações; testar restauração antes de rollout. Aplicar a migração aditiva antes da API nova, em janela controlada, e ativar frontend depois. Não iniciar frontend novo com backend antigo.
2. O default explícito põe **todos os registros existentes** em `services`, preservando IDs, categorias, cidade, valores, anúncios ativos, pedidos e snapshots. Não apagar colunas nem converter anúncios por título.
3. As novas FKs podem tornar ambígua a relação PostgREST antiga. A API usa o nome explícito `services_owner_domain_fk`; reiniciar/recarregar o cache de esquema PostgREST após a migração.
4. Recuperação preferida: manter a migração aditiva e a API compatível, voltar apenas o frontend Saúde à página informativa e suspender novas publicações Saúde. **Não reverter para a API antiga sem adaptação da relação PostgREST e do escopo do catálogo**, pois ela não filtra domínio.
5. Se houver incidente, exportar perfis/anúncios e seus campos novos, incluindo estado `active`, antes de desativar temporariamente as ofertas Saúde. Não apagar perfis novos, reclassificá-los como Serviços Gerais ou executar `DROP COLUMN` para voltar versão. Restaurar `active` a partir da exportação auditada após correção e reexecutar testes de separação. Uma reversão física do esquema não faz parte desta entrega: exige ferramenta de exportação/reconciliação que preserve todos os cadastros pós-migração.

Os arquivos de migração e scripts não contêm credenciais. Nenhuma migração, reset, publicação ou alteração de segredo é autorizada em Supabase remoto por este PR.

## Validação reproduzível

- `npm ci --cache /tmp/nutri-npm-cache`, `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`.
- Supabase **local**: `npx supabase start`, `npx supabase db reset --local`, `npm run api:serve`; fornecer as variáveis TEST locais pelo processo seguro e executar `npm run test:integration`.
- `node scripts/test-domain-migration.mjs`: cria banco descartável no contêiner local `supabase_db_nutri-med` (ou `NM_LOCAL_DB_CONTAINER`), aplica as cinco migrações anteriores, grava fixtures legadas, aplica a nova e verifica preservação e constraints. Remove somente o banco descartável que criou. Não aceita URL SQL remota.
- `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium SCREENSHOT_OUTPUT_DIR=/tmp/nm-domain-qa node scripts/qa-marketplace.mjs`: smoke de interface, conta sintética e respostas interceptadas. Não é integração de banco.

## Resultados desta execução — 17/11/2026

| Verificação | Resultado real |
| --- | --- |
| `npm ci --cache /tmp/nutri-npm-cache` | Passou, 268 pacotes; manifesto e lockfile preservados. |
| `npm run typecheck` | Passou (exit 0). |
| `npm test` | Passou (exit 0): 9 verificações Node e 67 testes Vitest em 18 arquivos. As 2 integrações são ignoradas nesse comando quando sem variáveis locais; foram executadas separadamente abaixo, sem skips. |
| `npm run lint` | Passou (exit 0). |
| `npm run build` | Passou (exit 0); aviso de bundle de aproximadamente 557 kB minificado, sem alterar o limite para escondê-lo. |
| Migrações na stack Supabase local | As cinco anteriores e `202611170001_marketplace_domains.sql` aplicadas com sucesso na inicialização. Nenhum Supabase remoto acessado. |
| `node scripts/test-domain-migration.mjs` | Passou (exit 0) em banco descartável separado: dados anteriores à migração, preservação de IDs/categorias/preços, defaults e constraints de domínio. Banco descartável removido pelo script. |
| `node --test tests/integration.test.mjs` | Passou (exit 0), **2 testes integrados, 0 skips**, com Auth, PostgREST, PostgreSQL e Edge Function locais reais. É o comando executado por `npm run test:integration`; chaves locais foram lidas da CLI e passadas apenas em memória ao processo, sem logs de valores. |
| `node scripts/qa-marketplace.mjs` | Passou no Chromium em 320, 375, 768, 1024 e 1440 px, visitante/conta sintética, navegação/teclado e overflow. Respostas interceptadas neste smoke de UI; a integração real é a linha anterior. Capturas de Saúde e matriz em `docs/screenshots/domains/`. |
| `git diff --check` | Passou. |

A suíte integrada cobre o fluxo anterior de propostas/contratação, acesso cruzado e bloqueio de leitura direta; a suíte nova insere somente taxonomias/perfis/anúncios sintéticos, pagina ambos os domínios com busca/filtros, verifica cursor antigo e rejeição cruzada, registro privado/público com consentimento, vínculos de domínio, URLs antigas e bloqueio de solicitações Saúde. Os dados sintéticos permanecem somente na stack local desta execução.

### Diagnóstico do ambiente local (resolvido para esta execução)

O primeiro start completo esgotou disco com Docker `vfs`; foram removidas somente imagens opcionais baixadas nesta tarefa e a stack foi reduzida com `-x realtime,storage-api,imgproxy,postgres-meta,studio,logflare,vector,supavisor`. A inicialização ainda demanda imagens de Realtime/Storage para seus schemas, mesmo com esses serviços excluídos. O registro ECR respondeu 403; a CLI usou o espelho GHCR e verificou os downloads.

O Auth respondia 200 pelo gateway, mas o `wget` do health check tentava usar o proxy até para `127.0.0.1`. Na sessão local, o check foi corrigido para `wget -Y off ... http://127.0.0.1:9999/health`; contêiner Auth confirmado saudável. `--ignore-health-check` foi usado somente para reter contêineres durante diagnóstico, **não como evidência de prontidão**.

O Edge Runtime precisava confiar na CA fornecida pelo ambiente. Foi montado o bundle público `/etc/ssl/certs/ca-certificates.crt` como somente leitura no contêiner local e configurados `DENO_TLS_CA_STORE=mozilla,system` e `SSL_CERT_FILE` para esse bundle. A configuração de proxy foi preservada, com exceções adicionais apenas para endereços/aliases internos da stack. O gateway local foi reiniciado para atualizar DNS após recriação dos contêineres. TLS não foi desativado; credenciais existentes foram preservadas, sem substituição. Depois dessas correções, Auth e `/functions/v1/api/health` responderam 200 e ambos os testes integrados passaram.

Esses ajustes são da sessão Docker; não alteram credenciais ou o ambiente publicado. Em outra máquina com proxy corporativo, pode ser necessário configurar novamente a CA e o roteamento interno. Não assumir que processos vivos sobrevivem à restauração.

### Limites e riscos restantes

Taxonomia comercial de Saúde, regiões, critérios profissionais e regras comerciais continuam pendentes. Descoberta não equivale a atendimento, agendamento ou verificação oficial. Autoria de Saúde permanece pela API; não foi inventado formulário clínico. Um perfil profissional por conta/domínio é uma restrição desta etapa. Não houve auditoria completa de acessibilidade ou teste de escala; o aviso do bundle continua. O rollout futuro exige a ordem migração → API compatível → frontend e atenção à relação PostgREST explícita. Manter revisão em rascunho até aprovação técnica e de produto.

A API GitHub (`api.github.com`) ficou bloqueada pelo proxy com 403. Git HTTPS funciona; branch/commits podem ser enviados normalmente. A abertura do PR incremental será repassada ao outro chat conforme orientação do usuário, sem modificar ou integrar #56.
