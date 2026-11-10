# QA pendente antes do merge ou deploy

## Implementado no código, sem evidência integrada
Frontend básico, Auth, API, schema, propostas, contratações, histórico e transições.

## Bloqueios técnicos
1. Subir Supabase local via Docker e executar `npx supabase db reset`. Corrigir SQL e grants conforme resultado.
2. Instalar dependências reais, gerar/versionar `package-lock.json`, executar typecheck, testes, build e CI.
3. Busca textual normalizada por serviço/profissional, filtros combinados e paginação por cursor.
4. Upload de imagens validado no servidor, armazenamento privado e quarentena; até lá, desabilitado.
5. Seed de categorias e validação por FK, além de limites quantificados.
6. Rate limiting distribuído e testes de autenticação, permissões, concorrência, repetição e rollback.
7. Recuperação real de senha via link; verificar SMTP e limites de envio, sem expor credenciais.
8. UX: foco, acessibilidade, celular, erros e sessão expirada.
9. Revisão LGPD, disponibilidade e custos antes de produção.

## Testes que NÃO foram executados
- Banco local / migration / operações SQL
- Fluxo E2E com contas distintas
- Upload e integração externa de e-mail
- Tráfego real, volume, concorrência e segurança externa

**Não declarar produção pronta ou segurança comprovada.** Nenhum merge, deploy ou faturamento está autorizado.
