# Prévia visual da landing page via GitHub Pages

Esta branch **não é uma entrega do MVP nem substitui a main**. Sua única finalidade é publicar a interface da landing page, sem backend, cadastro funcional ou pagamentos. Não mesclar `preview/landing-github-pages` na branch de desenvolvimento ou na `main`.

## Como habilitar a visualização pública

1. Entre no repositório com uma conta **admin**, por exemplo `dp-tech021`.
2. Acesse [Settings → Pages](https://github.com/dp-tech021/nutri-med/settings/pages).
3. Em **Build and deployment → Source**, selecione **GitHub Actions** e salve.
4. O workflow [Publicar prévia da landing no GitHub Pages](https://github.com/dp-tech021/nutri-med/actions/workflows/preview-github-pages.yml) é acionado por push na branch `preview/landing-github-pages`. Caso já tenha sido executado antes da ativação do Pages, reexecute-o no GitHub Actions ou faça um novo commit na branch de prévia.
5. Somente após o deploy com estado **success**, abra a URL mostrada em **Settings → Pages / Visit site**. O formato esperado é `https://dp-tech021.github.io/nutri-med/`, **mas este endereço deve ser verificado antes de ser apresentado como publicado**.

## O que está disponível
- Landing, menu, versão mobile e seção **Como funciona**, reutilizando o componente React original `HomePage`.
- Links para as demais áreas mostram um aviso explícito de indisponibilidade da demonstração.
- Uma faixa superior identifica que é uma prévia pública.
- O Vite usa o caminho-base `/nutri-med/` somente nesta branch.
- O `HashRouter` mantém a navegação da demonstração em um único arquivo estático.

## O que NÃO está disponível
- Login, cadastro, catálogo integrado, API, Supabase, propostas ou contratações.
- Teste real de banco, autenticação, segurança operacional ou pagamentos.
- Dados de usuários reais.

**Segurança:** nunca adicionar variáveis de produção, chaves administrativas, credenciais, tokens ou dados pessoais à prévia. GitHub Pages é público. A aplicação principal continua em `chore/nm-04-base-frontend`.

## Como validar
1. Confirme que o job `Validar e compilar prévia` executou `npm ci`, typecheck, testes, lint e build com sucesso.
2. Confirme que `Publicar prévia pública` está verde e mostra uma URL.
3. Teste desktop/mobile: hero, menu, seção **Como funciona** e aviso de prévia.
4. Confirme que cadastrar ou explorar serviços leva ao aviso de indisponibilidade, sem efetuar pedidos à API.
5. Se CSS/JS não carregar, confira o `base: '/nutri-med/'` no `vite.config.ts` desta branch.
6. Se o job Pages falhar por falta de site configurado, habilite GitHub Actions em Settings → Pages.
