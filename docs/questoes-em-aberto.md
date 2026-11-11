# Nutri-Med — Questões de produto e operação em aberto

> Revisado em 2026-11-10. **Pergunta registrada não significa decisão tomada.** Este documento complementa o backlog e aponta a Issue que deve registrar a resposta final, evidência e responsável.
>
> A especificação original descreve um **marketplace de serviços em geral**, enquanto o nome Nutri-Med sugere saúde/nutrição. O uso de dados de saúde, a elegibilidade de profissionais, a cobrança de comissão e a operação financeira **não estão aprovados**.

## 1. Identidade e público-alvo — [NM-01](https://github.com/dp-tech021/nutri-med/issues/6)
- [ ] Nutri-Med será plataforma exclusivamente de saúde/nutrição ou marketplace de serviços gerais?
- [ ] Quais personas serão atendidas no MVP: cliente pessoa física, empresa, autônomo, clínica, profissional registrado etc.?
- [ ] Qual problema principal resolve para cliente e prestador? Qual diferencial é mensurável?
- [ ] O projeto é demonstração/portfólio, piloto fechado ou serviço comercial aberto?
- [ ] Quais limites de escopo precisam constar na landing page sem criar promessas inexistentes?

## 2. Serviços permitidos, verificação e regras de conteúdo — [NM-34](https://github.com/dp-tech021/nutri-med/issues/40) e [NM-37](https://github.com/dp-tech021/nutri-med/issues/43)
- [ ] Quais categorias/serviços serão aceitos? Existem categorias proibidas?
- [ ] Atendimento presencial, online ou ambos? Quais cidades e regiões?
- [ ] Qual verificação da formação, licença ou registro profissional é necessária? Quem aprova?
- [ ] Haverá moderação, denúncia e suspensão de anúncios? O que fica fora da versão 1?
- [ ] Quais campos do anúncio, limites de texto, valores, prazos e imagens precisam ser aprovados?
- [ ] Dados do cliente sobre sua saúde podem constar na descrição da solicitação? Caso afirmativo, há avaliação jurídica, restrição de acesso e finalidade clara?

## 3. Modelo de negócios e pagamentos — [NM-33](https://github.com/dp-tech021/nutri-med/issues/39), [NM-30](https://github.com/dp-tech021/nutri-med/issues/35), [NM-32](https://github.com/dp-tech021/nutri-med/issues/37)
- [ ] Quem é o cliente que paga pela plataforma? Ela cobrará clientes, prestadores ou nenhum deles no MVP?
- [ ] Qual o modelo: assinatura, comissão, anúncio promovido, valor fixo ou outro?
- [ ] Em uma versão financeira real, quem receberá o pagamento e qual contrato permite split/repasses?
- [ ] Quem assume taxas, impostos, chargebacks, estornos, falhas e eventuais disputas?
- [ ] Qual gateway pode ser usado com orçamento e requisitos verificados? Quais regras de KYC, credenciamento e região se aplicam?
- [ ] Qual política financeira e antifraude deve preceder a produção?
- [ ] **Situação atual:** PR #5 é apenas **pagamento simulado**, não há Pix, cartão, transferência nem split reais.

## 4. Atendimento, suporte e políticas — [NM-35](https://github.com/dp-tech021/nutri-med/issues/41), [NM-28](https://github.com/dp-tech021/nutri-med/issues/33)
- [ ] Quem é responsável pelo serviço executado, pelo suporte, pela mediação e por reclamações?
- [ ] Como orientar cancelamento, ausência e disputa após o aceite? O MVP não implementa cancelamento comum pós-contratação.
- [ ] Termos de uso, privacidade, retenção/exclusão e canais de suporte necessários para usuários reais já foram revisados?
- [ ] Como tratar dados de crianças/adolescentes, se o público eventualmente os incluir? Não presumir permissão.
- [ ] Há licenças/registro profissional, avisos obrigatórios e avaliação legal específica para saúde e nutrição?

## 5. Identidade visual e experiência — [NM-04](https://github.com/dp-tech021/nutri-med/issues/9), [NM-05](https://github.com/dp-tech021/nutri-med/issues/10)
- [ ] Qual logo, paleta, tipografia e tom de voz aprovados?
- [ ] Que CTA, conteúdo e categorias entram na landing page?
- [ ] Quais padrões mínimos de acessibilidade e navegabilidade móvel serão exigidos?

## 6. Infraestrutura, segurança e release — [NM-03](https://github.com/dp-tech021/nutri-med/issues/8), [NM-24](https://github.com/dp-tech021/nutri-med/issues/29), [NM-25](https://github.com/dp-tech021/nutri-med/issues/30), [NM-26](https://github.com/dp-tech021/nutri-med/issues/31), [NM-27](https://github.com/dp-tech021/nutri-med/issues/32)
- [ ] Quem aprova eventual custo acima de R$ 0 e quais limites de quota/pausa de projeto são aceitáveis?
- [ ] Qual ambiente de homologação e qual URL serão utilizados?
- [ ] Como será verificado o fluxo completo com banco, contas distintas e sem skips de teste?
- [ ] Qual solução de e-mail confirma contas e recupera senhas com entrega real?
- [ ] Quais medidas de privacidade e segurança devem bloquear o deploy se não estiverem verificadas?
- [ ] Como será feito o rollback e o monitoramento, e quem responderá a incidentes?

## 7. Métricas, piloto e saída esperada — [NM-36](https://github.com/dp-tech021/nutri-med/issues/42)
- [ ] O que define sucesso de cadastro, anúncio, solicitação, proposta, aceite e conclusão?
- [ ] Qual é o piloto mínimo com contas sintéticas e os testes obrigatórios por etapa?
- [ ] Qual a diferença entre funcionalidade codificada, teste integrado aprovado e recurso em produção?
- [ ] Quais metas podem ser medidas sem coleta invasiva de dados pessoais?
- [ ] Qual será a Definition of Done adotada no GitHub?

## Como responder
Registrar resposta e evidência na **Issue indicada**; se houver decisão técnica/arquitetural relevante, criar ou atualizar ADR e relacionar seu PR. Alterar requisitos e interfaces somente após a decisão ser aceita. Não inventar respostas nem marcar tarefas concluídas por ter apenas gerado código. O projeto ainda depende da validação integrada para ser considerado funcional.
