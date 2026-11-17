# Homologação integrada — Nutri-Med

> Atualização mais recente: **Hardening pré-integração**, ao final deste documento. As seções anteriores registram a homologação histórica do commit `a143dff`. A adaptação antiga com bundle/entrypoint temporário não é o procedimento desta nova etapa.

Data: 17/11/2026. Escopo: consolidação técnica, testes e documentação; nenhum recurso de produto, pagamento ou upload habilitado.

## Proveniência e ambiente

- Branch exclusiva: `feat/nm-solicitacoes-paineis-por-dominio`.
- SHA inicial: `07cce09e8ffb2b73c4c34fb3ef0b1ed28bb8f0ae`; working tree limpa na abertura.
- SHA final: identificável por `git log -1 --format=%H -- docs/homologacao-integrada.md` após o commit deste relatório. O hash literal é informado no relatório de entrega; um commit não pode conter seu próprio hash sem alterar esse hash.
- Linux x86_64, Node `v24.22.1`, npm `11.9.0`, Supabase CLI `2.122.1`, Docker `29.9.2` rootless, driver `vfs`, Chromium `/usr/bin/chromium`.
- Somente infraestrutura local e fixtures sintéticas. Nenhum banco remoto, dado real ou credencial real utilizado.
- Skill utilizada: `supabase:supabase`. Consulta ao changelog por `curl` retornou HTTP 403. Não foi implementado recurso Supabase novo.

## Comandos e ocorrências do ambiente

Executados a partir da raiz do repositório:

```bash
git fetch origin
git checkout feat/nm-solicitacoes-paineis-por-dominio
git status
git log --oneline -15
git rev-parse HEAD
node --version
npm --version
docker info
npm ci
npm ci --cache /workspace/nutri-med/work/npm-cache
npm run typecheck
npm test
npm run lint
npm run build
```

A primeira instalação falhou com `ENOENT` ao tentar criar `/home/agent/.npm/_cacache`; a segunda, com cache local, instalou 268 pacotes sem alterar o lockfile. A CLI inicialmente falhou com `EROFS` ao criar `/home/agent/.supabase`; `XDG_CONFIG_HOME` não resolveu. Usado o parâmetro suportado `SUPABASE_HOME`, sem alterar `HOME`.

```bash
export SUPABASE_HOME=/workspace/nutri-med/work/supabase-home
node_modules/.bin/supabase --version
node_modules/.bin/supabase start --help
node_modules/.bin/supabase stop --help
node_modules/.bin/supabase db reset --help
node_modules/.bin/supabase status --help
node_modules/.bin/supabase start
```

O registry `public.ecr.aws` respondeu `Forbidden`; a primeira tentativa foi interrompida, e usada a alternativa do registry oficial:

```bash
export SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io
node_modules/.bin/supabase start
```

Depois do download, a stack completa falhou ao criar o container de banco: `ContainerCreateError`, `no space left on device`. O driver Docker `vfs` ampliou o consumo em disco até 100%; não houve migration aplicada nessa tentativa. Foram removidas exclusivamente imagens descartáveis baixadas nesta execução:

```bash
docker image rm supabase/storage-api:v1.84.19 supabase/realtime:v2.147.1 supabase/studio:2026.10.19-sha-b375769 supabase/postgres-meta:v0.100.0 supabase/logflare:1.50.15 timberio/vector:0.58.0-alpine
node_modules/.bin/supabase start -x realtime,storage-api,imgproxy,postgres-meta,studio,logflare,vector,supavisor
```

A CLI ainda baixou imagens para bootstrap interno de schemas mesmo com serviços excluídos. A primeira stack mínima aplicou as sete migrations, mas foi encerrada por `HealthCheckTimeoutError` de Auth: o `wget` interno usou o proxy e recebeu HTTP 403; `GET http://127.0.0.1:54321/auth/v1/health` respondeu 200. A auditoria SQL havia passado (63 constraints, 22 índices e 2 triggers).

Após `supabase stop --no-backup`, a listagem de volumes com label `com.supabase.cli.project=nutri-med` e a de containers ficaram vazias. Para a segunda stack, foi criado somente em `work/docker-config/config.json` um perfil Docker com os proxies de `HTTP_PROXY`/`HTTPS_PROXY` do ambiente e `noProxy` incluindo `127.0.0.1`, `localhost`, `::1`, `db`, `auth`, `rest`, `kong`, `storage`, `realtime`, `meta`, hosts Docker/Supabase e nomes dos containers locais. A correção de `noProxy` não resolveu a sonda: as sete migrations foram aplicadas novamente, mas a CLI encerrou essa tentativa por `HealthCheckTimeoutError` de Auth. Foi necessário iniciar uma nova execução com `--ignore-health-check`; as sondas dos containers continuam ativas, porém não bloqueiam o comando de inicialização. Nenhum controle da API foi desativado. A execução seguinte voltou a inicializar schemas; portanto não se presume preservação de estado após uma inicialização encerrada por erro.

Uma auditoria disparada antes do término desse bootstrap falhou com `relation "public.profiles" does not exist`; trata-se de verificação prematura, mantida no registro, e não de resultado aprovado. A auditoria deve ser repetida após as migrations.

```bash
DOCKER_CONFIG=/workspace/nutri-med/work/docker-config SUPABASE_HOME=/workspace/nutri-med/work/supabase-home SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io node_modules/.bin/supabase start --ignore-health-check -x realtime,storage-api,imgproxy,postgres-meta,studio,logflare,vector,supavisor
```

```bash
DOCKER_CONFIG=/workspace/nutri-med/work/docker-config SUPABASE_HOME=/workspace/nutri-med/work/supabase-home SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io node_modules/.bin/supabase start -x realtime,storage-api,imgproxy,postgres-meta,studio,logflare,vector,supavisor
```

