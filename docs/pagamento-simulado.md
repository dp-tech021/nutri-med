# Tela de pagamento demonstrativa — sem gateway

## Escopo desta alteração

A aplicação continua **sem pagamentos reais**. A tela serve apenas para ensaiar a experiência visual de um checkout. Há duas formas de usá-la:

1. `/pagamento-demo`: demonstração aberta com atendimento fictício e valor fixo de exemplo (R$ 159,90).
2. `/pagamento-demo/:id`: a partir de uma solicitação com proposta aceita, visível somente ao cliente autenticado daquela solicitação; o valor é obtido da cópia do contrato retornada pela API, não de parâmetros de preço na URL.

### Funcionalidades da tela

- Resumo do atendimento e valor.
- Métodos apenas ilustrativos: Pix, cartão ou boleto.
- Botões para simular pagamento aprovado, recusado ou pendente.
- Mensagem explícita de que **nenhum pagamento foi realizado**.
- Possibilidade de reiniciar a demonstração.

### Restrições técnicas e de segurança

- Não há integração com operadora de cartões, banco, Pix, gateway, checkout externo, webhook ou SDK de pagamento.
- Não são coletados números de cartões, CVV, CPF, dados bancários nem dados de terceiros.
- Não gera QR Code Pix, boleto real, recibo financeiro ou comprovante bancário.
- Não cria tabelas financeiras nem altera estado da contratação.
- Resultado da simulação é temporário, mantido apenas no estado React, e desaparece após recarregar a página.
- O backend de propostas e contratos continua independente do resultado da simulação.
- Rota vinculada a pedido privado exige usuário cliente proprietário; a API existente controla acesso ao pedido.
- Não aceitar pagamentos de clientes reais a partir dessa tela.

## Como testar

1. Execute a branch junto com o frontend (o desenvolvimento local está descrito no README do PR #4).
2. Acesse `/pagamento-demo`, sem login, e escolha método e resultado.
3. Confirme que nenhum dado financeiro é solicitado e que recarregar a página apaga o resultado.
4. Com a API local funcionando, crie um cliente, um prestador e aceite uma proposta.
5. Entre como o cliente e abra o pedido; use `Abrir simulação de pagamento` e confira que o valor é igual ao contrato aceito.
6. Tente abrir a URL do pedido como usuário não proprietário; a tela deve negar a consulta.
7. Confirme que nenhum estado de pedido ou contrato muda após a simulação.

## Dados de teste, LGPD e publicação

Este protótipo deve operar **exclusivamente com dados sintéticos**, inclusive nomes e e-mails fictícios em ambientes apropriados. Usar a aplicação para testes **não elimina automaticamente as obrigações da LGPD** quando dados pessoais reais são tratados. Antes de qualquer teste externo com pessoas reais, revisar segurança, privacidade e retenção de dados.

A implementação de pagamento real segue fora do escopo; qualquer futura integração exigirá análise de provedor, custos, conformidade, autorização de deploy e testes específicos.

Este PR é uma alteração incremental sobre `feat/mvp-plataforma-servicos`. Não faça merge isolado em `main` sem integrar/validar a base primeiro.
