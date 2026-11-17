# Solicitações e painéis por domínio — entrega incremental

## Base conferida

Branch nova `feat/nm-solicitacoes-paineis-por-dominio`, criada da ponta local/remota limpa `52aa67c0e66c7364c58d9c8f26bc76e598467290`, da branch `feat/nm-catalogo-perfis-por-dominio`. A lista pública do GitHub e refs de PR não mostraram PR dessa etapa anterior; #56 continua aberto na etapa de redefinição (`63ed0ff`). Não houve merge nem alterações nas branches anteriores. A API GitHub continuou bloqueada por HTTP 403; leitura e push Git funcionam.

O contrato de catálogo/perfis está definido em [catálogo por domínio](catalogo-dominios.md) e foi confrontado com tipos, API, migração e testes. A tabela `requests` exige `need` livre com 10–2000 caracteres; a API e o trigger rejeitam Saúde com `HEALTH_REQUESTS_UNAVAILABLE`. Portanto **não existe contrato validado de solicitação administrativa de Saúde** a reutilizar. A edição de profissão/especialidade (`PATCH /me`) e modalidade de anúncio (`PATCH /services/:id`) já existe e foi validada localmente.

## Decisões e comportamento

- Serviços Gerais mantém formulário de orçamento, propostas, aceite, transições, histórico, gerenciamento de anúncios e preços. O painel do cliente explicita que seu histórico é de orçamentos de Serviços Gerais, com link para Saúde.
- Saúde exibe **Solicitar atendimento**, desabilitado, com explicação textual de indisponibilidade e orientação para não enviar dados clínicos. Não existe campo de texto, preferência de horário fictícia, formulário de triagem ou endpoint de envio simulado. Visitante, cliente, prestador e terceiro recebem o mesmo aviso público. Nenhum botão funciona apenas visualmente como se houvesse envio.
- O painel do prestador Saúde tem linguagem e controles profissionais próprios. Carrega `/me`, taxonomia real e ofertas próprias. Permite profissão/especialidade compatíveis e modalidade das ofertas existentes; não exibe preço sentinela, orçamento, propostas ou métricas comerciais fictícias. Seleção de modalidade salva imediatamente e comunica sucesso/erro. Não há agenda, criação de oferta, cobrança ou selo oficial.
- O perfil é lido do servidor a cada montagem; o painel não depende de atributos profissionais desatualizados em cache. Trocas de sessão abortam leituras/escritas em andamento e limpam dados; falhas não confirmam gravações, o formulário permite nova tentativa e não há envio duplicado enquanto ocupado. O foco retorna ao controle após a gravação se tiver sido perdido por desabilitação, sem tomar o foco de quem já navegou para outro elemento.
- Entrada direta nas cinco rotas comerciais de prestador (`novo-servico`, `editar-servico/:id`, `meus-servicos`, `solicitacoes-recebidas`, `propostas`) leva o perfil Saúde ao seu painel. Isso é adequação de UI; segurança continua no servidor. Login e restrições de papel não foram removidos, nem o acesso legítimo de Serviços Gerais alterado. `/pedido/:id` continua sujeito à verificação de vínculo no servidor, preservando histórico.
- Nenhuma migração ou alteração de API foi necessária nesta etapa. Não foi trazida a branch antiga de pagamento simulado; não há tela de pagamento nesta base. Não houve alteração de credenciais ou acesso a Supabase remoto.

## Derivação de domínio e permissões

As ações da UI enviam **somente** `{profession, specialty}` para `/me` e `{modality}` para o anúncio por ID. Nenhuma delas envia `domain`, `kind`, proprietário ou status de verificação. O backend da base carrega o perfil/anúncio pela identidade autenticada, valida papel e propriedade, mantém o domínio imutável e o vínculo por FK composta. A solicitação deriva a área do anúncio consultado no servidor; enviar `domain:'services'` no corpo não transforma anúncio Saúde em orçamento: o campo é rejeitado pela whitelist. Sem o campo, o anúncio Saúde continua bloqueado (409) antes da leitura de necessidade clínica.

Edições de anúncio de terceiros retornam 404 para outro prestador e 403 para cliente; solicitação privada de terceiro retorna 404. Sem sessão, recursos privados continuam retornando 401. O domínio não concede papel ou permissão. Os testes HTTP executam essas verificações contra o Supabase local real.

## Dependência para habilitar envio Saúde

Não ativar `POST /requests` de Serviços Gerais em Saúde para satisfazer visualmente o pedido. Uma etapa futura precisa definir e validar:

1. Entidade/endpoint administrativo com vínculo a cliente, profissional e oferta; domínio sempre derivado no servidor.
2. Campos fechados operacionais aprovados (modalidade e/ou preferência de horário, se suportadas); nenhuma necessidade clínica em texto livre. Disponibilidade e preferência não significam agendamento confirmado.
3. Estados administrativos, permissões de leitura/atualização, retenção, cancelamento e responsáveis; não copiar propostas, preços, aceite comercial ou contratação sem decisão de produto explícita.
4. Testes reais de visitante, cliente, profissional e terceiro, concorrência e histórico administrativo, antes de habilitar o CTA.