A stack mínima mantém Postgres, Auth, PostgREST, gateway, caixa postal local e Edge Functions. Storage, Realtime e ferramentas administrativas/telemetria não são necessários para os contratos auditados; upload permanece bloqueado.

As saídas de inicialização/status podem conter chaves locais: não são publicadas nem versionadas. Os scripts novos não imprimem credenciais. Não usar `--linked`, URLs de banco remoto, `db push`, deploy ou segredos de produção.

## Migrations e legado

Ordem obrigatória:

1. `202611100001_init.sql`
2. `202611100002_search.sql`
3. `202611100003_categories.sql`
4. `202611100004_limits.sql`
5. `202611100005_request_snapshots.sql`
6. `202611170001_marketplace_domains.sql`
7. `202611170002_initial_health_taxonomy.sql`

`test-domain-migration.mjs` cria um banco isolado com nome aleatório no container local, aplica as cinco migrations antigas, cria prestador/cliente/anúncio/pedido/proposta/contrato/histórico sintéticos e compara os registros completos antes/depois das duas migrations novas. Verifica IDs, valores, categorias, vínculos, snapshots e domínio `services`, FK composta, bloqueio de domínio incompatível e idempotência do seed. O teste passou em duas execuções independentes; também preserva rótulo personalizado ao reaplicar o seed. Esse teste usa um stub mínimo de `auth.users`; a inicialização da stack completa é a verificação complementar com Auth real.

`audit-local-database.mjs` verifica RLS e ausência de SELECT/INSERT/UPDATE/DELETE para `anon`/`authenticated` nas dez tabelas de negócio/taxonomias, e grants das RPCs privilegiadas. Conta constraints, índices e triggers e lista o histórico aplicado. Não recebe URL SQL remota.

## Testes HTTP e autorização

Os testes existentes e `tests/homologation.test.mjs` usam somente `127.0.0.1`/`localhost` HTTP, com chaves carregadas do status local pelo script `run-local-homologation.mjs`. Sem chaves locais, os testes se declaram **ignorados**, não aprovados.

Cenários adicionados:

- Quatro contas sintéticas: cliente, prestador Serviços, prestador Saúde, terceiro. Cadastro via Auth, confirmação administrativa local para teste, login, refresh, logout, ausência de sessão e sessão inválida.
- Tentativa de forjar `kind`, `domain` e `role` em `user_metadata`; o backend deve continuar usando o perfil persistido.
- Whitelists de perfil, anúncio e solicitação: `domain`, `owner_id`, `provider_id`, `client_id`, `kind`, `user_id`, `active`, `price`, `registration_public`, campo desconhecido, conforme endpoint. `active` é legítimo na edição do próprio anúncio; publicação de registro é consentimento legítimo apenas no próprio perfil Saúde, não certificação.
- Registro com tipo inválido e `verificationStatus` forjado, filtros cruzados entre domínios e criação de pedido Saúde.
- Edição de anúncio alheio, leitura/ação em pedido alheio, papel incorreto e domínio incompatível.
- Fluxo Serviços com preço publicado de 12300 centavos, proposta revisada de 28000, versão antiga rejeitada, aceite em paralelo, início/finalização/confirmação e leitura do banco após transições.
- Snapshot permanece com preço/título originais após edição do anúncio; contrato preserva preço/versão da proposta aceita; contrato/evento de aceite únicos.
- Acesso direto às seis tabelas privadas e execução direta da RPC por anon e quatro usuários autenticados.
- CORS permitido, malicioso, sem Origin e OPTIONS; upload continua indisponível.

### Concorrência e limites do contrato

Frontend: `submissionLock` síncrono e estado de envio bloqueiam clique duplo na solicitação; teste de componente existente cobre essa proteção. API: valida sessão, whitelist, papel e limite horário de escrita. Banco: `mutate_request` usa `FOR UPDATE`, valida versão e ator, e `contracts.request_id` é PK; repetição do mesmo aceite é idempotente.

A criação de solicitação não possui chave de idempotência na API/banco. Dois POSTs válidos independentes podem produzir dois IDs. O teste registra essa limitação explicitamente; não foi criada nova semântica de deduplicação nesta consolidação. Perda de resposta seguida de reenvio, outra aba ou chamada HTTP manual continuam sendo riscos. Rate limit não equivale a idempotência.

Logout remove a sessão/refresh do cliente. Tokens de acesso já emitidos podem continuar válidos até expirar; não se declara revogação imediata. Token naturalmente expirado requer evidência separada.

## Frontend, bundle e QA visual

Baseline: typecheck e lint aprovados; 9 testes Node passaram e 3 integrados foram ignorados sem stack; 82 testes Vitest em 19 arquivos passaram. Build aprovado.

Bundle inicial: JS **562,94 kB**, gzip **161,80 kB**; CSS 33,53 kB, gzip 7,36 kB. O aviso de 500 kB permanece. Uma análise Vite com `write:false` e plugin temporário `generateBundle` somou `renderedLength` por pacote (tamanho de módulos antes da minificação, não tamanho final comprimido):

| Grupo | Bytes renderizados |
| --- | ---: |
| React DOM | 653699 |
| Supabase Auth | 411276 |
| Aplicação | 139822 |
| Supabase Storage | 114891 |
| Supabase PostgREST | 112765 |
| Supabase Realtime | 101676 |
| React Router | 85966 |
| Supabase Phoenix | 56053 |
| Supabase client | 38997 |

Rotas são importadas de forma estática, exceto o design system de desenvolvimento. Não houve refatoração de bundle: lazy loading das páginas exigiria verificar novos limites Suspense e jornadas autenticadas. Recomendada otimização futura medida, sem aumentar o limite do aviso nem habilitar upload por causa de Storage estar no pacote.

