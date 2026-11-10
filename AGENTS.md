# Orientações para desenvolvedores e agentes de IA

## Objetivo
Construir um MVP de plataforma de serviços: cliente encontra serviço, solicita orçamento, prestador propõe, cliente aceita e acompanha execução até a conclusão.

## Regras de colaboração
- Trabalhar somente neste repositório: `dp-tech021/nutri-med`.
- Cada mudança funcional deve usar branch própria (`feat/...`, `fix/...`, `docs/...`, `chore/...`).
- Não fazer push diretamente em `main` para funcionalidades. Abrir pull request (PR) e pedir revisão da outra pessoa.
- Não realizar merge, deploy de produção nem ativar faturamento sem autorização explícita.
- Antes de alterar arquivos, ler README, este documento e documentação em `docs/`.
- Manter mudanças pequenas, revisáveis e acompanhadas de testes.
- Não afirmar que testes rodaram sem registrar o comando e o resultado real.
- Nunca sobrescrever alterações não relacionadas ou modificar o remoto automaticamente.

## Segurança obrigatória
- Identidade do usuário vem de token ou sessão validados no backend, nunca de IDs enviados pelo navegador.
- Autorização, limites, validações e transições de estado ocorrem no backend.
- Cliente e prestador têm perfis exclusivos; cadastro público nunca cria admin.
- Impedir leitura ou gravação diretas no banco pelo navegador, exceto operações de autenticação permitidas pela arquitetura.
- Não publicar segredos, tokens, senhas, contas de serviço, arquivos `.env` nem dados pessoais reais.
- Se uma tarefa exigir recurso pago, interromper a ativação e documentar custo e alternativa.
- Mudanças em contratos, propostas, valores e estados críticos exigem transação ou garantia equivalente de concorrência e testes.

## Fluxo de desenvolvimento em dupla
1. Pessoa A descreve uma tarefa pequena, seus critérios de aceite e cria a branch.
2. Pessoa A implementa e executa testes.
3. Pessoa B revisa código, segurança e comportamento; aprova ou pede correções.
4. Integrar na `main` somente após revisão e autorização.
5. Não compartilhar a mesma branch de trabalho em mudanças simultâneas sem coordenação.

## Critério mínimo para cada PR
- Descrição do problema e solução.
- Lista dos arquivos alterados.
- Passos de reprodução e testes realmente executados.
- Riscos, limitações e dependências externas.
- Nenhum segredo ou dado sensível no diff.

## Escopo inicial
- Sem pagamento online, chat, avaliações, painel administrativo, notificações ou calendário de disponibilidade.
- Cadastro e recuperação de senha, verificação de e-mail, autenticação, catálogo, pedidos, propostas, aceite e conclusão pertencem ao MVP.
- A arquitetura proposta deve ser validada contra orçamento R$ 0 e documentada antes de instalar infraestrutura.
