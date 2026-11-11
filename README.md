# Nutri-Med — MVP em desenvolvimento

Plataforma web para clientes encontrarem prestadores, solicitarem orçamentos e acompanharem atendimentos.

**O código desta branch ainda não foi validado de ponta a ponta. Não publicar em produção.**

## Funcionalidades codificadas (pendentes de QA)
- React + TypeScript + Vite + Tailwind + Router: catálogo, login, cadastro, perfil, anúncios, pedidos, proposta, aceite e conclusão.
- Supabase Auth: cadastro, login, logout e solicitação de recuperação de senha.
- Edge Function `api`: API de acesso aos dados de negócio com verificação de token e perfil no servidor.
- PostgreSQL com RLS, acesso direto ao banco bloqueado para `anon` e `authenticated`, contratos únicos e transições transacionais.

## Limitações conhecidas
- Upload de imagens está **desativado** até inspeção segura.
- Busca por prefixo de serviço ou nome público do prestador e filtros normalizados foram codificados, **mas ainda não testados com PostgreSQL real**.
- Paginação por cursor ordenado por data + UUID foi codificada, ainda sem validação de desempenho/concorrência.
- Há limite transacional por conta nas operações privadas e seed de categorias; faltam proteção contra abuso nos endpoints públicos, testes de concorrência executados, SMTP externo e revisão de acessibilidade.
- Há tela de atualização de senha após link de recuperação; o fluxo de e-mail ainda precisa de teste real.
- Não usar dados pessoais reais, não ativar billing ou deploy.

## Pré-requisitos
Git, Node.js 24 LTS, npm 11 e, para a stack completa, Docker ou runtime compatível. O frontend isolado não precisa iniciar os contêineres Supabase, mas as jornadas que leem ou gravam dados dependem da API e do banco locais.

## Como executar localmente
```bash
git clone https://github.com/dp-tech021/nutri-med.git
cd nutri-med
git fetch origin
git checkout feat/mvp-plataforma-servicos
nvm install
nvm use
npm ci
```

Para validar e iniciar somente o frontend:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run dev
```

Sem a stack Supabase, a interface abre, mas catálogo, autenticação e demais operações de dados não funcionam. Para executar a integração local completa:

```bash
npx supabase start
npx supabase status
```
Copie `.env.example` para `.env.local` e informe a chave pública local mostrada por `npx supabase status`. Nunca use chave secret/service_role no frontend.

Em terminais separados:
```bash
npm run api:serve
npm run dev
```
Abra a URL indicada pelo Vite (geralmente localhost:5173). A API usa `verify_jwt=false` porque há catálogo público; **cada rota privada valida o token com Supabase Auth**. Não expor instância local publicamente.

## Verificações
```bash
npm run typecheck
npm test
npm run lint
npm run build
npx supabase db reset
```
Esses comandos são instruções, **não evidência de que passaram**; cada PR deve registrar os resultados reais. O script `npm run test:integration` cria três contas sintéticas e testa o fluxo completo na stack local, mas depende do Supabase iniciado e de credenciais exclusivamente locais.

### Dependências reproduzíveis

As dependências diretas usam versões exatas e o `package-lock.json` registra toda a árvore resolvida. Isso torna `npm ci` previsível para os dois desenvolvedores e para a CI; atualizações passam a ser explícitas e precisam regenerar o lockfile e repetir todos os checks. Não edite o lockfile manualmente.

A linha 2.x da CLI do Supabase foi preservada para evitar uma migração implícita para a versão 3. As versões e compatibilidades foram conferidas no [registro npm](https://www.npmjs.com/), na documentação do [Node.js](https://nodejs.org/en/about/previous-releases), do [Vite](https://vite.dev/guide/), do [Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite), do [React Router](https://reactrouter.com/start/data/installation), do [Supabase](https://supabase.com/docs/guides/local-development) e do [ESLint](https://eslint.org/docs/latest/use/getting-started).

### Roteiro de QA obrigatório
1. Criar cliente, prestador e terceiro sem vínculo em ambiente de teste; verificar e-mail.
2. Prestador publica e desativa anúncio; visitante vê somente anúncios ativos.
3. Cliente solicita; prestador envia e revisa proposta; cliente aceita termos vigentes.
4. Prestador inicia e informa finalização; cliente confirma.
5. Terceiro não pode ler pedido; cliente não pode editar serviço; prestador não aceita contrato por cliente.
6. Testar versão desatualizada, dois aceites concorrentes, aceite repetido e proposta após contratação.
7. Bloquear leitura/gravação direta na Data API por navegador.
8. Verificar persistência após refresh e falha de upload negada.
9. Validar recuperação de senha, SMTP externo, acessibilidade e apresentação em celular.

## Endpoints
- Públicos: `GET /catalog`, `GET /services/:id`, `GET /health`.
- Autenticados: `POST /profiles`, `GET/PATCH /me`.
- Prestador: `POST /services`, `PATCH /services/:id`, `GET /my/services`.
- Pedidos: `POST/GET /requests`, `GET /requests/:id`, `POST /requests/:id/actions`.
- Ações: `enviar_proposta`, `revisar_proposta`, `recusar_pedido`, `cancelar`, `aceitar`, `recusar_proposta`, `iniciar`, `finalizar`, `confirmar`.

Valores monetários são inteiros em centavos (BRL). Condições aceitas são copiadas do banco, não do navegador.

## Custo zero, colaboração e fontes
Supabase Free possui quotas e pode pausar projetos pouco ativos. Cloudflare Pages Free pode hospedar o frontend futuramente. Nenhum recurso remoto foi criado nesta etapa. Para a dupla: uma pessoa revisa banco/API e a outra frontend/UX; PRs pequenos e revisão cruzada.

### Teste integrado local
```bash
export TEST_SUPABASE_URL=http://127.0.0.1:54321
export TEST_SUPABASE_ANON_KEY='CHAVE_PUBLICA_LOCAL'
export TEST_SUPABASE_SERVICE_ROLE_KEY='CHAVE_SERVICE_ROLE_LOCAL_SOMENTE_NESTE_TERMINAL'
npm run test:integration
```
Nunca cole a chave administrativa neste chat, em commits ou na interface web. Confirme que a URL aponta **somente** para localhost; o teste cria contas, anúncios e pedidos artificiais. Não rode contra produção.

Documentação oficial: https://supabase.com/docs/guides/local-development ; https://supabase.com/docs/guides/functions/auth ; https://supabase.com/docs/guides/platform/free-project-pausing