Scripts existentes reutilizados:

```bash
npm run dev
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium SCREENSHOT_OUTPUT_DIR=work/qa-marketplace node scripts/qa-marketplace.mjs
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium SCREENSHOT_OUTPUT_DIR=work/qa-domains node scripts/qa-domain-journeys.mjs
```

A primeira execução visual atingiu timeout de navegação durante o aquecimento do Vite. Nova execução do mesmo script verifica resultado; não se removeu asserção para passar. Os scripts usam HTTP controlado e sessões sintéticas; não são evidência de Auth/backend real. Larguras: 320, 375, 768, 1024 e 1440 px. Home, menu, catálogos vazios, foco visível, teclado, modal, perfis e painéis são exercitados. Estados de loading/erro e labels também têm testes de componente. Inspeção visual das capturas de Home autenticada a 1440 px, painel Saúde a 320 px e histórico de solicitação a 320 px confirmou layout legível, sem corte aparente nas vistas inspecionadas, com aviso e atendimento Saúde desabilitado. Não se declara conformidade WCAG completa.

## Dados clínicos, segredos e limites preservados

Busca `rg` por sintomas, diagnóstico, exames, medicamentos, doenças, prontuário e histórico médico: duas ocorrências em componentes de Saúde, ambas avisos de não enviar informação clínica. O campo livre de necessidade pertence exclusivamente ao formulário de Serviços; Saúde usa `HealthRequestNotice`, sem formulário clínico. Há campos profissionais públicos de apresentação/registro, não prontuário.

Busca nos arquivos versionados por chaves privadas, JWTs completos, tokens de provedor e URLs com credencial não encontrou candidatos de alta confiança. A revisão das menções de `service_role`, token, password e API key identificou referências de configuração, código e fixtures sintéticas; nenhum segredo real identificado. Isso não garante ausência universal de segredos nem substitui rotação/análise histórica. Valores não publicados. Busca adicional em `src` não encontrou `dangerouslySetInnerHTML`, `eval`, `innerHTML`, `document.write` ou chave server-side; isso é revisão estática focada, não auditoria completa de segurança frontend.

Upload conserva `UPLOAD_DISABLED_PENDING_VALIDATION`. Pagamento permanece fora do escopo: nenhuma integração da branch de pagamento, gateway, split, cobrança ou tabela financeira modificada.

## Resultado consolidado

As sete migrations foram aplicadas em ordem em **duas instalações limpas**, com `public` inicialmente sem tabelas; houve ainda uma terceira aplicação durante a recuperação da stack após o encerramento por healthcheck. Os logs mostram todas as versões aplicadas sem erro SQL. As duas auditorias completas passaram, ambas com **63 constraints, 22 índices e 2 triggers**, além dos grants/RLS/RPCs verificados. O teste de legado passou em três bancos isolados, incluindo um criado na segunda instalação limpa. Nenhuma migration de produto precisou ser alterada.

A primeira execução HTTP falhou: quatro testes com HTTP 503 `BOOT_ERROR`, por falha de DNS do container Edge ao carregar o SDK npm. Um import map local (caminho relativo e absoluto) não resolveu essa carga. A solução restrita à homologação foi compilar a API original com o SDK **2.119.0 do lockfile**, em bundle temporário, e apontar temporariamente `functions.api.entrypoint` para ele. As regras de negócio, validação de token, whitelist, SQL e CORS da API foram mantidas. **Não se trata de mock HTTP ou banco simulado**: chamadas foram atendidas por Edge Functions, Auth e Postgres locais reais. A execução do entrypoint original com resolução npm online permanece não validada neste ambiente.

Com o bundle, os três testes integrados preexistentes passaram. O quarto teste encontrou um defeito real de configuração: o plugin CORS padrão do Kong local sobrescrevia a origem com `*`. Foi adicionado `scripts/configure-local-cors.py`, aplicado ao gateway local e reexecutado para verificar a repetibilidade. Ele muda somente o plugin de `functions-v1`, restringe duas origens locais, mantém métodos/headers explícitos e delega preflight à API. Em caso de erro de reload, restaura a configuração anterior. Requer **PyYAML 6.0.3** e Docker; não imprime configuração, JWT, senha ou chave. A primeira gravação sem usuário root do container foi negada; o script usa UID 0 somente para escrever esse arquivo de configuração local, sem alterar usuário da API ou permissões de banco.

Após a correção, **4/4 testes integrados passaram, zero skips**, incluindo chamadas autenticadas com Origin permitido (200, origem explícita) e malicioso (403, sem ACAO). A suíte completa também foi executada com chaves locais: **13/13 testes Node + 82/82 testes Vitest, total 95 aprovados, zero falhas e zero skips**. A execução Vitest durou 43,67 s. Typecheck e build passaram; o bundle final manteve os mesmos tamanhos e hashes da baseline.

### Reprodução da adaptação local

Depois de iniciar a stack, caso o container não consiga acessar npm, gerar os artefatos temporários:

```bash
node --input-type=module <<'JS'
import {build} from 'esbuild';
import {readFileSync,writeFileSync} from 'node:fs';
await build({entryPoints:['node_modules/@supabase/supabase-js/dist/index.mjs'],bundle:true,platform:'browser',format:'esm',target:'es2022',outfile:'work/supabase-sdk.mjs'});
await build({entryPoints:['supabase/functions/api/index.ts'],bundle:true,platform:'neutral',format:'esm',target:'es2022',outfile:'work/api-bundle.ts',plugins:[{name:'local-locked-sdk',setup(b){b.onResolve({filter:/^npm:@supabase\/supabase-js@2$/},()=>({path:'/workspace/nutri-med/work/supabase-sdk.mjs'}));}}]});
const config=readFileSync('supabase/config.toml','utf8');
writeFileSync('work/config-original.toml',config);
writeFileSync('supabase/config.toml',config+'entrypoint = "../work/api-bundle.ts"\n');
JS
DOCKER_CONFIG=/workspace/nutri-med/work/docker-config SUPABASE_HOME=/workspace/nutri-med/work/supabase-home node_modules/.bin/supabase functions serve api --no-verify-jwt
```

