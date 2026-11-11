import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Service } from '../api';
import { Layout } from '../components/Layout';
import { readableLabel, ServiceCard } from '../components/ServiceCard';
import { Breadcrumbs, EmptyState, ErrorState, LoadingState } from '../components/ui';
import { errorMessage } from '../utils/errors';

type ProviderView = {
  provider: { display_name: string; about: string; city: string; category: string };
  services: Service[];
};

export function PublicProviderPage() {
  const { id } = useParams();
  const [data, setData] = useState<ProviderView | null>(null);
  const [error, setError] = useState('');
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError('');
    void api<ProviderView>(`/providers/${id}`, 'GET', undefined, undefined, controller.signal)
      .then(setData)
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError));
      });
    return () => controller.abort();
  }, [id, requestKey]);

  const initial = data?.provider.display_name.trim().charAt(0).toLocaleUpperCase('pt-BR') || 'P';
  return <Layout>
    <Breadcrumbs items={[{ label: 'Serviços', to: '/servicos' }, { label: data?.provider.display_name || 'Perfil do prestador' }]} />
    {error && <ErrorState title="Não foi possível carregar o perfil" description="O perfil pode estar indisponível ou sua conexão pode ter sido interrompida." onRetry={() => setRequestKey((current) => current + 1)} />}
    {!data && !error && <LoadingState label="Carregando perfil do prestador..." />}
    {data && <>
      <header className="provider-header">
        <div className="provider-avatar provider-avatar--large" role="img" aria-label="Prestador sem foto disponível"><span aria-hidden="true">{initial}</span></div>
        <div>
          <p className="eyebrow">Perfil público do prestador</p>
          <h1>{data.provider.display_name}</h1>
          <p className="provider-header__meta">{data.provider.city || 'Cidade não informada'}{data.provider.category ? ` · ${readableLabel(data.provider.category, '')}` : ''}</p>
        </div>
      </header>
      <section className="provider-about" aria-labelledby="provider-about-title">
        <h2 id="provider-about-title">Apresentação</h2>
        <p>{data.provider.about || 'Este prestador ainda não adicionou uma apresentação pública.'}</p>
      </section>
      <section className="provider-services" aria-labelledby="provider-services-title">
        <div className="catalog-results-heading">
          <h2 id="provider-services-title">Serviços ativos</h2>
          <span>{data.services.length} {data.services.length === 1 ? 'serviço' : 'serviços'}</span>
        </div>
        {data.services.length > 0
          ? <div className="services-grid">{data.services.map((service) => <ServiceCard key={service.id} service={{ ...service, provider_name: data.provider.display_name }} />)}</div>
          : <EmptyState title="Nenhum serviço ativo" description="Este prestador não possui serviços públicos disponíveis no momento." />}
      </section>
    </>}
  </Layout>;
}
