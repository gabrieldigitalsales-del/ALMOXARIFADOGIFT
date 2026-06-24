-- ============================================================
-- ADICIONAL SEGURO - MAQUINAS VENDIDAS / NUMERO DE SERIE
-- Sistema: ALMOXARIFADO GIFT EXCELLENCE
--
-- IMPORTANTE:
-- Este script NAO apaga nenhuma tabela existente.
-- Ele apenas cria a tabela para o historico de maquinas vendidas.
-- Execute no Supabase SQL Editor antes de usar a tela "Maquinas Vendidas".
-- ============================================================

create extension if not exists pgcrypto;

create or replace function public.giftx_almox_siqueira_2026_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.giftx_almox_siqueira_2026_sold_machines (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists giftx_almox_siqueira_2026_sold_machines_data_gin
on public.giftx_almox_siqueira_2026_sold_machines using gin (data);

create index if not exists giftx_almox_siqueira_2026_sold_machines_created_idx
on public.giftx_almox_siqueira_2026_sold_machines (created_at desc);

create index if not exists giftx_almox_siqueira_2026_sold_machines_serial_idx
on public.giftx_almox_siqueira_2026_sold_machines ((data->>'serialNumber'));

create or replace trigger giftx_almox_siqueira_2026_sold_machines_updated
before update on public.giftx_almox_siqueira_2026_sold_machines
for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

alter table public.giftx_almox_siqueira_2026_sold_machines enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'giftx_almox_siqueira_2026_sold_machines'
      and policyname = 'giftx_almox_siqueira_2026_public_sold_machines'
  ) then
    create policy giftx_almox_siqueira_2026_public_sold_machines
    on public.giftx_almox_siqueira_2026_sold_machines
    for all using (true) with check (true);
  end if;
end $$;

-- Conferencia:
-- select id, data->>'serialNumber' as serie, data->>'machineName' as maquina, data->>'customerName' as cliente, data->>'soldAt' as data
-- from public.giftx_almox_siqueira_2026_sold_machines
-- order by created_at desc;