**Bloqueado/não executado:** envio e acompanhamento ponta a ponta de Saúde, por ausência desse contrato. Não se trata de teste aprovado nem de teste ignorado que valide a jornada. O MVP não está concluído.

## Validação e reprodução

Comandos de frontend: `npm ci --cache /tmp/nutri-npm-cache`, `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`.

Integração: usar somente Supabase local já preparado, com API em execução, e as variáveis TEST locais do projeto. `npm run test:integration` executa `node --test tests/integration.test.mjs`. Nesta execução as chaves locais foram obtidas pela CLI e passadas ao processo apenas em memória; nenhum valor consta de relatório ou commit. A fixture da cidade foi tornada única por execução para repetir o teste sem apagar registros sintéticos anteriores.

QA: `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/qa-domain-journeys.mjs`. Reutiliza Playwright/Chromium e a convenção dos scripts existentes. Verifica 320, 375, 768, 1024 e 1440 px com visitante, cliente, prestador de Serviços, prestador Saúde e terceiro. Usa contextos isolados, sessão e respostas HTTP sintéticas; **não é teste integrado com banco**. A integração real é reportada separadamente. Capturas/matriz em `docs/screenshots/domain-journeys/`.

## Resultados desta execução — 17/11/2026

| Verificação | Estado | Evidência |
| --- | --- | --- |
| `npm ci --cache /tmp/nutri-npm-cache` | Aprovada | Exit 0, 268 pacotes, manifesto/lockfile intactos. |
| `npm run typecheck` | Aprovada | Exit 0. |
| `npm test` | Aprovada | Exit 0, 78 testes Vitest em 19 arquivos e 9 verificações Node. |
| Integrações dentro de `npm test` | Ignoradas nesse comando | 2 testes, por ausência intencional de variáveis TEST no processo padrão; executados separadamente abaixo. |
| `npm run lint` | Aprovada | Exit 0. |
| `npm run build` | Aprovada com aviso | Exit 0; bundle aproximadamente 563 kB, aviso >500 kB preservado. |
| `node --test tests/integration.test.mjs` (comando de `npm run test:integration`) | Aprovada | 2 testes integrados reais, 0 falhas e 0 skips, na stack local já preparada. |
| QA Chromium | Aprovada no escopo disponível | 25 combinações: cinco larguras × visitante, cliente, prestador Serviços, prestador Saúde e terceiro. Sem overflow horizontal. |
| Envio/acompanhamento administrativo Saúde ponta a ponta | Não executado / bloqueado | Sem contrato e endpoint administrativo suportado. CTA desabilitado para todas as contas; sem formulário clínico. |
| Migração remota, deploy e pagamento | Não executados | Fora do escopo autorizado; nenhuma migração nova necessária. |

Nenhuma falha final permaneceu nos comandos executados. O QA inicial detectou perda de foco após desabilitação temporária de controles durante gravação; a restauração foi movida para depois do commit de renderização e o roteiro completo foi repetido com sucesso. A correção não altera regras de acesso ou transporte.

Os testes integrados exercitam visitante, cliente, prestador e terceiro: orçamento e histórico/versionamento/aceite existentes; acesso cruzado negado; perfil profissional e modalidade sem domínio no corpo; domínio forjado rejeitado; envio Saúde bloqueado a partir do anúncio real mesmo sem `need`; propriedade e papel preservados. Nenhuma gravação real de paciente ou migração remota foi realizada.

No navegador: cliente envia orçamento com confirmação e consulta histórico; modal mantém foco, Escape e retorno; prestador Serviços acessa anúncios/edição existente; prestador Saúde edita especialidade e modalidade; visitante é redirecionado de rota privada; terceiro não vê solicitação privada. Todos veem Saúde sem campo clínico e com envio indisponível. Foco visível e overflow foram verificados em todas as cinco larguras; capturas de painel Saúde e histórico Serviços documentam o resultado. As outras verificações de teclado, contraste e componentes continuam cobertas pela suíte existente; não se declara auditoria WCAG completa.

## Riscos e revisão pendente

A base é uma branch incremental ainda não integrada, não produção. O modelo continua um domínio profissional por conta. A interface de cadastro inicial de ofertas Saúde ainda não existe; este painel edita ofertas existentes. Taxonomia comercial, regiões, critérios profissionais e verificação oficial seguem pendentes. Não interpretar modalidade/preferência como disponibilidade ou agendamento. A configuração de confiança TLS/loopback da stack local foi preparada na etapa anterior e pode precisar ser refeita em outra máquina; não alterar TLS ou credenciais para contornar falhas.

A API GitHub foi bloqueada pelo proxy (403) nesta execução. A tentativa real de `gh pr create --draft` foi recusada com `Post https://api.github.com/graphql: Forbidden`. **O PR não foi criado.** A branch incremental foi enviada por Git; relatório e [texto de abertura](pr-solicitacoes-paineis-dominios.md) ficam versionados para outro chat abrir este mesmo incremento em rascunho, sem duplicar a branch.
