# Landing — Saúde e Serviços Gerais (PR #56 / NM-05)

A Home apresenta duas áreas da mesma aplicação. O card Saúde usa **Encontrar profissional** → `/saude`; Serviços Gerais usa **Encontrar serviço** → `/servicos`. A primeira rota informa a indisponibilidade do catálogo; a segunda preserva o catálogo existente. Nenhuma avaliação, depoimento, quantidade de profissionais ou selo foi acrescentado.

O fluxo “Como funciona”, a entrada de cadastro de prestador e o CTA final são explicitamente de Serviços Gerais. Saúde ainda não oferece orçamento, agendamento ou solicitação de atendimento. Menu e rodapé preservam Saúde, Serviços, Como funciona e os estados visitante/conta autenticada. O menu mobile move o foco ao abrir, fecha por Escape retornando o foco, por acionamento do botão e por navegação.

Preservar tokens, componentes, foco visível e contraste do [design system](design-system.md). A ilustração decorativa apresenta escolha de área, sem sugerir atendimento ou proposta real recebida. A página Saúde não consulta o backend nem apresenta filtros ou resultados simulados.

## Reprodução do QA

Com `npm ci` e `npm run dev` em execução, usar o Chromium disponível:

```bash
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-design-system.mjs
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/qa-marketplace.mjs
```

O segundo script reutiliza a estratégia do script de capturas existente: Playwright, Chromium, variável de URL/base e screenshots. Verifica Home e Saúde em 320, 375, 768, 1024 e 1440 px, menu, teclado, navegação e overflow; salva capturas e resumo em `docs/screenshots/marketplace/`. Dados sintéticos de conta são injetados apenas no contexto isolado do navegador para testar menu autenticado; sem login real ou credenciais de produção. Resultados e limites da execução desta entrega: [QA](qa-marketplace.md).
