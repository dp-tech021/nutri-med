# ADR-003 — Escolha de stack para o MVP com custo zero

**Data:** 2026-11-10
**Estado:** aprovada como referência de implementação; produção não autorizada.

## Contexto
O repositório `dp-tech021/nutri-med` foi inicializado com um README, mas ainda não contém aplicação. A especificação propõe Firebase Auth + Cloud Functions + Firestore. O orçamento exige R$ 0 e proíbe habilitar faturamento sem autorização. Todas as regras e autorizações ficam no backend e o navegador não acessa diretamente coleções/tabelas de negócio.

## Decisão
Usar React, TypeScript, Vite, Tailwind CSS e React Router; Supabase Auth; Supabase Edge Functions (Deno/TypeScript) como API única; PostgreSQL para dados privados de negócio com SQL transacional; Supabase Storage quando upload puder ser validado com segurança. Hospedagem estática futura no Cloudflare Pages Free, sem deploy nesta etapa.

## Alternativas
1. **Firebase + Cloud Functions + Firestore**: segunda opção; ótima emulação local, mas deploy de Cloud Functions exige Blaze, ou seja, vinculação de faturamento. Não apropriada a produção de orçamento estritamente zero.
2. **Cloudflare Workers + D1**: runtime e banco com plano gratuito, mas falta uma solução integrada de login/recuperação/verificação de e-mail; aumenta complexidade para uma dupla iniciante.
3. **Sem backend, somente frontend e localStorage**: rejeitada; descumpre autenticação, segurança, persistência e concorrência.

## Limitações e reconsideração
- Supabase Free pode pausar projetos pouco utilizados; não prometer alta disponibilidade.
- Cotas oficiais e suas alterações devem ser monitoradas antes do deploy; não transformar automaticamente a conta em plano pago.
- Edge Functions não são adequadas a processamento intensivo de imagens; aprovar upload somente após validação.
- Auth e Storage criam dependência do fornecedor, embora PostgreSQL facilite exportação de dados.
- Rever a decisão se houver exigência de uptime comercial, processamento pesado, dados/região restritos, dificuldade com containers ou orçamento autorizado para infraestrutura.

## Segurança
- Somente Auth SDK fica no navegador; chamadas de dados passam por Edge Functions.
- Schemas privados não expostos; negar acesso direto de `anon` e `authenticated`.
- Credenciais secret/service-role apenas no backend, com autenticação e autorização explícitas.
- Integridade do aceite assegurada por transação e idempotência, não por lógica de frontend.

## Fonte da decisão
Consulte `docs/arquitetura-mvp.md` para comparativo ponderado, contratos iniciais, busca, limites, riscos e referências oficiais verificadas em 2026-11-10.

## Ações autorizadas nesta etapa
Documentação e PR para revisão. Sem deploy, sem faturamento, sem integração externa real e sem merge.
