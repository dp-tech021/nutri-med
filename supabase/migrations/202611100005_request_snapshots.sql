alter table public.requests
  add column snapshot_category text,
  add column snapshot_city text,
  add column snapshot_modality text,
  add column snapshot_price_type text,
  add column snapshot_price_cents integer;
-- Campos duplicados em requests preservam as condições anunciadas no momento do pedido.
-- Contratos usam os valores e prazo da proposta aceita, preservados em contracts.
