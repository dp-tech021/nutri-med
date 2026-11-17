# Visão do produto — NM-01

## Estado consolidado para revisão de integração — 17/11/2026

Nutri-Med é uma plataforma única com duas áreas distintas, **Saúde** e **Serviços Gerais**. Saúde inclui médicos, nutricionistas, psicólogos, fisioterapeutas e outros profissionais da saúde. Serviços Gerais inclui prestadores como eletricistas, encanadores, pintores, técnicos, diaristas e outros, conforme a taxonomia disponível; esses exemplos não criam novas categorias.

- **Saúde:** descoberta, profissão/especialidade informada, cidade, modalidade, perfil público e painel profissional para atributos e ofertas existentes. Registro é informado pelo profissional e não verificado oficialmente. Cadastro inicial Saúde na UI e solicitação administrativa continuam bloqueados; `POST /requests` Saúde é rejeitado.
- **Serviços Gerais:** catálogo, categorias, preços, anúncios, orçamento, propostas, aceite, acompanhamento e conclusão.
- **Limites:** não há prontuário, atendimento clínico ou coleta de sintomas/exames/histórico clínico; upload continua bloqueado e pagamento real fora do escopo. Não há verificação oficial de registro profissional.
- **Integração:** frontend, API, oito migrations, homologação e hardening estão reunidos para revisão na branch `integration/nm-mvp-saude-servicos`. Nenhuma aplicação remota ou publicação decorre dessa preparação. Ver [homologação integrada](homologacao-integrada.md).

Os recortes históricos abaixo preservam decisões e contratos propostos em entregas anteriores. Afirmações históricas de “apenas informativa”, “futuro” ou “não implementado” não descrevem o estado consolidado acima. NM-01 continua aberta para decisões comerciais, elegibilidade, regiões, verificação e suporte; testes técnicos não encerram essas decisões.

## Contexto e decisão
O Nutri-Med deixa de ser definido como puramente generalista. É uma aplicação única com Saúde e Serviços Gerais, compartilhando conta, autenticação, infraestrutura e componentes.

## Motivo e alternativas
A proposta inclui profissionais de saúde e prestadores gerais. Uma plataforma somente médica excluiria serviços gerais; uma puramente generalista apagaria as particularidades da saúde; dois sites duplicariam custo e manutenção.

## Histórico — consequências e contrato anterior à descoberta por domínio
Home e rotas distintas. O catálogo existente permanece em `/servicos`. `/saude` é informativa até a API suportar `domain: 'health' | 'services'`. Preservar registros atuais como serviços gerais em eventual migração incremental. Saúde: profissão, especialidade, registro informado sem selo de verificação, cidade e modalidade. Serviços: categoria, cidade, modalidade e preço quando suportado. Validar domínio no servidor; não classificar por texto livre. Em Saúde, usar “Solicitar atendimento” sem campo clínico. Não coletar sintomas, exames, diagnóstico ou prontuário. Usar só dados sintéticos nos testes. Pagamento real segue fora do escopo.

## NM-01
Resolvido: Saúde e Serviços Gerais no mesmo aplicativo, em áreas distintas. Pendentes: aprovação comercial da taxonomia inicial, regiões, critérios e verificação profissional, monetização, regras comerciais e suporte. Não fechar a issue por esta decisão parcial.

## Histórico — contrato mínimo proposto antes da implementação por domínio

```ts
type MarketplaceDomain = 'health' | 'services';
```

Domínio descreve a oferta, não o papel da conta (`cliente | prestador`). Não criar duas contas ou dois aplicativos. O perfil e a autenticação existentes permanecem compartilhados; atributos específicos deverão pertencer à oferta/perfil profissional do domínio.

