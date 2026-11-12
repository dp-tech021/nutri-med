import { createClient, type Session } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'MISSING_PUBLIC_KEY'
);
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}
export async function api<T = unknown>(path: string, method = 'GET', body?: unknown, session?: Session | null, signal?: AbortSignal): Promise<T> {
  const token = session?.access_token;
  const response = await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:54321/functions/v1/api') + path, {
    method,
    headers: {
      'content-type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    signal,
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(typeof data.error === 'string' ? data.error : 'Falha na requisição', response.status);
  return data as T;
}
export type ServicePriceType = 'fixo' | 'inicial' | 'orcamento';
export type ServiceModality = 'online' | 'presencial';
export type Service = { id:string; title:string;description:string;category:string;city:string;modality:ServiceModality;price_type:ServicePriceType;price_cents:number|null;provider_name?:string;active?:boolean };
export type RequestItem = {
  id: string; snapshot_title: string; snapshot_description?: string; snapshot_category?: string | null;
  snapshot_city?: string | null; snapshot_modality?: string | null; snapshot_price_type?: string | null;
  snapshot_price_cents?: number | null; need: string; desired_date?: string | null; status: string;
  current_version: number; client_id: string; provider_id: string; provider_name?: string;
  created_at: string; updated_at?: string;
};
export type Proposal = {version:number;price_cents:number;duration_days:number;scope:string};
export const money = (cents:number|null) => cents == null ? 'Sob orçamento' : (cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export function servicePrice(service: Pick<Service, 'price_type' | 'price_cents'>) {
  if (service.price_type === 'orcamento' || service.price_cents == null) {
    return { label: 'Preço', value: 'Sob orçamento' };
  }
  return {
    label: service.price_type === 'inicial' ? 'A partir de' : 'Preço fixo',
    value: money(service.price_cents),
  };
}
