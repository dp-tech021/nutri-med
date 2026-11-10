# QA pendente antes do merge ou deploy

## Implementado no código, sem evidência integrada
Frontend básico, Auth, API, schema, propostas, contratações, histórico e transições.

## Bloqueios técnicos
1. Subir Supabase local via Docker e executar `npx supabase db reset`. Corrigir SQL e grants conforme resultado.
2. Instalar dependências reais, gerar/versionar `package-lock.json`, executar typecheck, testes, build e CI.
3. Executar testes reais dos filtros normalizados, da busca por prefixo e da paginação por cursor, implementados no código mas ainda sem validação.
4. Upload de imagens validado no servidor, armazenamento privado e quarentena; até lá, desabilitado.
5. Testar as categorias já cadastradas por seed/FK e validar limites e mensagens.
6. Testar o rate limiting SQL transacional por usuário já implementado; adicionar proteção de leitura pública, auditoria e testes de autenticação, permissões, concorrência, repetição e rollback.
7. Testar a tela de atualização de senha via link de recuperação, SMTP real e limites de envio, sem expor credenciais.
8. UX: foco, acessibilidade, celular, erros e sessão expirada.
9. Revisão LGPD, disponibilidade e custos antes de produção.

## Testes que NÃO foram executados
- Banco local / migration / operações SQL
- Execução real de `npm run test:integration` com contas fictícias distintas
- Upload e integração externa de e-mail
- Tráfego real, volume, concorrência e segurança externa

**Não declarar produção pronta ou segurança comprovada.** Nenhum merge, deploy ou faturamento está autorizado.
