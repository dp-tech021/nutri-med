# Serviços e imagens no frontend

O frontend usa os endpoints existentes `GET /categories`, `POST /services`, `GET /my/services` e `PATCH /services/:id`. Título, descrição, cidade, modalidade, categoria e preço seguem os limites declarados pela API e pelas constraints do banco. Valores são digitados em reais e convertidos para centavos sem cálculo de ponto flutuante antes do envio.

As escolhas e validações da interface servem para orientar a pessoa usuária. A API precisa validar novamente todos os campos, o papel de prestador e a propriedade do anúncio. Respostas 403 e 404 são apresentadas de forma genérica para não revelar a existência de recursos privados.

## Upload bloqueado

O endpoint `/uploads` responde atualmente com `501 UPLOAD_DISABLED_PENDING_VALIDATION`. Por isso, o seletor de imagens permanece desabilitado com o aviso **Imagens indisponíveis no protótipo**. A interface não acessa buckets do Supabase Storage e não simula envio concluído.

Para liberar imagens, NM-14 precisa definir e revisar no backend:

- endpoint autenticado e autorização por proprietário;
- tipos MIME aceitos, tamanho máximo, quantidade e dimensões;
- nomes e caminhos gerados no servidor;
- tratamento de conteúdo rejeitado, remoção e substituição;
- resposta usada para progresso e associação da imagem ao anúncio;
- políticas de Storage sem gravação direta não autorizada pelo navegador.
