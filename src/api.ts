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
export async function api<T = unknown>(path: string, method = 'GET', body?: unknown, session?: Session | null): Promise<T> {
  const token = session?.access_token;
  const response = await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:54321/functions/v1/api') + path, {
    method,
    headers: {
      'content-type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(typeof data.error === 'string' ? data.error : 'Falha na requisição', response.status);
  return data as T;
}
export type Service = { id:string; title:string;description:string;category:string;city:string;modality:string;price_type:string;price_cents:number|null;provider_name?:string;active?:boolean };
export type RequestItem = { id:string; snapshot_title:string;need:string;status:string;current_version:number;client_id:string;provider_id:string;created_at:string };
export type Proposal = {version:number;price_cents:number;duration_days:number;scope:string};
export const money = (cents:number|null) => cents == null ? 'Sob orçamento' : (cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
