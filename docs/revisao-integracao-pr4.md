# Revisão de integração do PR #4 — 10/11/2026

**Status:** branch de integração para revisão, não produção. NÃO realizar merge ou deploy sem QA e aprovação.

## Proveniência preservada

- PR de origem: https://github.com/dp-tech021/nutri-med/pull/4
- Head original: `27e1e8ade20fd10cee4f239431e36f53839a7059`.
- Main tomada como base: `cdc4bf792c188ec886ffdcd3dbcd47b4935ec170` (README e backlog integrados pelo PR #38).
- Esta branch contém os **21 arquivos técnicos não-README** do PR #4 sem alteração, mais o texto original do README em [guia-original-pr4.md](guia-original-pr4.md).
- O README principal permanece **idêntico ao README da main** para não apagar backlog, responsáveis, produto e decisões pendentes.
- A branch original do PR #4 permanece intocada; o PR #5 continua empilhado sobre ela.

## Pendências antes de qualquer merge

1. A branch do PR #4 **não tem `package-lock.json`** e sua CI usa `npm install`. Não afirmar build reproduzível. Avaliar portar as melhorias de lockfile/CI da branch `chore/nm-04-base-frontend` **somente em PR independente e após QA**, preservando o código atual da equipe.
2. Executar, em ambiente com npm e dependências instaláveis: `npm install`, `npm run typecheck`, `npm test` e `npm run build`. Registrar comando, saída e SHA.
3. Realizar QA do Supabase **local**: `npx supabase start`, `npx supabase db reset`, `npm run api:serve`, `npm run test:integration` com credenciais exclusivamente locais. Nunca executar contra produção.
4. Testar RLS/grants, concorrência, idempotência, perfis, recuperação de senha, permissões, acessibilidade, responsividade e erros de rede.
5. Revisar as diferenças de API e tipos entre PR #4 e a refatoração frontend posterior. Não sobrescrever o trabalho do @o-tedd ou @Id-UserDanilo.
6. PRs #2 e #3 são documentação **ainda pendente de integração**; devem ser revisados e ordenados antes de atualizar o contrato do MVP.
7. Upload seguro e pagamentos reais estão fora da liberação; testes usam dados sintéticos.

## Revisão de conflito

Conflito material: `README.md` modificado pelo PR #4 e pelo PR #38 incorporado na main. Resolução: conservar o README da main integralmente e guardar a versão do PR #4 sem perda em `docs/guia-original-pr4.md`. Nenhuma regra de backend, migração ou contrato financeiro foi alterado nesta integração.

**Validação realizada nesta etapa:** comparação estrutural das árvores Git e verificação de blobs originais. **Não executado:** runtime npm/Node, tests, Docker e integração Supabase neste ambiente.

## Responsabilidades

- @o-tedd: QA backend/Supabase, SQL, RLS, transações e APIs.
- @Id-UserDanilo: QA frontend, acessibilidade, sessão, navegação e segurança da interface.
- Revisão cruzada e aprovação explícita necessárias.
