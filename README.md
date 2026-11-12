# Nutri-Med

**Status:** MVP de marketplace **generalista de prestação de serviços** em desenvolvimento, **não validado para produção**. Repositório público: [dp-tech021/nutri-med](https://github.com/dp-tech021/nutri-med).

> **Posicionamento confirmado (11/11/2026):** o Nutri-Med é um **marketplace generalista de prestação de serviços**, conectando clientes e prestadores de diferentes categorias; **não é uma plataforma de saúde ou nutrição**. O nome atual pode sugerir outro segmento; eventual renomeação depende de decisão futura. A lista de categorias e as regras de elegibilidade ainda precisam de definição; não presumir serviços clínicos, coleta de dados de saúde ou verificação profissional concluída. Ver [NM-01](https://github.com/dp-tech021/nutri-med/issues/6) e [questões em aberto](docs/questoes-em-aberto.md).

## 1. O que é o projeto?

O Nutri-Med visa conectar **clientes** que procuram serviços gerais a **prestadores** de diferentes categorias que divulgam suas atividades e recebem pedidos de orçamento. A proposta do MVP é centralizar a descoberta de serviços, a negociação por proposta, o aceite de condições e o acompanhamento dos atendimentos até sua conclusão.

**Fluxo principal esperado:** cadastro → login → prestador publica serviço → cliente consulta catálogo → solicita orçamento → prestador envia/revisa proposta → cliente aceita os termos da versão vigente → execução → finalização informada pelo prestador → confirmação do cliente.

**Importante:** no MVP, **aceitar uma proposta significa registrar uma contratação no sistema; NÃO significa pagamento**.

### Perfis de usuário
| Perfil | Objetivo | Principais operações |
| --- | --- | --- |
| Visitante | Conhecer a plataforma e pesquisar serviços | Catálogo, filtros, detalhes, perfis públicos, acesso a login/cadastro |
| Cliente | Encontrar profissionais e contratar serviços | Cadastro, orçamento, consulta/aceite/recusa de proposta, histórico, confirmação de conclusão |
| Prestador | Divulgar serviços e administrar solicitações | Perfil público, anúncios, propostas/revisões, acompanhamento e finalização informada |

Cada conta terá um único perfil (**cliente ou prestador**); cadastro público não cria administradores. **O MVP não possui painel administrativo**.

## 2. Escopo e entregáveis do MVP
1. **Autenticação:** cadastro, login/logout, recuperação de senha, confirmação de e-mail e perfis.
2. **Prestadores e serviços:** perfis, anúncios ativos/inativos, categorias, preços fixo/inicial/sob orçamento; imagens somente após upload seguro.
3. **Descoberta:** catálogo público, detalhes, busca por prefixo dentro do contrato de API, filtros e paginação no servidor.
4. **Negociação:** solicitação de orçamento, uma proposta vigente por pedido, histórico imutável de revisões, recusa/cancelamento antes do aceite.
5. **Contratação:** aceite explícito e atômico da versão vigente, termos preservados, proteção contra duplicação.
6. **Atendimento:** prestador inicia/informa finalização; cliente confirma conclusão; histórico de transições e controle de acesso.
7. **Qualidade:** API, persistência, testes automatizados e integrados, autorizações no backend, documentação e revisão por PR.
8. **Apresentação:** landing page do produto, interface responsiva e acessível (atividade planejada em [NM-05](https://github.com/dp-tech021/nutri-med/issues/10)).

**Fora do MVP inicial:** pagamentos bancários reais, chat, avaliações públicas, painel administrativo, notificações, agenda, cancelamento acordado após contratação. O [PR #5](https://github.com/dp-tech021/nutri-med/pull/5) contém apenas uma **tela de pagamento simulada**, sem Pix, cartão, boleto, gateway, cobrança, webhook ou transferência reais. Gateway, comissão, split, repasses e estornos são tópicos de **evolução futura**, sujeitos a decisões de negócio e custo.

**Saídas esperadas:** interface utilizável por cliente e prestador, API autorizada, dados persistentes, registro correto das condições aceitas, estados e histórico de atendimento, instruções locais e evidências de testes. Essas saídas **ainda não foram comprovadas ponta a ponta**.

## 3. Arquitetura registrada para o desenvolvimento

| Camada | Tecnologias no código / decisão | Observação |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router | Código em [PR #4](https://github.com/dp-tech021/nutri-med/pull/4) |
| Autenticação | Supabase Auth | Cadastro e sessões; verificar recuperação real por e-mail |
| Backend | Supabase Edge Functions (TypeScript/Deno) | API para regras de negócio e autorização no servidor |
| Persistência | PostgreSQL do Supabase, migrations SQL e RLS | Bloquear acesso direto do navegador a dados de negócio |
| Imagens | Supabase Storage (planejado) | Upload desativado até validação de conteúdo e autorização |
| Hospedagem frontend | Cloudflare Pages Free (candidata) | Sem publicação em produção autorizada |
| Ambiente local | Node.js/npm, Supabase CLI e motor de contêiner (Docker ou compatível) | Testes de banco e API são obrigatórios |
| Versionamento | Git, GitHub Issues, Pull Requests e GitHub Actions | Revisão cruzada pelos dois desenvolvedores |

A arquitetura de referência inicial sugeria Firebase. O [PR #3](https://github.com/dp-tech021/nutri-med/pull/3) registra a escolha posterior de Supabase para viabilizar a API sem habilitar faturamento no desenvolvimento. **Não implementar dois backends nem migrar por impulso.**

**Custos:** frontend e ferramentas de desenvolvimento podem ser utilizados sem licença paga; Supabase Free, Cloudflare Pages Free e GitHub Free têm **quotas e limitações**. Gratuidade no protótipo não garante operação comercial 24/7 nem domínio, SMTP e pagamentos sem custo. Ver documentação oficial e confirmar limites no momento do deploy: [Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase), [Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/) e [GitHub](https://docs.github.com/). **Orçamento operacional autorizado: R$ 0. Não ativar cobrança sem autorização expressa.**

## 4. Estado real do repositório (10/11/2026)

| Local | Conteúdo e situação |
| --- | --- |
| `main` | Branch principal ainda sem a aplicação completa; contém inicialização do repositório |
| [PR #2](https://github.com/dp-tech021/nutri-med/pull/2) | Diretrizes, preparação e escopo — pendente de revisão/integração |
| [PR #3](https://github.com/dp-tech021/nutri-med/pull/3) | Arquitetura, decisão tecnológica e custos — pendente |
| [PR #4](https://github.com/dp-tech021/nutri-med/pull/4) | MVP codificado em branch; **QA integrado de Supabase/SQL não foi comprovado** |
| [PR #5](https://github.com/dp-tech021/nutri-med/pull/5) | Pagamento **somente simulado**; depende do PR #4 |
| [PR #38](https://github.com/dp-tech021/nutri-med/pull/38) | Histórico da organização inicial: backlog, responsáveis, templates e README |

**O que está codificado no PR #4:** catálogo, login/cadastro, telas de cliente/prestador, serviços, pedidos, propostas, aceite, conclusão, API, migrations e testes. **O que falta validar:** migrations em banco real/local, isolamento de contas, filtros/paginação, concorrência de aceite, e-mail/SMTP, acessibilidade, carga e uploads. A CI não substitui testes integrados; o teste integrado pode ser ignorado sem chaves **locais** de teste. Há pendência de `package-lock.json` na branch de desenvolvimento. Não declarar pronto para produção.

## 5. Como executar o MVP localmente (branch de desenvolvimento)

**Pré-requisitos:** Git, Node.js compatível com o projeto, npm, Supabase CLI e Docker/motor de contêiner disponível. Estes comandos são **instruções**, não evidências de execução bem-sucedida.

```bash
git clone https://github.com/dp-tech021/nutri-med.git
cd nutri-med
git fetch origin
git switch feat/mvp-plataforma-servicos
npm install
npx supabase start
npx supabase status
```

Copie `.env.example` para `.env.local` **localmente** e substitua **apenas as chaves públicas locais** usando a saída de `npx supabase status`. O frontend utiliza `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_API_URL`. **Nunca inserir chave `service_role`, segredo de banco, token ou dado pessoal real em variáveis `VITE_`**, arquivos versionados, mensagens de IA ou screenshots.

Em dois terminais separados na mesma pasta:

```bash
npm run api:serve
```

```bash
npm run dev
```

Abrir a URL exibida pelo Vite. O servidor local e as portas são definidos pelo ambiente/CLI. Não expor a API local à internet.

### Verificação obrigatória
```bash
npm run typecheck
npm test
npm run build
npx supabase db reset
```

O teste integrado adicional está definido em `npm run test:integration`, **somente para Supabase local**, com `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY` e `TEST_SUPABASE_SERVICE_ROLE_KEY` locais. Não executar contra ambientes remotos nem publicar essas credenciais. A verificação integrada ainda está **pendente** e será responsabilidade do backend com revisão de segurança.

## 6. Time, responsabilidades e revisão

| Conta GitHub | Responsabilidade principal |
| --- | --- |
| [@Id-UserDanilo](https://github.com/Id-UserDanilo) | **Frontend**: landing page, React, formulários, UX, acessibilidade, configurações de segurança do frontend e coordenação da revisão de segurança |
| [@o-tedd](https://github.com/o-tedd) | **Backend**: API, banco PostgreSQL, migrations, autenticação/autorização no servidor, RLS, integrações, transações e testes integrados |
| Ambos | Definição de produto, decisões de custo/regulação, revisão cruzada e aprovação de entregas |

**Regra de segurança:** a interface pode ocultar controles, mas apenas o backend pode **autorizar** acesso ou alterar transações. Segredos administrativos ficam exclusivamente no servidor.

**Processo:** Issue → branch pequena → implementação e testes → Pull Request → revisão cruzada → autorização de merge → atualização da Issue. Não fazer merge, deploy de produção nem habilitar faturamento sem autorização explícita.

## 7. Backlog, fases e decisões pendentes

- [Todas as Issues](https://github.com/dp-tech021/nutri-med/issues)
- [Backlog e roadmap detalhado](docs/backlog.md)
- [Questões de produto e operação ainda sem resposta](docs/questoes-em-aberto.md)
- [Processo de colaboração](docs/processo-colaboracao.md)
- [Tarefas de Id-UserDanilo](https://github.com/dp-tech021/nutri-med/issues?q=is%3Aissue+assignee%3AId-UserDanilo)
- [Tarefas de o-tedd](https://github.com/dp-tech021/nutri-med/issues?q=is%3Aissue+assignee%3Ao-tedd)

| Fase | Resultado esperado |
| --- | --- |
| **F1 — Fundação** | Produto e segmentos definidos, documentação, estrutura, landing page e ambiente reproduzível |
| **F2 — Plataforma** | Auth, perfis, serviços, catálogo e solicitações integradas |
| **F3 — Contratação e QA** | Propostas, aceite, execução, conclusão, testes reais e homologação |
| **F4 — Futuro financeiro** | Checkout simulado (opcional) e, sob novas autorizações, gateway e repasses reais |

**Decisões que ainda bloqueiam planejamento comercial:** categorias permitidas e elegibilidade/verificação de prestadores, tipos de cliente/prestador atendidos no piloto, modelo de receita e recebedor, responsabilidades de suporte/disputas, limites operacionais, critérios de sucesso e tratamento de dados pessoais. O posicionamento como marketplace generalista está definido; detalhes de público inicial e categorias ainda precisam ser aprovados. Todas estão registradas em Issues e no documento de questões em aberto.

## 8. Segurança, privacidade e definição de pronto

- Usar contas e dados **sintéticos** em QA. Testes não dispensam a LGPD quando houver dados pessoais reais.
- Bloquear acesso direto do navegador às tabelas de negócio; autenticar/autorizar no backend.
- Testar alterações de IDs, papéis, preços, versões antigas, operações simultâneas e contratos duplicados.
- Verificar uploads e arquivos antes de publicá-los; manter upload desativado até aprovação técnica.
- Proteger senhas/tokens/chaves e revisar logs, erros e dependências.
- **Pronto** significa funcionalidade testada, documentada, revisada, integrada e com critérios de aceite atendidos — não apenas código gerado por IA.

### Links de especificação (em branches de desenvolvimento/revisão)
- [Escopo original resumido (PR #2)](https://github.com/dp-tech021/nutri-med/blob/chore/preparacao-inicial-mvp/docs/escopo-mvp.md)
- [Arquitetura detalhada (PR #3)](https://github.com/dp-tech021/nutri-med/blob/docs/arquitetura-mvp-custo-zero/docs/arquitetura-mvp.md)
- [QA pendente (PR #4)](https://github.com/dp-tech021/nutri-med/blob/feat/mvp-plataforma-servicos/docs/qa-pendente.md)
- [Limites do pagamento simulado (PR #5)](https://github.com/dp-tech021/nutri-med/blob/feat/tela-pagamento-simulado/docs/pagamento-simulado.md)

## 9. Licença

**Licença do código ainda não definida**. Um repositório público no GitHub não concede, por si só, permissão geral para copiar, redistribuir ou utilizar o código fora das condições legais aplicáveis. A dupla deve decidir e registrar uma licença antes de distribuir o projeto. Ver [NM-38](https://github.com/dp-tech021/nutri-med/issues/44) quando cadastrada.

**Não coletar dados pessoais sensíveis, incluindo informações de saúde, nem lançar cobranças ou publicar produção antes das decisões, testes e autorizações necessários.**
