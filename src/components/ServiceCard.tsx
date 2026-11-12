import { Link } from 'react-router-dom';
import { money, type Service } from '../api';
import { Card } from './ui';

export function readableLabel(value: string, fallback: string) {
  const normalized = value.trim().replaceAll('_', ' ');
  return normalized ? normalized.charAt(0).toLocaleUpperCase('pt-BR') + normalized.slice(1) : fallback;
}

export function ServiceCard({ service }: { service: Service }) {
  const priceLabel = service.price_type === 'inicial' ? 'A partir de' : service.price_type === 'fixo' ? 'Preço fixo' : 'Preço';
  return <Card as="article" className="service-card">
    <div className="service-card__visual" aria-hidden="true"><span>{service.title.trim().charAt(0).toLocaleUpperCase('pt-BR') || 'S'}</span></div>
    <div className="service-card__body">
      <div className="service-card__tags"><span>{readableLabel(service.category, 'Sem categoria')}</span><span>{readableLabel(service.modality, 'Modalidade não informada')}</span></div>
      <h3>{service.title}</h3>
      {service.provider_name && <p className="service-card__provider">Por {service.provider_name}</p>}
      <p className="service-card__location">{service.city || 'Cidade não informada'}</p>
      <p className="service-card__description">{service.description}</p>
      <div className="service-card__footer">
        <p className="service-price"><span>{priceLabel}</span><strong>{money(service.price_cents)}</strong></p>
        <Link className="service-card__link" to={`/servico/${service.id}`}>Ver detalhes</Link>
      </div>
    </div>
  </Card>;
}