`verify_jwt=false` já é o contrato da função no repositório: a API valida cada token privado via Auth; a opção não remove esse controle. A configuração temporária deve ser restaurada ao encerrar. O import map malsucedido e bundles ficaram somente em `work/`, fora do commit.

Com os serviços prontos:

```bash
node scripts/test-domain-migration.mjs
node scripts/audit-local-database.mjs
python scripts/configure-local-cors.py
SUPABASE_HOME=/workspace/nutri-med/work/supabase-home node scripts/run-local-homologation.mjs
SUPABASE_HOME=/workspace/nutri-med/work/supabase-home node scripts/run-local-homologation.mjs --all
npm run lint
npm run typecheck
npm run build
git diff --check
```

O modo `--all` executa `npm test` com as chaves locais apenas no ambiente do processo filho. O runner exige URL HTTP de loopback e não imprime as chaves. O caminho sem `--all` executa os quatro testes HTTP integrados.

### Evidências HTTP e banco

| Cenário | HTTP / evidência | Estado |
| --- | --- | --- |
| Cadastro de quatro papéis/domínios sintéticos, login e refresh | Perfis 201; sessões Auth válidas | APROVADO |
| Sem sessão / sessão inválida / token expirado | 401; token expirado testado com controle de assinatura local válido aceito previamente | APROVADO |
| Logout / refresh depois do logout | Sessão removida; refresh sem sessão rejeitado; JWT emitido pode durar até expiração | APROVADO COM RESSALVA |
| Papel cliente criando anúncio; papel forjado em user_metadata | 403 | APROVADO |
| Editar anúncio de outro prestador | 404; cliente tentando editar recebe 403 | APROVADO |
| Ler ou agir em pedido alheio | 404 | APROVADO |
| Campos desconhecidos e IDs/papel/domínio injetados em payloads | 400, conforme whitelist de cada endpoint | APROVADO |
| Domínio incompatível / registro forjado / filtros cruzados | 400; status de verificação não é gravável | APROVADO |
| Pedido Saúde com ID real da oferta | 409, inclusive sem campo livre clínico | APROVADO |
| Proposta antiga | 409 | APROVADO |
| Aceite por prestador | 403 | APROVADO |
| Dois aceites simultâneos da versão atual | 200 + 200; um contrato e um evento de aceite no banco | APROVADO |
| Início → finalização → confirmação | 200 por transição; banco confirma estados e versão 2 | APROVADO |
| Snapshot / preço / histórico | Snapshot 12300 centavos preservado após anúncio mudar para 50000; contrato 28000; duas propostas; sete eventos | APROVADO |
| Dois POSTs independentes de solicitação | 201 + 201, IDs distintos; proteção de clique duplo somente no frontend | APROVADO COM RESSALVA |
| Leitura direta das seis tabelas privadas | anon 401; quatro contas authenticated 403; RPC direta negada | APROVADO |
| CORS autorizado / malicioso / sem Origin | 200 com origem explícita / 403 sem ACAO / 200 | APROVADO COM RESSALVA |
| Preflight autorizado e malicioso | OPTIONS 204; ACAO somente na origem permitida | APROVADO COM RESSALVA |
| Upload | 501, bloqueio mantido | APROVADO |

### Contas sintéticas

Uma execução bem-sucedida utilizou as contas abaixo, todas `example.invalid`. Os testes completos geram outra família aleatória equivalente. Não há senhas neste relatório.

| Papel | Conta |
| --- | --- |
| Cliente | homolog-3f9df98d-a3c3-4578-8228-18511a9a0ac6-cliente@example.invalid |
| Prestador Serviços | homolog-a75f9ea6-877b-47b9-a1df-ec7cb03e9d4c-servicos@example.invalid |
| Prestador Saúde | homolog-7f223db5-02ca-478c-9b81-2103ef6523b8-saude@example.invalid |
| Terceiro | homolog-6360baf8-92fd-4c8a-8743-fec115a7a9b7-terceiro@example.invalid |

### Classificação por área

