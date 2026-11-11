import { Alert } from './ui';

export function Notice({ error, ok }: { error?: string; ok?: string }) {
  return <>
    {error && <Alert variant="error" title="Não foi possível concluir">{error}</Alert>}
    {ok && <Alert variant="success" title="Tudo certo">{ok}</Alert>}
  </>;
}