| Domínio | Categorias | Filtros previstos | Atributos específicos |
| --- | --- | --- | --- |
| `services` | Taxonomia atual identificada por slug, mantida até decisão explícita | Prefixo de serviço/prestador, categoria, cidade e modalidade existentes; preço só se o contrato de API passar a suportá-lo | Descrição, cidade, modalidade, tipo de preço e valor em centavos conforme regras atuais |
| `health` | Taxonomia própria aprovada por profissão e especialidade; exemplos não são categorias já habilitadas | Profissão, especialidade, cidade/região e modalidade, somente após suporte no servidor | Profissão, especialidades, conselho/órgão, número e UF/jurisdição de registro **informados**, modalidade e localização pública mínima |

IDs/slugs de categoria devem ser vinculados ao domínio. Categorias de Saúde não podem ser publicadas ou retornadas como Serviços Gerais. Categorias, profissões, especialidades e regiões iniciais ainda dependem da NM-01/NM-34/NM-37; esta tabela não aprova uma lista comercial nem habilita filtros na interface.

### Compatibilidade de dados legados

Planejar evolução incremental: registros sem domínio são interpretados como `services`, nunca classificados pelo título, nome, categoria em texto livre ou pelo nome Nutri-Med. Preservar IDs, categorias, preços, vínculos, pedidos, versões de propostas e snapshots históricos; não converter anúncios antigos em Saúde automaticamente. Novos registros deverão exigir domínio explícito após a ativação do contrato. O endpoint existente `/catalog` mantém semântica de Serviços Gerais para clientes antigos. Apenas uma futura API versionada/compatível habilitará seleção explícita; ausência de domínio em endpoints legados não deve abrir acesso a Saúde. Backfill e rollout precisam de testes de compatibilidade e plano reversível em tarefa posterior. **Nenhum backfill, coluna ou migração foi executado aqui.**

### Validação obrigatória da API futura

- Aceitar somente `health | services`; rejeitar domínios desconhecidos e combinações de categoria/filtro/atributo de outro domínio, sem fallback silencioso.
- Aplicar escopo por domínio também em detalhes, publicação, edição, paginação e criação de solicitações; não confiar em esconder controles no frontend.
- Validar taxonomia aprovada, tipos, comprimentos, modalidade, região e condições de preço; rejeitar campos desconhecidos. Manter autorização por conta/proprietário e transições existentes no servidor.
- Para Saúde, validar campos de registro conforme profissão e jurisdição decididas. Registro com formato válido **não comprova habilitação**. Impedir que o cliente grave status de verificação, evidência ou selo oficial.
- Diferenciar `registrationReported` (declaração do profissional) de eventual `verificationStatus` controlado pelo servidor (`not_verified`, `pending`, `verified`, `rejected`, `expired`). Uma futura verificação oficial exige fonte competente, responsável, evidência auditável, data e validade; um número informado, cadastro ou login não autorizam selo. Não exibir “verificado” enquanto esse processo não existir.
- Não reutilizar o campo livre de necessidade de Serviços Gerais para sintomas ou dados clínicos em Saúde. Jornada de atendimento e minimização de dados exigem desenho próprio antes de ativação.

### Limites históricos da entrega inicial (PR #56)

Somente conteúdo e navegação frontend, testes e documentação. Não implementados: discriminação de domínio persistida, taxonomias de Saúde, API/filtros por domínio, registro profissional estruturado, verificação oficial, agendamento ou solicitação de atendimento de saúde. Sem alterações em Supabase, migrações ou credenciais. As jornadas existentes de autenticação, recuperação, perfis, painéis e solicitações seguem preservadas; verificação frontend não equivale a validação integrada do backend.

## Histórico — texto proposto para a NM-01 na entrega inicial

> Decisão parcial: Nutri-Med é uma aplicação única com duas áreas distintas, Saúde e Serviços Gerais, compartilhando conta, autenticação, infraestrutura e design system. Serviços Gerais preserva o catálogo `/servicos` e o fluxo existente. Saúde possui somente página informativa `/saude`, sem catálogo ou atendimento implementado. O contrato futuro é `MarketplaceDomain = 'health' | 'services'`, com categorias, filtros e atributos por domínio e preservação dos registros legados como `services`. Registro profissional informado não equivale a verificação oficial. **Manter NM-01 aberta**: faltam categorias iniciais, regiões, critérios de elegibilidade e verificação profissional, monetização, regras comerciais e suporte. Não considerar Saúde concluída pelo PR #56.