| Item | Estado | Limite / evidência |
| --- | --- | --- |
| Migrations | APROVADO COM RESSALVA | Duas instalações limpas, legado preservado e auditorias aprovadas; healthcheck da stack exige adaptação neste host |
| Auth | APROVADO COM RESSALVA | Cadastro/login/refresh/logout e token expirado reais; JWT não tem revogação imediata garantida |
| Catálogo Serviços | APROVADO | Publicação, preço, categorias, busca, paginação e isolamento |
| Catálogo Saúde | APROVADO | Profissão/especialidade/cidade/modalidade, filtros e paginação próprios |
| Perfis | APROVADO | Projeção pública, registro consentido e linguagem de não verificação |
| RLS e grants | APROVADO | SQL e chamadas diretas REST/RPC, anon e authenticated |
| Autorização | APROVADO | Papel persistido, domínio, propriedade e terceiro no backend |
| Solicitações | APROVADO COM RESSALVA | Fluxo Serviços real e clique duplo bloqueado; sem idempotência HTTP de criação |
| Propostas | APROVADO | Versões, preço e bloqueio de revisão após aceite |
| Aceite | APROVADO | Atômico, versão antiga rejeitada e contrato único |
| Concorrência | APROVADO COM RESSALVA | Aceites paralelos verificados; criação de solicitação não é idempotente; sem teste de carga |
| Conclusão | APROVADO | Banco confirma início/finalização/confirmação e histórico |
| Painel Serviços | APROVADO COM RESSALVA | Componentes e QA com respostas controladas; jornada comercial real testada por HTTP |
| Painel Saúde | APROVADO COM RESSALVA | Perfil/modalidade, sem propostas/preço/campo clínico; atendimento segue indisponível |
| Responsividade | APROVADO COM RESSALVA | 35 combinações nas cinco larguras; sem overflow; inspeção visual amostral |
| Segurança frontend | APROVADO COM RESSALVA | Guards/redirects/sessão/duplo envio e busca de sinks; sem auditoria externa completa |
| CORS | APROVADO COM RESSALVA | Corrigido e testado no gateway local; aplicar a política na infraestrutura de destino |
| Dados clínicos | APROVADO | Avisos, nenhum campo clínico Saúde e POST bloqueado em API/banco |
| Upload | APROVADO | Bloqueio 501 preservado; upload funcional NÃO TESTADO |
| Pagamento | NÃO TESTADO | Fora do escopo; nenhuma integração, cobrança ou tabela financeira alterada |
| Bundle | APROVADO COM RESSALVA | Build passa; 562,94 kB JS, aviso mantido e responsáveis medidos |

### Riscos restantes e cenários não testados

- A configuração padrão do gateway local tinha wildcard. O novo script precisa ser aplicado após recriar a stack. Infraestrutura gerenciada/produção não foi acessada ou alterada; sua política CORS deve ser configurada e validada antes de publicar.
- O entrypoint original com resolução npm online não pôde ser homologado neste host; testes integrados usaram bundle temporário da mesma API com SDK do lockfile. O import server-side original usa faixa `@2`, e não versão exata; resolução/empacotamento do ambiente de destino precisa ser reproduzível.
- Healthcheck Auth por `wget` permaneceu unhealthy neste host, apesar de Auth responder e passar os fluxos reais. O gate da CLI foi ignorado explicitamente; não há evidência de stack padrão integralmente healthy.
- Sem teste de carga, múltiplas instâncias distribuídas, rede móvel, outros browsers, recuperação de desastre ou auditoria WCAG completa. Loading/erros têm testes de componente; QA visual usa respostas controladas, não substitui teste manual integral com backend em todos os viewports.
- Solicitações não possuem idempotência de criação no servidor; perda de resposta e reenvio podem duplicar pedidos. Contratos não duplicaram sob aceite concorrente.
- Logout não implica invalidação imediata de JWTs já emitidos. Os limites horários existentes não são defesa completa contra abuso; limpeza de janelas antigas continua prevista fora desta entrega.
- Aviso de bundle permanece. Upload funcional, pagamento e operação clínica não foram habilitados nem homologados.

**Recomendação: APTO PARA PREPARAR INTEGRAÇÃO**, dentro dos contratos atuais e com as ressalvas acima. A recomendação limita-se à preparação da revisão técnica. Publicação em produção, atendimento Saúde, upload e pagamento não estão homologados por esta entrega. A configuração CORS e a execução do entrypoint padrão devem ser verificadas na infraestrutura de destino antes de publicação.

Nenhum PR foi criado.
Nenhum merge foi realizado.
A main não foi alterada.


## Encerramento e arquivos

O `supabase/config.toml` temporário foi restaurado byte a byte a partir da cópia original, sem alteração final na configuração versionada. Bundles e logs temporários foram retirados da árvore do repositório antes do lint de entrega. Uma execução intermediária de lint apontou erros no código gerado desses bundles em `work/`; a solução foi retirar os artefatos, sem mudar regras, desativar lint ou ignorar código do projeto. Os serviços locais e fixtures sintéticas foram descartados ao encerrar.

Arquivos desta entrega: relatório, teste integrado de homologação, teste de legado ampliado, auditoria SQL local, runner local sem exposição de chaves e correção CORS do gateway local. Nenhum arquivo de frontend, migration de produto, contrato de pagamento ou controle de upload foi alterado.

Comandos finais:

```bash
SUPABASE_HOME=/workspace/nutri-med/work/supabase-home node_modules/.bin/supabase stop --no-backup
npm run typecheck
npm run lint
npm run build
git diff --check
git status
git add docs/homologacao-integrada.md scripts/test-domain-migration.mjs scripts/audit-local-database.mjs scripts/run-local-homologation.mjs scripts/configure-local-cors.py tests/homologation.test.mjs
git commit -m "test: consolidar homologacao integrada do marketplace"
git push origin feat/nm-solicitacoes-paineis-por-dominio
```


## Hardening pré-integração

### Escopo e proveniência

- Branch: `feat/nm-solicitacoes-paineis-por-dominio`.
- SHA inicial desta etapa: `a143dffa1f3c2c592096cbd46e1509105ea99cf9`, working tree limpa.
- SHA final: commit que contém esta seção, resolvido por `git log -1 --format=%H -- docs/homologacao-integrada.md`; hash literal entregue no relatório final do chat.
- Mesmo ambiente Linux/Node 24.22.1/npm 11.9.0/Supabase CLI 2.122.1/Docker rootless descrito acima. Ferramenta adicional de preparação de cache: Deno **2.1.4**, a mesma versão anunciada pelo Edge Runtime local 1.77.8.
- Nenhum bundle temporário, import map alternativo, rewrite de `config.toml` ou entrypoint alternativo foi usado nesta etapa. `supabase/config.toml` permaneceu byte a byte igual ao SHA inicial.
- Nenhum dado real foi lido ou alterado. No remoto, foi feita somente leitura de catálogos PostgreSQL para confirmar assinatura, definição, grants e vínculo de event trigger. Não houve DDL/DML, aplicação de migration, deploy ou leitura de tabelas de usuários no remoto.

