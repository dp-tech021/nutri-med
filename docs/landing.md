# Landing do marketplace — NM-05

## Objetivo e estrutura

A landing apresenta o Nutri-Med como um marketplace generalista de serviços. O hero oferece acesso direto ao catálogo e ao cadastro de prestador, acompanhado de um mockup identificado como demonstração visual. As seções seguintes explicam a jornada, mostram uma prévia do catálogo, expõem as categorias disponíveis, orientam clientes e prestadores e encerram com um CTA e um rodapé institucional.

A implementação reutiliza `Button`, `Card`, `Alert`, `Skeleton` e `EmptyState` do Design System. O componente `ServiceCard` foi criado para manter o mesmo cartão de serviço na landing e no catálogo, incluindo valor, modalidade, cidade e link para um ID retornado pela API.

## Dados e navegação

- A prévia consulta `GET /catalog?limit=3`, mostra no máximo três resultados e possui estados de carregamento, vazio, erro e nova tentativa.
- As categorias consultam `GET /categories`. Cada categoria retornada aponta para `/servicos?category=<slug>`.
- O catálogo lê `category` da URL, sincroniza o filtro aplicado e permite limpar a query string. Busca, paginação e demais filtros continuam usando o contrato existente.
- Nenhum anúncio demonstrativo é usado como resultado da API. O único conteúdo fictício está no mockup do hero e aparece explicitamente como demonstração visual, sem links para IDs inexistentes.
- Termos, política, contato e canais oficiais ainda não existem no projeto. O rodapé registra essa pendência sem criar links ou dados institucionais fictícios.

## Responsividade e acessibilidade

O hero usa duas colunas em telas amplas e uma coluna no mobile. Grades de passos, serviços, categorias, públicos e rodapé reduzem progressivamente até uma coluna. Botões podem quebrar linha sem sobreposição, os cartões não usam altura fixa e o mockup preserva seu conteúdo em telas estreitas.

A página mantém hierarquia de títulos, regiões nomeadas, mensagens de status e erro, links descritivos e foco visível. Ícones redundantes são decorativos. Hover e transições usam CSS e são desativados com `prefers-reduced-motion`. A paleta usa os tokens do Design System, sem a antiga cor roxa isolada.

## Dependências, validação e limitações

Nenhuma dependência foi adicionada e nenhum arquivo do backend, Supabase ou autenticação foi alterado. A landing depende da API local para apresentar anúncios e categorias reais; sem backend, exibe estados vazios ou de indisponibilidade sem interromper a navegação. Pagamentos, avaliações públicas, verificação profissional e documentos jurídicos continuam fora do escopo.

Os testes de componente cobrem conteúdo, CTAs, destinos, limite de três serviços, categorias, catálogo vazio, falha e retentativa da API e inicialização/limpeza do filtro por query string. A homologação deve repetir a navegação com o backend integrado e dados aprovados antes da publicação.

As imagens em `docs/screenshots/landing/` são evidências de QA visual. Para tornar o estado carregado reproduzível sem depender de um banco local, elas usam respostas sintéticas interceptadas no navegador para os contratos reais de catálogo e categorias. Os nomes e valores dessas respostas existem somente no teste visual.

Em 12 de novembro de 2026, `npm ci --cache /tmp/nutri-med-npm-cache`, `npm run typecheck`, `npm test`, `npm run lint` e `npm run build` passaram. A suíte executou 16 testes; o teste integrado com Supabase ficou ignorado porque as chaves locais de teste não estavam configuradas. O build emitiu o aviso não impeditivo de chunk principal acima de 500 kB.

O QA no Chromium cobriu 320, 375, 768, 1024 e 1440 px. Não houve overflow horizontal, corte de texto ou erro no console. O foco por teclado apresentou contorno de 3 px, os links de categoria preservaram alvos de toque acima de 44 px, o menu móvel abriu corretamente e `prefers-reduced-motion` reduziu movimentos. A página também permaneceu sem overflow com o tamanho base do texto ampliado para 125%.