A atualização efetiva da issue depende de acesso de escrita ao GitHub; o texto acima é proposta, não evidência de alteração da issue.

## Evolução incremental após o PR #56

O texto acima registra o contrato e os limites históricos da primeira entrega. A branch `feat/nm-catalogo-perfis-por-dominio` implementa o discriminador, a migração aditiva, catálogo/perfis por domínio e descoberta de Saúde, sem atendimento ou agendamento. Ver [contrato implementado e recuperação](catalogo-dominios.md). A aprovação das categorias comerciais, regiões, critérios, monetização e suporte continua pendente na NM-01; implementação técnica não aprova a operação de Saúde.

## Domínio profissional, clientes e evolução futura

`profiles.domain` classifica principalmente a atuação profissional do **prestador**, separadamente de `kind` (`cliente | prestador`). Cliente não pertence funcionalmente a um único marketplace: pode navegar nas duas áreas e é elegível, no modelo do produto, a contratar em Saúde e Serviços Gerais conforme a jornada de cada área seja habilitada. O default legado `services` no registro de um cliente é compatibilidade técnica, **não** uma restrição de navegação ou permissão de consumo.

Na implementação atual, contratação por orçamento está disponível somente em Serviços Gerais. Solicitação administrativa, agendamento e contratação de Saúde ainda estão bloqueados; a elegibilidade do cliente às duas áreas não significa que esses recursos foram implementados.

No MVP, **cada conta de prestador tem um único domínio profissional**, intencionalmente. Isso mantém coerência de perfil/anúncios com a FK composta existente; domínio não concede papel, propriedade ou autorização. `Prestador multi-domínio` é uma possível evolução futura, que exigirá desenho de perfis profissionais vinculados à mesma conta, compatibilidade de IDs, regras de acesso e migração específica. Não foi implementada nesta tarefa.

### UNIQUE composta e FK

`profiles.user_id` já é PRIMARY KEY, portanto `(user_id, domain)` não permite mais duplicações do que a PK: a UNIQUE composta é logicamente redundante quanto à unicidade de contas. Ela é, porém, a chave única explícita referenciada por `services(owner_id, domain) → profiles(user_id, domain)`. PostgreSQL exige uma chave única adequada ao conjunto de colunas referenciado; não deduz essa chave composta a partir da PK de apenas `user_id`.

Por isso `profiles_user_domain_unique` foi preservada, junto com seu índice e a FK. O custo desse índice é uma escolha consciente do MVP para manter integridade do domínio sem redesenhar o banco. O teste PostgreSQL local confirma que removê-la sem CASCADE falha por dependência da FK; não se deve contornar isso removendo integridade referencial.

### Taxonomia inicial de Saúde

A nova migration `202611170002_initial_health_taxonomy.sql` adiciona, sem substituir registros existentes: Médico (`medico`), Nutricionista (`nutricionista`), Psicólogo (`psicologo`), Fisioterapeuta (`fisioterapeuta`) e Outro profissional da saúde (`outro-profissional-saude`).

Como a modelagem atual exige especialidade, cada profissão recebe apenas `atuacao-geral` — **Atuação geral informada**. É um preenchimento técnico neutro, não um título de especialista. Evitou-se atribuir “Clínica geral” como qualificação médica por inferência. Esta lista não é taxonomia médica completa, não representa certificação, não afirma habilitação legal nem verificação de conselho. Será ampliada após decisão de produto. O seed não cria profissionais, contas, anúncios ou dados clínicos.

Os INSERTs usam `ON CONFLICT DO NOTHING` por chave, podendo ser repetidos sem duplicação e sem sobrescrever rótulos personalizados. Ampliações ou mudanças posteriores devem ter migration própria e preservar referências existentes; a migration de domínios já aplicada não foi modificada.
