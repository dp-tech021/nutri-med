# Registro de decisões de arquitetura (ADR)

## ADR-001 — Base de trabalho

> **Atualização de integração (10/11/2026):** a referência a Firebase abaixo registra uma hipótese inicial, **não a stack atual escolhida**. A ADR-003 (`docs/decisao-tecnologica.md`, PR #3) recomenda React/TypeScript + Supabase Auth, Edge Functions e PostgreSQL. A recomendação ainda exige QA e aprovação antes de produção.

**Situação:** em análise.

**Contexto:** equipe de duas pessoas iniciantes, orçamento de R$ 0, plataforma com autenticação, catálogo e contratações. O repositório contém somente a base de documentação inicial.

**Arquitetura de referência da especificação:** React + TypeScript + Vite + Tailwind CSS + React Router; Firebase Authentication; Cloud Functions for Firebase (TypeScript); Cloud Firestore; Storage somente se necessário.

**Risco identificado:** algumas opções de hospedagem/serviços backend podem exigir conta de faturamento mesmo oferecendo cotas gratuitas. Orçamento de R$ 0 não autoriza habilitar faturamento.

**Decisão provisória:** não provisionar recursos externos, não ativar billing, não publicar produção. Antes de instalar dependências e implementar backend, confirmar em documentação oficial a viabilidade e as cotas atuais; comparar alternativas gratuitas, manter arquitetura única no MVP.

**Pendente:** escolha final documentada, execução local/emuladores, estratégia de autenticação, busca, paginação, upload, limites e política de custos.

## ADR-002 — Versionamento

**Situação:** aceito.

**Decisão:** preservar `main` e criar branches de mudanças pequenas; revisão por PR; sem merge nem deploy automático. Documentar testes e pendências em cada PR.
