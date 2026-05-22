-- ============================================================
-- ALMOXARIFADO GIFT EXCELLENCE - SUPABASE SCHEMA CORRIGIDO
-- Versao: UUID automatico + nomes unicos para nao conflitar
--
-- IMPORTANTE:
-- Este script APAGA e RECRIA as tabelas do sistema.
-- Use quando quiser deixar o banco zerado e corrigido.
--
-- Como usar:
-- Supabase > SQL Editor > New query > cole tudo > Run
-- ============================================================

-- Extensao necessaria para gerar UUID automaticamente
create extension if not exists pgcrypto;

-- ============================================================
-- LIMPEZA DAS TABELAS ANTIGAS
-- ============================================================

drop table if exists public.giftx_almox_siqueira_2026_maintenance_records cascade;
drop table if exists public.giftx_almox_siqueira_2026_production_orders cascade;
drop table if exists public.giftx_almox_siqueira_2026_purchase_orders cascade;
drop table if exists public.giftx_almox_siqueira_2026_stock_movements cascade;
drop table if exists public.giftx_almox_siqueira_2026_suppliers cascade;
drop table if exists public.giftx_almox_siqueira_2026_machine_bom_lines cascade;
drop table if exists public.giftx_almox_siqueira_2026_machine_models cascade;
drop table if exists public.giftx_almox_siqueira_2026_stock_items cascade;

-- Remove funcao antiga, se existir
-- O cascade acima ja remove triggers dependentes.
drop function if exists public.giftx_almox_siqueira_2026_set_updated_at() cascade;

-- ============================================================
-- FUNCAO DE ATUALIZACAO AUTOMATICA DO updated_at
-- ============================================================

create or replace function public.giftx_almox_siqueira_2026_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- TABELAS PRINCIPAIS
-- Padrao:
-- id uuid primary key default gen_random_uuid()
-- data jsonb para manter compatibilidade com o app
-- created_at e updated_at automaticos
-- ============================================================

