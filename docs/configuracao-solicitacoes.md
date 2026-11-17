# Solicitações do cliente no frontend

O frontend preserva os endpoints existentes `POST /requests`, `GET /requests`, `GET /requests/:id` e `POST /requests/:id/actions`. O formulário envia somente `service_id`, `need` e `desired_date`; a API autentica a conta, confirma o papel de cliente, localiza o serviço ativo e cria os snapshots do anúncio.

A data desejada é apresentada como preferência. Ela não confirma agendamento. Enviar uma solicitação também não cria contrato e não realiza pagamento. Cancelamento, recusa, aceite e demais transições continuam subordinados ao estado e à autorização validados pela função transacional do backend.

## Campos disponíveis na listagem

O contrato atual de `GET /requests` retorna as colunas da solicitação, incluindo snapshots, estado, criação e atualização. Ele não retorna o nome público do prestador. A interface mostra esse nome apenas se a API passar futuramente o campo opcional `provider_name`; o UUID privado não é usado como substituto visual.

## Erros e concorrência

- 400: revisão dos campos enviados;
- 401: sessão encerrada e ação para entrar novamente;
- 403: conta sem permissão para a operação;
- 404: serviço ou solicitação indisponível;
- 409: estado alterado por outra operação, exigindo recarga;
- falha de rede: orientação para verificar a conexão e tentar novamente.

Referências curtas exibidas na interface usam apenas os oito primeiros caracteres do identificador. As chamadas e rotas internas continuam usando o identificador completo devolvido pela API.
