-- ALMOXARIFADO GIFT EXCELLENCE
-- Tabelas com nomes únicos para evitar conflito com outros projetos Supabase.
-- Execute este arquivo no Supabase: SQL Editor > New query > Run.

create table if not exists public.giftx_almox_siqueira_2026_stock_items (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.giftx_almox_siqueira_2026_machine_models (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.giftx_almox_siqueira_2026_machine_bom_lines (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.giftx_almox_siqueira_2026_suppliers (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.giftx_almox_siqueira_2026_stock_movements (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.giftx_almox_siqueira_2026_purchase_orders (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.giftx_almox_siqueira_2026_production_orders (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.giftx_almox_siqueira_2026_maintenance_records (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.giftx_almox_siqueira_2026_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists giftx_almox_siqueira_2026_stock_items_updated on public.giftx_almox_siqueira_2026_stock_items;
create trigger giftx_almox_siqueira_2026_stock_items_updated before update on public.giftx_almox_siqueira_2026_stock_items for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

drop trigger if exists giftx_almox_siqueira_2026_machine_models_updated on public.giftx_almox_siqueira_2026_machine_models;
create trigger giftx_almox_siqueira_2026_machine_models_updated before update on public.giftx_almox_siqueira_2026_machine_models for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

drop trigger if exists giftx_almox_siqueira_2026_machine_bom_lines_updated on public.giftx_almox_siqueira_2026_machine_bom_lines;
create trigger giftx_almox_siqueira_2026_machine_bom_lines_updated before update on public.giftx_almox_siqueira_2026_machine_bom_lines for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

drop trigger if exists giftx_almox_siqueira_2026_suppliers_updated on public.giftx_almox_siqueira_2026_suppliers;
create trigger giftx_almox_siqueira_2026_suppliers_updated before update on public.giftx_almox_siqueira_2026_suppliers for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

drop trigger if exists giftx_almox_siqueira_2026_stock_movements_updated on public.giftx_almox_siqueira_2026_stock_movements;
create trigger giftx_almox_siqueira_2026_stock_movements_updated before update on public.giftx_almox_siqueira_2026_stock_movements for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

drop trigger if exists giftx_almox_siqueira_2026_purchase_orders_updated on public.giftx_almox_siqueira_2026_purchase_orders;
create trigger giftx_almox_siqueira_2026_purchase_orders_updated before update on public.giftx_almox_siqueira_2026_purchase_orders for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

drop trigger if exists giftx_almox_siqueira_2026_production_orders_updated on public.giftx_almox_siqueira_2026_production_orders;
create trigger giftx_almox_siqueira_2026_production_orders_updated before update on public.giftx_almox_siqueira_2026_production_orders for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

drop trigger if exists giftx_almox_siqueira_2026_maintenance_records_updated on public.giftx_almox_siqueira_2026_maintenance_records;
create trigger giftx_almox_siqueira_2026_maintenance_records_updated before update on public.giftx_almox_siqueira_2026_maintenance_records for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

alter table public.giftx_almox_siqueira_2026_stock_items enable row level security;
alter table public.giftx_almox_siqueira_2026_machine_models enable row level security;
alter table public.giftx_almox_siqueira_2026_machine_bom_lines enable row level security;
alter table public.giftx_almox_siqueira_2026_suppliers enable row level security;
alter table public.giftx_almox_siqueira_2026_stock_movements enable row level security;
alter table public.giftx_almox_siqueira_2026_purchase_orders enable row level security;
alter table public.giftx_almox_siqueira_2026_production_orders enable row level security;
alter table public.giftx_almox_siqueira_2026_maintenance_records enable row level security;

-- Como este sistema usa senha única simples dentro do app, estas políticas liberam CRUD via anon key.
-- Use em rede interna/projeto privado. Para multiusuário com login real, substitua por auth.uid().
drop policy if exists giftx_almox_siqueira_2026_public_stock on public.giftx_almox_siqueira_2026_stock_items;
create policy giftx_almox_siqueira_2026_public_stock on public.giftx_almox_siqueira_2026_stock_items for all using (true) with check (true);
drop policy if exists giftx_almox_siqueira_2026_public_machines on public.giftx_almox_siqueira_2026_machine_models;
create policy giftx_almox_siqueira_2026_public_machines on public.giftx_almox_siqueira_2026_machine_models for all using (true) with check (true);
drop policy if exists giftx_almox_siqueira_2026_public_bom on public.giftx_almox_siqueira_2026_machine_bom_lines;
create policy giftx_almox_siqueira_2026_public_bom on public.giftx_almox_siqueira_2026_machine_bom_lines for all using (true) with check (true);
drop policy if exists giftx_almox_siqueira_2026_public_suppliers on public.giftx_almox_siqueira_2026_suppliers;
create policy giftx_almox_siqueira_2026_public_suppliers on public.giftx_almox_siqueira_2026_suppliers for all using (true) with check (true);
drop policy if exists giftx_almox_siqueira_2026_public_movements on public.giftx_almox_siqueira_2026_stock_movements;
create policy giftx_almox_siqueira_2026_public_movements on public.giftx_almox_siqueira_2026_stock_movements for all using (true) with check (true);
drop policy if exists giftx_almox_siqueira_2026_public_purchases on public.giftx_almox_siqueira_2026_purchase_orders;
create policy giftx_almox_siqueira_2026_public_purchases on public.giftx_almox_siqueira_2026_purchase_orders for all using (true) with check (true);
drop policy if exists giftx_almox_siqueira_2026_public_ops on public.giftx_almox_siqueira_2026_production_orders;
create policy giftx_almox_siqueira_2026_public_ops on public.giftx_almox_siqueira_2026_production_orders for all using (true) with check (true);
drop policy if exists giftx_almox_siqueira_2026_public_maintenance on public.giftx_almox_siqueira_2026_maintenance_records;
create policy giftx_almox_siqueira_2026_public_maintenance on public.giftx_almox_siqueira_2026_maintenance_records for all using (true) with check (true);
