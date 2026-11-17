/** Shared frontend/API domain vocabulary; account roles remain independent. */
export type MarketplaceDomain = 'health' | 'services';
export type RegistrationReported = { council: string; number: string; jurisdiction: string };
export type DomainAttributes =
  | { domain?: 'services'; profession?: never; specialty?: never; registration_reported?: never }
  | { domain: 'health'; profession: string; specialty: string; registration_reported?: RegistrationReported | null };

export function marketplaceDomain(value: unknown = 'services'): MarketplaceDomain {
  if (value !== 'health' && value !== 'services') throw new Error('INVALID_DOMAIN');
  return value;
}
export function validateDomainFilters(query: URLSearchParams) {
  const domain = marketplaceDomain(query.get('domain') ?? 'services');
  const allowed = ['domain', 'q', 'search_in', 'city', 'modality', 'limit', 'cursor',
    ...(domain === 'health' ? ['profession', 'specialty'] : ['category'])];
  for (const [key, value] of query) {
    if (!allowed.includes(key) || query.getAll(key).length !== 1) throw new Error('INVALID_FILTER');
    if (['profession', 'specialty'].includes(key) && !/^[a-z0-9-]{2,40}$/.test(value)) throw new Error('INVALID_FILTER');
    if (key === 'category' && value.length > 100) throw new Error('INVALID_FILTER');
  }
  return domain;
}

export function publicMarketplaceProfile(p: Record<string, unknown>) {
  const common = { user_id: p.user_id, display_name: p.display_name, city: p.city, about: p.about, domain: p.domain };
  return p.domain === 'health' ? { ...common, profession: p.profession, specialty: p.specialty,
    registration_reported: p.registration_public === true ? {
      council: p.registration_council, number: p.registration_number, jurisdiction: p.registration_jurisdiction,
    } : null,
  } : { ...common, category: p.category };
}
