import type { DomainAttributes } from './marketplace';
export type Profile = DomainAttributes & {
  kind: 'cliente' | 'prestador';
  display_name: string;
  city: string;
  category: string;
  about: string;
};
