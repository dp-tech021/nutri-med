import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { api, money } from './api';

type Method = 'pix' | 'cartao' | 'boleto';
type Outcome = 'aprovado' | 'recusado' | 'pendente';
type ContractView = { request: { id: string; snapshot_title: string; client_id: string; status: string }; contract: { price_cents: number; accepted_version: number } | null };

const outcomeLabels: Record<Outcome, string> = {
  aprovado: 'Pagamento aprovado (simulação)',
  recusado: 'Pagamento recusado (simulação)',
  pendente: 'Pagamento pendente (simulação)',
};

function Result({ outcome, reset }: { outcome: Outcome; reset: () => void }) {
  return <section className="card mt-5" aria-live="polite" role="status">
    <h2 className="text-xl font-semibold">{outcomeLabels[outcome]}</h2>
    <p className="mt-2">Esse resultado é apenas visual. Não houve cobrança, transferência, autorização de cartão ou alteração do pedido.</p>
    <p className="my-3 muted">Não existe comprovante bancário nem transação financeira para esta demonstração.</p>
    <button className="btn btn-outline" type="button" onClick={reset}>Testar outro resultado</button>
  </section>;
}

export function PaymentDemo({ session, userId }: { session: Session | null; userId: string | null }) {
  const { id: requestId } = useParams();
  const [contract, setContract] = useState<ContractView | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(requestId));
  const [method, setMethod] = useState<Method>('pix');
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  useEffect(() => {
    if (!requestId) { setContract(null); setLoading(false); return; }
    let current = true;
    setLoading(true);
    setError('');
    setContract(null);
    if (!session || !userId) {
      setError('Faça login como cliente para visualizar a simulação vinculada a uma contratação.');
      setLoading(false);
      return;
    }
    void api<ContractView>('/requests/' + encodeURIComponent(requestId), 'GET', undefined, session)
      .then(data => {
        if (!current) return;
        if (data.request.client_id !== userId) {
          setError('Somente o cliente da contratação pode abrir esta demonstração.');
        } else if (!data.contract) {
          setError('Ainda não há proposta aceita para este pedido.');
        } else setContract(data);
      })
      .catch(() => { if (current) setError('Não foi possível consultar essa contratação.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [requestId, session, userId]);

  const amount = requestId ? contract?.contract?.price_cents : 15990;
  const title = requestId ? contract?.request.snapshot_title : 'Atendimento fictício de demonstração';
  const canSimulate = !loading && !error && Number.isSafeInteger(amount) && amount !== undefined && amount >= 0;

  return <section className="max-w-2xl mx-auto">
    <div className="bg-amber-50 text-amber-950 border border-amber-300 p-4 rounded-xl mb-5" role="note">
      <strong>AMBIENTE DE TESTES — NENHUM PAGAMENTO REAL</strong>
      <p>Não informe número de cartão, CVV, CPF, chave Pix, dados bancários ou outras informações pessoais. Nenhum pagamento será processado.</p>
    </div>
    <h1 className="text-3xl font-bold">Simulador de pagamento</h1>
    <p className="muted my-3">Teste a aparência da etapa de pagamento sem contratar um gateway financeiro.</p>
    {loading && <p role="status">Consultando pedido...</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {canSimulate && <div className="card mt-4">
      <h2 className="font-semibold text-xl">Resumo da simulação</h2>
      <p className="my-2">{title}</p>
      <p className="text-3xl font-bold my-3">{money(amount!)}</p>
      <p className="muted text-sm">Este valor é somente para demonstração. Nenhum saldo ou estado de contratação é modificado.</p>
      <fieldset className="mt-5">
        <legend className="font-semibold mb-2">Método ilustrativo</legend>
        <div className="grid sm:grid-cols-3 gap-2">
          {([
            ['pix', 'Pix (fictício)'],
            ['cartao', 'Cartão (fictício)'],
            ['boleto', 'Boleto (fictício)']
          ] as const).map(([value, label]) => <label key={value} className="border rounded-lg p-3 flex gap-2 items-center cursor-pointer">
            <input name="metodo-demo" type="radio" checked={method === value} onChange={() => { setMethod(value); setOutcome(null); }} />
            <span>{label}</span>
          </label>)}
        </div>
      </fieldset>
      <div className="rounded-lg bg-emerald-50 p-3 mt-4 text-sm">
        {method === 'pix' ? 'Nenhum QR Code ou chave Pix será gerado.' : method === 'cartao' ? 'Não são solicitados dados de cartão; nenhum processador financeiro será chamado.' : 'Nenhuma linha digitável ou boleto será emitido.'}
      </div>
      <fieldset className="mt-5">
        <legend className="font-semibold mb-3">Escolha o resultado que deseja testar</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={() => setOutcome('aprovado')}>Simular aprovação</button>
          <button type="button" className="btn btn-outline" onClick={() => setOutcome('recusado')}>Simular recusa</button>
          <button type="button" className="btn btn-outline" onClick={() => setOutcome('pendente')}>Simular pendência</button>
        </div>
      </fieldset>
    </div>}
    {outcome && canSimulate && <Result outcome={outcome} reset={() => setOutcome(null)} />}
    <p className="my-5"><Link to={requestId ? '/pedido/' + requestId : '/'}>Voltar</Link></p>
  </section>;
}
