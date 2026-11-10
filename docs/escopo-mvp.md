# Escopo do MVP — plataforma de serviços

## Objetivo
Conectar clientes e prestadores: cadastro → login → publicação de serviço → solicitação de orçamento → proposta → aceite → execução → conclusão.

## Premissas
- Cada conta representa um único perfil: cliente **ou** prestador.
- Cadastro público nunca concede papel administrativo.
- Cada solicitação pertence a um cliente, a um serviço e ao prestador vinculado ao serviço.
- Só existe uma proposta vigente por solicitação; versões anteriores são imutáveis.
- Proposta aceita e termos da contratação não podem ser alterados.
- Aceite representa contratação registrada na plataforma; não há pagamento na aplicação.
- Dados públicos e privados devem ficar separados; acesso pelo navegador aos dados de negócio acontece via API e com autorização no backend.
- Valores monetários são armazenados em centavos inteiros, com moeda definida no contrato.

## Estados e transições obrigatórias
| Estado atual | Ação | Responsável | Próximo estado |
|---|---|---|---|
| Aguardando proposta | Enviar proposta | Prestador destinatário | Proposta enviada |
| Aguardando proposta | Recusar pedido | Prestador destinatário | Pedido recusado |
| Aguardando proposta | Cancelar | Cliente proprietário | Cancelado |
| Proposta enviada | Revisar proposta | Prestador destinatário | Proposta enviada (nova versão) |
| Proposta enviada | Aceitar proposta vigente | Cliente proprietário | Contratado |
| Proposta enviada | Recusar proposta | Cliente proprietário | Proposta recusada |
| Proposta enviada | Cancelar | Cliente proprietário | Cancelado |
| Contratado | Iniciar serviço | Prestador destinatário | Em andamento |
| Em andamento | Informar finalização | Prestador destinatário | Aguardando confirmação de conclusão |
| Aguardando confirmação de conclusão | Confirmar conclusão | Cliente proprietário | Concluído |

Estados finais: pedido recusado, proposta recusada, cancelado e concluído. Não há cancelamento após contratação nem conclusão automática. Nova negociação exige nova solicitação. Toda transição registra autor, data, estado anterior e novo estado.

## Fora do MVP
Pagamento, chat, avaliações públicas, painel administrativo, cancelamento após contratação, notificações e calendário de disponibilidade.

## Critérios de aceite gerais
- Persistência real e API integrada ao frontend.
- Regras de negócio e autorização aplicadas no servidor.
- E-mail verificado para ações de publicação, orçamento, envio e aceite de propostas.
- Proteção contra acesso de terceiros, alterações de preço ou identidade, repetição de solicitações e concorrência no aceite.
- Testes reproduzíveis, documentação e PR revisável antes de merge.
- Nenhuma publicação ou faturamento sem autorização.

Este documento resume a especificação recebida. Limites quantitativos, modelo de dados e contratos de API serão definidos nas próximas etapas antes da implementação.
