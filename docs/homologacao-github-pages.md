# Homologação no GitHub Pages

Esta configuração prepara um ambiente gratuito de homologação, não de produção.
URL esperada: https://dp-tech021.github.io/nutri-med/. A preparação não confirma publicação online.

## Configuração e execução

Após revisão e integração na main, configurar Pages em Settings → Pages → Source: GitHub Actions.
Cadastrar as repository variables `VITE_SUPABASE_URL` e `VITE_API_URL`, e o repository secret
`VITE_SUPABASE_ANON_KEY` (somente a chave pública anon). Nenhum valor deve ser versionado em .env.
Todas as variáveis VITE ficam disponíveis no bundle do navegador; nunca utilizar credenciais administrativas.

Backend existente: projeto Supabase nutri-med, URL pública
https://yjvdychyaohnqcqwexzw.supabase.co e API
https://yjvdychyaohnqcqwexzw.supabase.co/functions/v1/api.
Este workflow não aplica migrations, não publica Edge Functions e não configura o backend.

Antes do teste integrado, a configuração remota `ALLOWED_ORIGINS` deverá incluir
`https://dp-tech021.github.io` (origem sem caminho). Essa configuração não foi alterada nesta tarefa.

O workflow `GitHub Pages homologation` executa automaticamente em push na main.
Também pode ser acionado em Actions → Run workflow, selecionando main.
Ambos os jobs recusam outras branches, inclusive em execução manual.
A sequência é instalação, typecheck, testes, lint, validação das três variáveis sem imprimir valores,
build, fallback, configuração/artifact Pages e deploy no environment github-pages.
Somente o job de deploy recebe permissões pages:write e id-token:write.

## Build e rotas

Vite 7.3.8 suporta configuração por função com mode e base. React Router 7.18.5
aceita basename no BrowserRouter. O modo normal mantém `/`; github-pages usa `/nutri-med/`.

```bash
npm ci
npm run typecheck
npm test
npm run lint
npm run build
npm run build -- --mode github-pages
cp dist/index.html dist/404.html
npm run preview -- --host 127.0.0.1
```

O artifact inclui index.html e sua cópia 404.html, com assets em /nutri-med/assets/.
O fallback preserva o endereço para o BrowserRouter resolver a rota, sem HashRouter.
GitHub Pages pode responder HTTP 404 em deep links mesmo com a aplicação renderizada;
não é um rewrite de servidor nem garantia de SEO. Validar online navegação e refresh de
/nutri-med/, /nutri-med/saude, /nutri-med/servicos e /nutri-med/login após o workflow real.

## Limitações

Sem teste integrado remoto nesta tarefa. CORS, configuração do Pages, variáveis e permissões
do environment precisam estar prontas antes da publicação. O CI sem stack Supabase local
pode deixar os testes HTTP condicionais sem execução; os testes de interface continuam ativos.
O aviso existente de bundle acima de 500 kB permanece.

Os callbacks de confirmação de cadastro e recuperação respeitam `BASE_URL` e foram
testados para `/` e `/nutri-med/`. A allowlist de Redirect URLs do Supabase precisa aceitar
`https://dp-tech021.github.io/nutri-med/login` e
`https://dp-tech021.github.io/nutri-med/atualizar-senha` antes da homologação real por e-mail.
Essa configuração não foi aplicada remotamente nesta tarefa. As rotas internas continuam
sem prefixo manual; o BrowserRouter cuida da base.

## Validação local desta preparação

SHA inicial: `cf7feafe7246ecf33ee2e3506f072d3e66289ffe`, igual à main após PR #57.
Node 24.22.1, npm 11.9.0. Instalação aprovada com
`npm ci --offline --cache /workspace/work/nutri-med-homologacao-20261117/npm-cache`;
a tentativa padrão falhou por permissão de escrita no cache fora do workspace.
Typecheck, lint e ambos os builds aprovados. npm test: 90 Vitest + 10 Node aprovados;
quatro testes HTTP condicionais não executados, sem stack local e sem acesso ao backend remoto.

Configuração resolvida pelo Vite confirma base `/` em development/production e
`/nutri-med/` no modo github-pages. YAML do workflow validado estruturalmente,
incluindo restrição à main nos dois jobs; o workflow não foi disparado nesta branch.

Chromium local testou as quatro rotas listadas acima em servidor estático que devolve
404.html para caminhos inexistentes: conteúdo correto, links internos com prefixo,
refresh e assets aprovados, sem exceções JavaScript. A raiz respondeu 200 e os deep links
404 com a aplicação renderizada, comportamento esperado desse fallback.
APIs foram interceptadas com respostas sintéticas vazias; não se homologa integração remota.
O harness inicial usava formato incorreto para categories/taxonomy; corrigido o fixture,
todas as verificações passaram sem alteração do produto.
index.html e 404.html são idênticos, com JS/CSS sob /nutri-med/assets/.
Não foram adicionados testes permanentes, dependências ou mudanças no produto.

### Correção posterior dos callbacks Auth

Partindo do SHA `e436066c3c79f4d9e5282844e997fe1adf2792ed`, a composição dos callbacks
passou a usar a base do Vite, sem prefixo fixo nem alteração das rotas internas.
Seis testes novos verificam quatro URLs absolutas e as opções enviadas a signUp e
resetPasswordForEmail nas duas bases, usando mocks sem contato com Supabase remoto.
Instalação com o cache local acima, typecheck, lint e ambos os builds aprovados.
npm test: 96 Vitest e 10 Node aprovados; quatro testes HTTP condicionais sem execução.
Após o build Pages, `cp dist/index.html dist/404.html` foi executado; os arquivos são
idênticos e os assets JS/CSS usam `/nutri-med/assets/`.
Publicação online e entrega real de e-mail continuam sem homologação nesta tarefa.
