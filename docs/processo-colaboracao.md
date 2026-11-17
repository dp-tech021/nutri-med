# Nutri-Med — Processo da dupla e definição de pronto

## Responsabilidades
| Tema | Implementa | Revisa/valida |
|---|---|---|
| Landing page, páginas React, UX, acessibilidade | @Id-UserDanilo | @o-tedd revisa contratos e integração |
| Configurações de segurança frontend, headers, tokens públicos, privacidade de interface | @Id-UserDanilo | @o-tedd revisa reflexos de API |
| Banco, migrações, Edge Functions, autenticação backend, RLS | @o-tedd | @Id-UserDanilo revisa critérios de acesso e jornadas |
| Fluxo de contratação, atomicidade, concorrência, futuros webhooks | @o-tedd | @Id-UserDanilo valida tratamento de erros e segurança |
| Escopo, custos, decisão financeira e mudança de fase | **Ambos** | **Ambos** |

## Estados de acompanhamento (proposta para GitHub Projects)
Backlog → A fazer → Em andamento → Em revisão → Concluído; use **Bloqueado** quando depender de acesso, custo ou decisão de produto. Esses estados não são sinônimos de Issue aberta/fechada no GitHub sem um Project.

## Procedimento obrigatório
1. Escolher uma Issue com dependências liberadas; confirmar que não está sendo trabalhada pela outra pessoa.
2. Criar branch `feat/nm-XX-descricao`, `fix/nm-XX-descricao`, `docs/nm-XX-descricao` ou `chore/nm-XX-descricao`.
3. Implementar a menor mudança funcional e testes proporcionais. Conferir código gerado por IA, pacote/versão e APIs reais.
4. Criar PR com vínculo à Issue, resumo, instruções de teste, screenshots quando UI, riscos e checklist de segurança.
5. Outro desenvolvedor revisa; qualquer controle de segurança/autorizações é revisado por Id-UserDanilo também.
6. Fazer merge **somente após aprovação explícita**. Atualizar a Issue com evidências e marcar concluída após a integração validada.
7. Não criar recursos pagos, fazer deploy em produção ou tratar checkout simulado como transação bancária real.

## Definition of Ready
- Objetivo e usuário beneficiado definidos.
- Critérios de aceite verificáveis e dependências listadas.
- Responsável designado no GitHub.
- Ambiente disponível e custos conhecidos; riscos/decisões pendentes explícitos.

## Definition of Done
- [ ] Implementação em branch separada e PR aberto
- [ ] Comandos de build, typecheck e testes executados e resultados documentados
- [ ] Testes de autorização e concorrência quando backend sensível
- [ ] Responsividade, acessibilidade e falhas de rede quando frontend
- [ ] Sem segredos, dados pessoais reais ou alterações de escopo escondidas
- [ ] Revisão cruzada realizada e bloqueios resolvidos
- [ ] Aprovação de merge explícita e documentação/Issue atualizadas

## Limites de segurança
- Não confiar em campos, papéis ou valores enviados pelo navegador.
- A UI é responsável por indicar estados, mas a autorização é do backend.
- Confirmar registros financeiros apenas com evento autenticado do provedor, nunca só pelo retorno do checkout.
- Não subir PDFs, imagens de clientes reais, dados de saúde ou chaves privadas em ferramentas de IA.