### Dependência fixa e entrypoint original

O import da API agora é:

```ts
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
```

A versão exata é a mesma de `package.json` e `package-lock.json`. Foi mantido o import npm direto suportado pelo runtime; não há razão para introduzir outro mapeamento para fixar uma única dependência. Um teste de contrato compara os três arquivos e rejeita versões flutuantes/divergentes. O package.json/lockfile não precisaram ser alterados.

Primeira tentativa sem cache: o entrypoint original retornou **HTTP 503 BOOT_ERROR**; o worker não conseguiu resolver o registry npm. Isso é falha ambiental de DNS, não falha de autorização/negócio. A preparação de cache no host encontrou inicialmente `UnknownIssuer` no Deno, que usa uma trust store diferente da do sistema. Usar `DENO_TLS_CA_STORE=system` corrigiu a validação com as CAs confiáveis do ambiente; TLS não foi desabilitado.

Foi usado o comando padrão **`deno cache`**, sem executar a aplicação, para baixar os pacotes npm oficiais e suas dependências. Somente o cache npm foi copiado para o volume de cache do runtime local. Isso não gera bundle, não altera imports e não substitui o entrypoint. Os arquivos TypeScript originais foram carregados pelo Edge Runtime, que respondeu **HTTP 200 `{ "ok": true }`** e passou a homologação HTTP inteira.

A configuração efetiva do container foi conferida:

```json
{"api":{"verifyJWT":false,"entrypointPath":"supabase/functions/api/index.ts"}}
```

Não havia `importMapPath` ou entrypoint alternativo. A função também foi executada por `supabase functions serve api --no-verify-jwt --env-file ...`, com o mesmo entrypoint original e cache npm. `verify_jwt=false` é o contrato preexistente: a própria API continua validando tokens de chamadas privadas via Auth.

Comandos de reprodução desta preparação, fora da árvore versionada:

```bash
mkdir -p /workspace/work/nutri-med-hardening/deno-cli
npm pack @deno/linux-x64-glibc@2.1.4 --pack-destination /workspace/work/nutri-med-hardening --cache /workspace/work/nutri-med-homologacao-20261117/npm-cache
tar -xzf /workspace/work/nutri-med-hardening/deno-linux-x64-glibc-2.1.4.tgz -C /workspace/work/nutri-med-hardening/deno-cli
DENO_TLS_CA_STORE=system DENO_DIR=/workspace/work/nutri-med-hardening/deno-cache /workspace/work/nutri-med-hardening/deno-cli/package/deno cache --no-config --no-lock --node-modules-dir=none supabase/functions/api/index.ts
docker cp /workspace/work/nutri-med-hardening/deno-cache/npm/. supabase_edge_runtime_nutri-med:/root/.cache/deno/npm
```

Em ambientes com rede/CA corretas, o runtime pode baixar esses pacotes normalmente. O cache é uma adaptação ambiental, não dependência de produção ou evidência de resolução npm sem rede. O cache contém os pacotes SDK Supabase 2.119.0; não contém chaves, substitutos de Auth/banco nem código de negócio reescrito.

### CORS: função como fonte de verdade

`ALLOWED_ORIGINS` da Edge Function continua sendo a única allowlist. A API devolve origem explícita para origem permitida, HTTP 403 para origem não permitida e nunca `*` nas respostas autenticadas verificadas.

O script `scripts/configure-local-cors.py` foi ajustado para **remover somente o plugin CORS de `functions-v1` do Kong local**, preservando os outros plugins. Assim o gateway deixa de sobrescrever os headers e encaminha OPTIONS e as decisões à função. Não existe mais uma segunda lista fixa de origens no Python. Aplicação repetida do script foi verificada.

> Este script não é requisito de produção e não substitui a política CORS da Edge Function.

Python/PyYAML são ferramentas opcionais de adaptação da stack local, não dependências de produção. Nenhuma dependência Python foi adicionada ao aplicativo. Em ambiente gerenciado, configurar `ALLOWED_ORIGINS` na função e verificar o comportamento efetivo sem presumir que um ajuste no Kong local configura a infraestrutura gerenciada.

Evidência adicional: a função foi servida com um arquivo de ambiente local contendo as duas origens locais e `https://qa.nutri-med.invalid`. Essa terceira origem recebeu **HTTP 200** e `Access-Control-Allow-Origin: https://qa.nutri-med.invalid` sem alterar qualquer lista do gateway. A homologação verificou também `/me` autenticado com origem permitida (200, origem explícita), origem maliciosa (403, sem ACAO), ausência de Origin e preflight OPTIONS.

### Migration preparada: rls_auto_enable

A leitura dos catálogos do projeto remoto confirmou:

- Assinatura exata: `public.rls_auto_enable()` sem argumentos, retorno `event_trigger`.
- Proprietário `postgres`, `SECURITY DEFINER`, `search_path=pg_catalog`.
- ACL com EXECUTE para `PUBLIC`, `anon`, `authenticated` e `service_role`.
- Event trigger `ensure_rls`, habilitado (`O`), em `ddl_command_end`, para `CREATE TABLE`, `CREATE TABLE AS` e `SELECT INTO`.
- O corpo usa `pg_event_trigger_ddl_commands()` e identificadores escapados para habilitar RLS em tabelas de `public`. Trata-se de callback administrativo de DDL, não de endpoint de negócio. Funções de event trigger não são funções RPC comuns; não se afirma exploração arbitrária por SELECT. A revogação elimina a permissão desnecessária e atende à recomendação do Advisor sem remover o mecanismo administrativo.

