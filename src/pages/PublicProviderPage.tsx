import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, money, type Service } from '../api';
import { Layout } from '../components/Layout';
import { Notice } from '../components/Notice';
import { errorMessage } from '../utils/errors';

type ProviderView = {
  provider: { display_name: string; about: string; city: string; category: string };
  services: Service[];
};

export function PublicProviderPage() {
  const { id } = useParams();
  const [data, setData] = useState<ProviderView | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void api<ProviderView>('/providers/' + id).then(setData).catch((requestError) => setError(errorMessage(requestError)));
  }, [id]);

  return <Layout>{!data
    ? <Notice error={error || 'Carregando perfil...'} />
    : <>
      <h1 className="text-3xl font-bold">{data.provider.display_name}</h1>
      <p className="my-3">{data.provider.city} • {data.provider.category}</p>
      <p className="my-3">{data.provider.about}</p>
      <h2 className="text-xl font-semibold">Serviços ativos</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {data.services.map((service) => <Link className="card" key={service.id} to={'/servico/' + service.id}>{service.title} — {money(service.price_cents)}</Link>)}
      </div>
    </>}
  </Layout>;
}
