# Visão do produto — NM-01

## Contexto e decisão
O Nutri-Med deixa de ser definido como puramente generalista. É uma aplicação única com Saúde e Serviços Gerais, compartilhando conta, autenticação, infraestrutura e componentes.

## Motivo e alternativas
A proposta inclui profissionais de saúde e prestadores gerais. Uma plataforma somente médica excluiria serviços gerais; uma puramente generalista apagaria as particularidades da saúde; dois sites duplicariam custo e manutenção.

## Consequências e contrato futuro
Home e rotas distintas. O catálogo existente permanece em `/servicos`. `/saude` é informativa até a API suportar `domain: 'health' | 'services'`. Preservar registros atuais como serviços gerais em eventual migração incremental. Saúde: profissão, especialidade, registro informado sem selo de verificação, cidade e modalidade. Serviços: categoria, cidade, modalidade e preço quando suportado. Validar domínio no servidor; não classificar por texto livre. Em Saúde, usar “Solicitar atendimento” sem campo clínico. Não coletar sintomas, exames, diagnóstico ou prontuário. Usar só dados sintéticos nos testes. Pagamento real segue fora do escopo.

## NM-01
Resolvido: Saúde e Serviços Gerais no mesmo aplicativo, em áreas distintas. Pendentes: categorias iniciais, regiões, critérios e verificação profissional, monetização, regras comerciais e suporte. Não fechar a issue por esta decisão parcial.
