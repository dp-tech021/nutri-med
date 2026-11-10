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
- Busca textual de prefixo ainda não está implementada; parâmetro `q` devolve `SEARCH_NOT_YET_IMPLEMENTED`.
- Paginação inicial usa offset, não cursor estável. Filtros de cidade e categoria ainda são correspondência exata.
- Sem rate limiting distribuído, testes de concorrência/integrados, seed de categorias, validação SMTP externo e revisão de acessibilidade.
- A recuperação de senha foi iniciada, mas o fluxo de definir a nova senha pelo link ainda precisa de tela.
- Não usar dados pessoais reais, não ativar billing ou deploy.

## Pré-requisitos
Git, Node.js LTS, npm e Docker ou runtime compatível. Necessários recursos locais para os contêineres Supabase.

## Como executar localmente
```bash
git clone https://github.com/dp-tech021/nutri-med.git
cd nutri-med
git fetch origin
git checkout feat/mvp-plataforma-servicos
npm install
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
npm run build
npx supabase db reset
```
Esses comandos são instruções, **não evidência de que passaram**. O ambiente desta revisão não possui Docker e não conseguiu instalar dependências para teste integrado.

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

Documentação oficial: https://supabase.com/docs/guides/local-development ; https://supabase.com/docs/guides/functions/auth ; https://supabase.com/docs/guides/platform/free-project-pausing
