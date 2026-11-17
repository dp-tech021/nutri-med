import { Button } from './ui';

/** There is deliberately no health request form until an administrative API exists. */
export function HealthRequestNotice() {
  return <section aria-labelledby="health-request-title">
    <h2 id="health-request-title">Solicitar atendimento</h2>
    <p>O envio de solicitações administrativas de Saúde ainda não está disponível. Não há confirmação de horário ou atendimento pela plataforma.</p>
    <p>Não envie sintomas, exames, diagnósticos ou informações clínicas.</p>
    <Button disabled aria-describedby="health-request-unavailable">Solicitar atendimento</Button>
    <p id="health-request-unavailable">Envio indisponível enquanto esta jornada está em preparação.</p>
  </section>;
}
