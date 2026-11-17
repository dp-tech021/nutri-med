# Texto para abrir o PR incremental em rascunho

**Repositório:** `dp-tech021/nutri-med`  
**Título:** `feat: catálogo e perfis por domínio com compatibilidade legada`  
**Head:** `feat/nm-catalogo-perfis-por-dominio`  
**Base:** `feat/nm-redefinicao-saude-servicos` (PR #56 aberto, ponta revisada `63ed0ff`)  
**Estado a selecionar:** rascunho. Não fazer merge nem deploy.

**Commit da implementação:** `c266d4c`. A documentação e evidências acompanham em commit posterior na mesma branch.

**PR base:** https://github.com/dp-tech021/nutri-med/pull/56  
**Comparação para abrir o novo PR:** https://github.com/dp-tech021/nutri-med/compare/feat/nm-redefinicao-saude-servicos...feat/nm-catalogo-perfis-por-dominio?expand=1

O PR incremental ainda não foi criado nesta execução: `api.github.com` está bloqueada com HTTP 403. O usuário pediu o material para repassar a outro chat. Este link é uma comparação, não um PR já aberto.

Antes de abrir, conferir novamente #56 e a base remota. Se já houver um PR para esta head, atualizá-lo em vez de duplicar. Se #56 tiver sido integrado, verificar a branch que recebeu a integração e usar a base efetiva, preservando os commits.

## Descrição proposta

`/saude` passa a consultar ofertas por profissão, especialidade, cidade, modalidade e busca, enquanto `/servicos` mantém o contrato legado de categoria, cidade, modalidade, cursor e links públicos. Catálogo e componentes são compartilhados na mesma aplicação.

A migração aditiva atribui `services` a todos os registros antigos, adiciona domínio e atributos profissionais, taxonomias de Saúde e FK composta de anúncio/perfil. Domínio não concede papel de conta. Perfis públicos de Saúde apresentam somente campos autorizados e registro declarado quando houver consentimento; não há selo oficial. O formulário livre de pedidos fica restrito a Serviços Gerais, também no servidor e no banco.

Principais arquivos: `supabase/migrations/202611170001_marketplace_domains.sql`, `supabase/functions/api/index.ts`, `supabase/functions/_shared/marketplace.ts`, `src/marketplace.ts`, `src/types.ts`, `src/api.ts`, catálogo/Home/perfil/detalhe públicos, componentes e testes correspondentes. Modelo/API, recuperação, limitações e resultados completos em `docs/catalogo-dominios.md`. Capturas e matriz de navegador em `docs/screenshots/domains/`.

Validação real: `npm ci`, typecheck, lint e build passaram; `npm test`: 9 verificações Node e 67 testes Vitest passaram (as 2 integrações ficam ignoradas nesse comando sem as variáveis locais). Separadamente, **2 testes integrados reais passaram sem skips** no Supabase local, cobrindo fluxo anterior e domínios. Migrações aplicadas localmente e teste independente antes/depois com registros legados passou em PostgreSQL descartável. Chromium verificado em 320, 375, 768, 1024 e 1440 px; sem overflow. O build mantém aviso de bundle >500 kB.

Riscos/limites: não há seed comercial de profissões/especialidades; dados da integração são somente sintéticos e locais. Formulários de autoria de Saúde ficam para etapa posterior (a API já valida cadastro/publicação). Um domínio profissional por conta nesta entrega. Sem atendimento, agendamento, coleta clínica ou verificação profissional oficial. Rollout exige migração e API compatível antes do frontend; recuperação mantém o esquema aditivo e cadastros novos. Nenhuma mudança remota em banco/segredos, merge, deploy ou faturamento.

Relaciona-se ao PR base #56 e à NM-01 (#6), que deve permanecer aberta pelas decisões de produto pendentes.
