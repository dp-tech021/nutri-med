export function Notice({ error, ok }: { error?: string; ok?: string }) {
  return <>
    {error && <p role="alert" className="error">{error}</p>}
    {ok && <p role="status">{ok}</p>}
  </>;
}
