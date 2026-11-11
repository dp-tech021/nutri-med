import { Link } from 'react-router-dom';
import { servicePrice, type Service } from '../api';
import { Card } from './ui';

export function readableLabel(value: string, fallback: string) {
  const normalized = value.trim().replaceAll('-', ' ');
  if (!normalized) return fallback;
  return normalized.charAt(0).toLocaleUpperCase('pt-BR') + normalized.slice(1);
}

export function ServiceCard({ service }: { service: Service }) {
  const price = servicePrice(service);
  return <Card as="article" className="service-card">
    <div className="service-card__visual" role="img" aria-label="Serviço sem imagem disponível">
      <span aria-hidden="true">{service.title.trim().charAt(0).toLocaleUpperCase('pt-BR') || 'S'}</span>
    </div>
    <div className="service-card__body">
      <div className="service-card__tags">
        <span>{readableLabel(service.category, 'Sem categoria')}</span>
        <span>{readableLabel(service.modality, 'Modalidade não informada')}</span>
      </div>
      <h2>{service.title}</h2>
      {service.provider_name && <p className="service-card__provider">Por {service.provider_name}</p>}
      <p className="service-card__location">{service.city || 'Cidade não informada'}</p>
      <p className="service-card__description">{service.description}</p>
      <div className="service-card__footer">
        <p className="service-price"><span>{price.label}</span><strong>{price.value}</strong></p>
        <Link className="service-card__link" to={`/servico/${service.id}`} aria-label={`Ver detalhes de ${service.title}`}>Ver detalhes <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  </Card>;
}