create table public.giftx_almox_siqueira_2026_stock_items (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.giftx_almox_siqueira_2026_machine_models (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.giftx_almox_siqueira_2026_machine_bom_lines (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.giftx_almox_siqueira_2026_suppliers (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.giftx_almox_siqueira_2026_stock_movements (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.giftx_almox_siqueira_2026_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.giftx_almox_siqueira_2026_production_orders (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.giftx_almox_siqueira_2026_maintenance_records (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDICES PARA MELHORAR BUSCAS
-- ============================================================

create index giftx_almox_siqueira_2026_stock_items_data_gin
on public.giftx_almox_siqueira_2026_stock_items using gin (data);

create index giftx_almox_siqueira_2026_machine_models_data_gin
on public.giftx_almox_siqueira_2026_machine_models using gin (data);

create index giftx_almox_siqueira_2026_machine_bom_lines_data_gin
on public.giftx_almox_siqueira_2026_machine_bom_lines using gin (data);

create index giftx_almox_siqueira_2026_suppliers_data_gin
on public.giftx_almox_siqueira_2026_suppliers using gin (data);

create index giftx_almox_siqueira_2026_stock_movements_data_gin
on public.giftx_almox_siqueira_2026_stock_movements using gin (data);

create index giftx_almox_siqueira_2026_purchase_orders_data_gin
on public.giftx_almox_siqueira_2026_purchase_orders using gin (data);

create index giftx_almox_siqueira_2026_production_orders_data_gin
on public.giftx_almox_siqueira_2026_production_orders using gin (data);

create index giftx_almox_siqueira_2026_maintenance_records_data_gin
on public.giftx_almox_siqueira_2026_maintenance_records using gin (data);

-- Indices por data de criacao
create index giftx_almox_siqueira_2026_stock_items_created_idx
on public.giftx_almox_siqueira_2026_stock_items (created_at desc);

create index giftx_almox_siqueira_2026_machine_models_created_idx
on public.giftx_almox_siqueira_2026_machine_models (created_at desc);

create index giftx_almox_siqueira_2026_machine_bom_lines_created_idx
on public.giftx_almox_siqueira_2026_machine_bom_lines (created_at desc);

create index giftx_almox_siqueira_2026_suppliers_created_idx
on public.giftx_almox_siqueira_2026_suppliers (created_at desc);

create index giftx_almox_siqueira_2026_stock_movements_created_idx
on public.giftx_almox_siqueira_2026_stock_movements (created_at desc);

create index giftx_almox_siqueira_2026_purchase_orders_created_idx
on public.giftx_almox_siqueira_2026_purchase_orders (created_at desc);

create index giftx_almox_siqueira_2026_production_orders_created_idx
on public.giftx_almox_siqueira_2026_production_orders (created_at desc);

create index giftx_almox_siqueira_2026_maintenance_records_created_idx
on public.giftx_almox_siqueira_2026_maintenance_records (created_at desc);

-- ============================================================
-- TRIGGERS DE updated_at
-- ============================================================

create trigger giftx_almox_siqueira_2026_stock_items_updated
before update on public.giftx_almox_siqueira_2026_stock_items
for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

create trigger giftx_almox_siqueira_2026_machine_models_updated
before update on public.giftx_almox_siqueira_2026_machine_models
for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

create trigger giftx_almox_siqueira_2026_machine_bom_lines_updated
before update on public.giftx_almox_siqueira_2026_machine_bom_lines
for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

create trigger giftx_almox_siqueira_2026_suppliers_updated
before update on public.giftx_almox_siqueira_2026_suppliers
for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

create trigger giftx_almox_siqueira_2026_stock_movements_updated
before update on public.giftx_almox_siqueira_2026_stock_movements
for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

create trigger giftx_almox_siqueira_2026_purchase_orders_updated
before update on public.giftx_almox_siqueira_2026_purchase_orders
for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

create trigger giftx_almox_siqueira_2026_production_orders_updated
before update on public.giftx_almox_siqueira_2026_production_orders
for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

create trigger giftx_almox_siqueira_2026_maintenance_records_updated
before update on public.giftx_almox_siqueira_2026_maintenance_records
for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.giftx_almox_siqueira_2026_stock_items enable row level security;
alter table public.giftx_almox_siqueira_2026_machine_models enable row level security;
alter table public.giftx_almox_siqueira_2026_machine_bom_lines enable row level security;
alter table public.giftx_almox_siqueira_2026_suppliers enable row level security;
alter table public.giftx_almox_siqueira_2026_stock_movements enable row level security;
alter table public.giftx_almox_siqueira_2026_purchase_orders enable row level security;
alter table public.giftx_almox_siqueira_2026_production_orders enable row level security;
alter table public.giftx_almox_siqueira_2026_maintenance_records enable row level security;

-- ============================================================
-- POLITICAS DE ACESSO
-- Como o app usa senha unica simples dentro do front-end, estas politicas
-- liberam CRUD com anon key. Use em projeto privado/rede interna.
-- Para login real por usuario, substitua por auth.uid().
-- ============================================================

create policy giftx_almox_siqueira_2026_public_stock
on public.giftx_almox_siqueira_2026_stock_items
for all using (true) with check (true);

create policy giftx_almox_siqueira_2026_public_machines
on public.giftx_almox_siqueira_2026_machine_models
for all using (true) with check (true);

create policy giftx_almox_siqueira_2026_public_bom
on public.giftx_almox_siqueira_2026_machine_bom_lines
for all using (true) with check (true);

create policy giftx_almox_siqueira_2026_public_suppliers
on public.giftx_almox_siqueira_2026_suppliers
for all using (true) with check (true);

create policy giftx_almox_siqueira_2026_public_movements
on public.giftx_almox_siqueira_2026_stock_movements
for all using (true) with check (true);

create policy giftx_almox_siqueira_2026_public_purchases
on public.giftx_almox_siqueira_2026_purchase_orders
for all using (true) with check (true);

create policy giftx_almox_siqueira_2026_public_ops
on public.giftx_almox_siqueira_2026_production_orders
for all using (true) with check (true);

create policy giftx_almox_siqueira_2026_public_maintenance
on public.giftx_almox_siqueira_2026_maintenance_records
for all using (true) with check (true);

-- ============================================================
-- TESTE RAPIDO OPCIONAL
-- Depois de rodar, voce pode conferir se as tabelas existem com:
-- select table_name from information_schema.tables
-- where table_schema = 'public' and table_name like 'giftx_almox_siqueira_2026_%'
-- order by table_name;
-- ============================================================
