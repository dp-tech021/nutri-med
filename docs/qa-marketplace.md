# QA da primeira entrega de Saúde e Serviços Gerais — PR #56

Execução em 17/11/2026, Node 24.22.1, npm 11.9.0 e Chromium local. Base confirmada pela página pública do GitHub: `chore/nm-04-base-frontend` (`a152f03`); PR #56 aberto como rascunho, head inicial `de9a546`. Divergência inicial: 0 commits exclusivos da base e 5 exclusivos do PR. Checkout inicialmente limpo; nenhuma alteração de terceiros foi substituída.

## Comandos e resultados

| Comando | Resultado final |
| --- | --- |
| `npm ci --cache /tmp/nutri-npm-cache` | Passou (exit 0), lockfile preservado. A primeira tentativa de `npm ci` falhou porque o cache padrão em `/home/agent/.npm` não era gravável; resolvido usando cache temporário, sem desativar integridade/TLS. |
| `npm run typecheck` | Passou (exit 0). |
| `npm test` | Passou (exit 0): 6 verificações Node e 63 testes Vitest em 17 arquivos; 1 teste integrado Supabase ignorado por ausência das chaves locais. Nenhum teste removido. |
| `npm run lint` | Passou (exit 0). |
| `npm run build` | Passou (exit 0). Vite avisa sobre bundle de aproximadamente 555 kB minificado; otimização permanece fora deste recorte. |
| `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium SCREENSHOT_OUTPUT_DIR=/tmp/nutri-design-system npm run screenshots:design-system` | Passou (exit 0), script existente executado em 375 e 1440 px; capturas temporárias não sobrescrevem as referências anteriores. |
| `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/qa-marketplace.mjs` | Ver matriz e artefatos abaixo. |
| `git diff --check` | Passou. |

## Matriz de QA no navegador

| Largura | Visitante | Conta sintética | Home / Saúde / catálogo | Teclado e navegação | Overflow horizontal |
| --- | --- | --- | --- | --- | --- |
| 320 px | Verificado | Verificado | Verificados | Verificados | Ausente |
| 375 px | Verificado | Verificado | Verificados | Verificados | Ausente |
| 768 px | Verificado | Verificado | Verificados | Verificados | Ausente |
| 1024 px | Verificado | Verificado | Verificados | Verificados | Ausente |
| 1440 px | Verificado | Verificado | Verificados | Verificados | Ausente |

Automação cobre os CTAs com navegação real, links de Saúde/Serviços/Como funciona, visitante versus Painel da conta, abertura com Enter e com botão, fechamento por Escape/botão/navegação, foco inicial e retorno ao acionador, foco visível com contorno, Home e Saúde sem overflow, catálogo com resposta vazia sintética e ausência de erros JavaScript. A navegação entre páginas sem hash retorna ao topo, preservando o comportamento da âncora Como funciona.

As capturas completas em [screenshots/marketplace](screenshots/marketplace/) documentam hero, quebra de texto, cards, botões, menu e rodapé. Inspeção visual nas cinco larguras; detectados e corrigidos quebra da marca com nome longo no desktop e scroll herdado ao abrir Saúde. Tokens do design system preservados; as combinações críticas de contraste AA passam no teste existente `tests/design-system-contrast.test.mjs`. Isto não é uma auditoria completa WCAG nem teste com leitor de tela.

## Cobertura e limites

- `AppRoutes.test.tsx`: CTAs com MemoryRouter e páginas reais, Saúde sem filtros, catálogo com anúncio sintético legado sem exigir `domain`, e login obrigatório em todas as oito rotas privadas.
- `Layout.test.tsx`: links de ambas as áreas no menu e rodapé, visitante e conta, foco, teclado, Escape e fechamento após navegar.
- Regressões existentes de catálogo (filtros, paginação, deduplicação, vazio, erro e recuperação), autenticação/recuperação, perfis, anúncios e solicitações foram mantidas no conjunto de testes.
- Backend, SQL, migrations, credenciais, lockfile e declarações de dependências não foram alterados. API do navegador foi interceptada com dados exclusivamente sintéticos; não comprova Supabase ou autenticação real.
- Pendente: teste integrado Supabase, e-mail/SMTP, auditoria completa de acessibilidade e testes em outros navegadores. Nenhuma das cinco larguras solicitadas ficou pendente.
- Saúde **não tem catálogo concluído**: sem API de domínio, filtros, profissionais reais, agendamento, verificação oficial ou solicitação de atendimento. Contrato proposto em [visão do produto](visao-produto.md).

## NM-01 e atualização do PR

A NM-01 (#6) foi consultada na página pública e permanece aberta. A API `api.github.com` retorna HTTP 403 no túnel do proxy, bloqueando edição da issue e descrição/comentários do PR. **A issue não foi alterada.** O texto proposto está em [visão do produto](visao-produto.md#texto-proposto-para-a-nm-01) e acompanha o diff deste mesmo PR; manter a issue aberta pelas decisões pendentes. O bloqueio da API não é evidência de falta de acesso Git. Não criar outro PR nem fechar/reabrir este trabalho para contornar o bloqueio.
