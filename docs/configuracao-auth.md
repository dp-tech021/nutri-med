# Configuração de autenticação e callbacks

O frontend usa o SDK oficial `@supabase/supabase-js` para cadastro, login, sessão, recuperação e redefinição de senha. A interface não envia e-mail diretamente e não implementa autenticação própria.

## URLs permitidas no Supabase

O projeto Supabase deve manter a URL principal do ambiente e permitir explicitamente os callbacks usados pelo frontend:

- desenvolvimento: `http://localhost:5173/login` e `http://localhost:5173/atualizar-senha`;
- homologação: as mesmas rotas no domínio aprovado de homologação;
- produção: somente depois de domínio e deploy aprovados, as mesmas rotas no domínio final.

Não usar curingas amplos nem aceitar uma URL de callback fornecida por query string. O frontend constrói os callbacks a partir da origem atual e de caminhos internos fixos.

## Responsabilidades do backend

- configurar confirmação de e-mail, SMTP, validade dos links e limites de envio;
- validar o token em cada operação privada;
- determinar e preservar o papel real da conta (`cliente` ou `prestador`);
- aplicar autorização, RLS e isolamento independentemente da interface;
- testar expiração, revogação e atualização de sessão no Supabase local/homologação.

O rascunho temporário do cadastro guarda apenas identificador do usuário, nome de exibição, tipo escolhido e expiração por 30 minutos em `sessionStorage`. Senha, token, cidade, apresentação e dados de saúde não são armazenados por esse mecanismo. O rascunho é descartado quando expira, pertence a outro usuário, está inválido ou o perfil é salvo.