A migration foi criada pela CLI, antes de editar o SQL:

```bash
SUPABASE_HOME=/workspace/work/nutri-med-hardening/supabase-home node_modules/.bin/supabase migration new revoke_rls_auto_enable_public_execute
```

Arquivo: **`supabase/migrations/20261117162451_revoke_rls_auto_enable_public_execute.sql`**.

A migration revoga EXECUTE de `PUBLIC`, `anon` e `authenticated`. Não apaga/recria a função, não modifica `SECURITY DEFINER`, `search_path`, corpo ou event trigger, e mantém direitos do proprietário/service_role. Como a função administrativa não é criada pelas migrations do produto e pode não existir numa stack limpa, sua ausência é um no-op explícito. Se a assinatura sem argumentos existir com tipo de retorno inesperado, a migration falha e exige revisão, em vez de alterar outro contrato silenciosamente.

**Não foi aplicada remotamente.** Portanto, os grants inseguros observados no remoto permanecem até uma aplicação futura, separadamente autorizada. Esta entrega prepara e verifica a correção, não declara o remoto corrigido.

### Validação local da migration

O novo `scripts/test-security-migration.mjs` cria e destrói um banco isolado no container local. Ele:

1. Aplica as oito migrations num banco vazio, cobrindo a ausência da função administrativa sem inventá-la na migration de produto.
2. Instala uma fixture sintética em `tests/fixtures/rls-auto-enable.sql`, reproduzindo a definição administrativa inspecionada e os grants indevidos, com `ensure_rls`.
3. Verifica que `anon` e `authenticated` possuem EXECUTE antes da correção.
4. Aplica a migration e a reaplica para verificar idempotência.
5. Confirma `has_function_privilege(..., 'EXECUTE') = false` para ambos os roles e ausência de EXECUTE para grantee PUBLIC nas ACLs.
6. Compara OIDs, definição, `SECURITY DEFINER`, configuração e event trigger antes/depois, sem diferença.
7. Cria tabelas pelas três formas de DDL e confirma RLS habilitado em todas; `ensure_rls` permanece habilitado.
8. Exercita o caso de tipo de retorno inesperado, que é rejeitado; esse banco de teste é destruído ao final.

Também foi reproduzido o helper **somente na stack local**, seguido da revogação na mesma transação, para a auditoria completa inventariar e verificar a função. Uma tabela sintética de prova recebeu RLS automaticamente e foi removida. A fixture não faz parte das migrations de produção.

Resultado: **APROVADO**. Não houve chamada administrativa de teste no remoto.

### Auditoria SECURITY DEFINER

A busca nas migrations encontrou três funções de negócio explicitamente SECURITY DEFINER. Todas em `public`, proprietário local `postgres`, `search_path=''`, EXECUTE negado a `PUBLIC`/`anon`/`authenticated`:

| Função | Finalidade e avaliação | Decisão |
| --- | --- | --- |
| `mutate_request(uuid,uuid,text,integer,integer,integer,text)` | RPC atômica, locks, versão, ator e histórico; só service_role a chama após autenticação na API. Sob os grants atuais de service_role, que já tem acesso às tabelas e bypass de RLS, a elevação não é estritamente necessária para essa identidade; mudar para INVOKER exige revisão explícita de contrato/permissões. | Preservada, sem alteração por heurística; superfície pública fechada. |
| `consume_action_limit(uuid,text,integer)` | RPC transacional de limite de escrita, também restrita a service_role. Mesma avaliação: service_role já possui privilégios; necessidade de elevação para esse único chamador não foi demonstrada. | Preservada; nenhuma ampliação de grants. |
| `log_request_creation()` | Trigger que grava o evento inicial na transação do pedido. Atua com privilégios do proprietário; no fluxo atual a escrita vem de service_role, mas retirar DEFINER muda a semântica de qualquer outro chamador autorizado futuro. | Preservada; EXECUTE direto não é necessário e já estava revogado. |
| `rls_auto_enable()` | Callback administrativo de DDL, `search_path=pg_catalog`, proprietário postgres. Elevação é usada pelo desenho administrativo para executar ALTER TABLE no contexto do proprietário. | Apenas EXECUTE público revogado; corpo, elevação e trigger preservados. |

Não se confunde SECURITY DEFINER com vulnerabilidade automática. O endurecimento cobre a permissão indevida identificada; redesenhar RPCs para INVOKER não foi necessário para corrigir essa exposição.

Inventário adicional do schema local fornecido pela plataforma:

| Função | search_path / grants observados | Avaliação |
| --- | --- | --- |
| `pgbouncer.get_auth(text)` | Vazio; PUBLIC/anon/authenticated sem EXECUTE e sem USAGE no schema | Helper de autenticação do pool, proprietário supabase_admin; preservado. |
| `vault.create_secret(text,text,text,uuid)` | Vazio; PUBLIC/anon/authenticated sem EXECUTE e sem USAGE | Operação privilegiada do Vault, proprietário supabase_admin; preservada. |
| `vault.update_secret(uuid,text,text,text,uuid)` | Vazio; mesmos bloqueios | Operação privilegiada do Vault; preservada. |
| `supabase_functions.http_request()` | `supabase_functions`; PUBLIC sem EXECUTE, anon/authenticated com EXECUTE/USAGE | Trigger de webhooks da plataforma, retorna `trigger`, proprietário supabase_functions_admin. Schema não exposto pela API configurada; anon/authenticated não têm CREATE nesse schema nem TRIGGER nas tabelas privadas verificadas. Não é RPC comum; não foi alterado por heurística. |

O `audit-local-database.mjs` agora também verifica todas as funções SECURITY DEFINER de `public`, além de tabelas/RLS/grants. Na stack local com fixture administrativa, as quatro funções passaram. Foi executado:

```bash
SUPABASE_HOME=/workspace/work/nutri-med-hardening/supabase-home node_modules/.bin/supabase db advisors --local --type security --fail-on none
```

O Advisor local apontou somente **WARN `extension_in_public` para `unaccent`**, preexistente. Não houve alerta de execução pública de SECURITY DEFINER. Mover essa extensão e revisar dependências fica fora desta correção; não foi alterada por heurística. Os quatro helpers internos foram inventariados, não se declara auditoria completa de todas as implementações internas da plataforma.

### Reexecução da homologação

Comandos usados nesta etapa:

```bash
npm ci --cache /workspace/work/nutri-med-homologacao-20261117/npm-cache
npm run typecheck
npm test
npm run lint
npm run build
SUPABASE_HOME=/workspace/work/nutri-med-hardening/supabase-home SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io DOCKER_CONFIG=/workspace/work/nutri-med-homologacao-20261117/docker-config node_modules/.bin/supabase start --ignore-health-check -x realtime,storage-api,imgproxy,postgres-meta,studio,logflare,vector,supavisor
node scripts/test-security-migration.mjs
node scripts/test-domain-migration.mjs
node scripts/audit-local-database.mjs
python scripts/configure-local-cors.py
DOCKER_CONFIG=/workspace/work/nutri-med-homologacao-20261117/docker-config SUPABASE_HOME=/workspace/work/nutri-med-hardening/supabase-home node_modules/.bin/supabase functions serve api --no-verify-jwt --env-file /workspace/work/nutri-med-hardening/api-local.env
SUPABASE_HOME=/workspace/work/nutri-med-hardening/supabase-home node scripts/run-local-homologation.mjs
SUPABASE_HOME=/workspace/work/nutri-med-hardening/supabase-home node scripts/run-local-homologation.mjs --all
SUPABASE_HOME=/workspace/work/nutri-med-hardening/supabase-home node_modules/.bin/supabase migration list --local
git diff --check
```

O arquivo de ambiente sintético usado em functions serve continha apenas `ALLOWED_ORIGINS` com as três origens citadas; nenhuma senha/chave foi incluída nele. A CLI anunciou o entrypoint original e o cache npm persistente permitiu executá-lo novamente após recriar o container Edge para functions serve.

Resultados finais:

- **Oito migrations** aplicadas do zero, sem falha SQL, e listadas com `--local` (o campo `remote` da saída desse comando representa a comparação com o banco **local**, não acesso ao projeto gerenciado).
- Teste isolado de migration de segurança aprovado nos casos presente/ausente, repetição e tipo inesperado; trigger preservado e funcional.
- Legado preservado após as oito migrations; nenhuma redução de cobertura.
- Auditoria SQL aprovada: dez tabelas de negócio/taxonomias, RLS, DML direto bloqueado e RPCs restritas; quatro funções SECURITY DEFINER públicas com fixture administrativa sem grants indevidos.
- Homologação HTTP pelo **entrypoint original**: quatro testes integrados aprovados, zero skips.
- Suíte completa com chaves locais: **14 testes Node + 82 testes de interface = 96 aprovados**, zero falhas, zero skips. Vitest: 19 arquivos, 35,26 s.
- `npm ci`, typecheck, lint e build aprovados. Nenhum teste removido, nenhum `any`/`@ts-ignore` ou desativação de lint introduzido. Bundle permanece 562,94 kB / 161,80 kB gzip, sem refatoração de produto.

### Classificação final desta etapa

| Item | Estado | Evidência / limite |
| --- | --- | --- |
| Edge Function | **APROVADO** | Entrypoint original, SDK exato, CLI padrão, HTTP e fluxo completo sem bundle/reescrita. Cache npm preparado no host foi necessário por DNS/CA do ambiente. |
| CORS | **APROVADO** | API rejeita origem maliciosa com 403 e sem ACAO; origem autorizada explícita, inclusive origem adicional só em ALLOWED_ORIGINS; preflight e chamadas autenticadas verificados. |
| SECURITY DEFINER | **APROVADO** | Migration local remove EXECUTE indevido e preserva ensure_rls e a habilitação automática de RLS. Remoto ainda não foi corrigido, conforme proibição desta tarefa. |
| Migrations / legado | **APROVADO** | Oito migrations limpas; fixture presente/ausente e dados legados preservados. |
| Auth / RLS / grants | **APROVADO COM RESSALVA** | Fluxos e ataques locais aprovados; limitações históricas de JWT/logout e healthcheck ambiental permanecem. |

**Recomendação: APTO PARA INTEGRAÇÃO**, quanto ao código e à correção preparada/testada nesta branch. Isso não declara a infraestrutura remota corrigida nem autoriza aplicar a migration ou fazer deploy. A aplicação remota precisa de etapa separada autorizada; até lá, a permissão EXECUTE indevida observada no remoto permanece.

Riscos restantes: resolução de dependências exige rede/CA válidas ou cache npm legítimo; o healthcheck Auth do host ainda depende de adaptação ambiental; o Advisor local mantém WARN de unaccent; idempotência de criação de solicitações no servidor, expiração/revogação de JWTs e tamanho de bundle continuam como no relatório anterior. CORS em ambiente gerenciado não foi exercitado remotamente. Upload, pagamento e atendimento Saúde permanecem bloqueados/fora de escopo.

Nenhum PR foi criado.
Nenhum merge foi realizado.
A main não foi alterada.
Nenhuma alteração foi aplicada ao Supabase remoto.
