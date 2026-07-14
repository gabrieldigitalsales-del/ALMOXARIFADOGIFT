-- ============================================================================
-- GIFT CONTROL - MIGRAÇÃO ÚNICA E ADITIVA
-- Banco matriz: Almoxarifado GIFT Excellence
--
-- SEGURANÇA:
--   * NÃO possui DROP TABLE
--   * NÃO possui TRUNCATE
--   * NÃO possui DELETE
--   * NÃO altera nem apaga os registros atuais
--   * Cria somente as estruturas novas que ainda não existirem
--
-- Execute uma única vez em: Supabase > SQL Editor > New query > Run
-- ============================================================================

begin;

create extension if not exists pgcrypto;

-- Função já utilizada pela matriz. CREATE OR REPLACE preserva os dados.
create or replace function public.giftx_almox_siqueira_2026_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- ORÇAMENTOS
-- Mantém o mesmo padrão da matriz: id UUID + data JSONB.
-- --------------------------------------------------------------------------
create table if not exists public.giftx_almox_siqueira_2026_sales_quotes (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- ORDENS DE SERVIÇO
-- Inclui OS, itens, modelos, configuração de impressão e histórico no JSONB.
-- --------------------------------------------------------------------------
create table if not exists public.giftx_almox_siqueira_2026_service_orders (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- COTAÇÕES DE FRETE
-- Uma cotação guarda coleta, carga, fila, respostas, escolha e anexos no JSONB.
-- --------------------------------------------------------------------------
create table if not exists public.giftx_almox_siqueira_2026_freight_quotes (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Transportadoras ficam separadas de fornecedores, mas no mesmo banco único.
create table if not exists public.giftx_almox_siqueira_2026_carriers (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- CONFIGURAÇÕES DOS MÓDULOS
-- Dados da empresa, destino fixo, preferências de impressão e contadores.
-- --------------------------------------------------------------------------
create table if not exists public.giftx_almox_siqueira_2026_module_settings (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  setting_key text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint giftx_almox_siqueira_2026_module_settings_unique
    unique (module_key, setting_key)
);

-- --------------------------------------------------------------------------
-- HISTÓRICO GERAL / AUDITORIA
-- Preparado para registrar criação, edição, aprovação, recebimento etc.
-- --------------------------------------------------------------------------
create table if not exists public.giftx_almox_siqueira_2026_audit_logs (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  record_id text,
  action text not null,
  actor text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- ÍNDICES
-- --------------------------------------------------------------------------
create index if not exists giftx_almox_siqueira_2026_sales_quotes_data_gin
  on public.giftx_almox_siqueira_2026_sales_quotes using gin (data);
create index if not exists giftx_almox_siqueira_2026_sales_quotes_created_idx
  on public.giftx_almox_siqueira_2026_sales_quotes (created_at desc);

create index if not exists giftx_almox_siqueira_2026_service_orders_data_gin
  on public.giftx_almox_siqueira_2026_service_orders using gin (data);
create index if not exists giftx_almox_siqueira_2026_service_orders_created_idx
  on public.giftx_almox_siqueira_2026_service_orders (created_at desc);

create index if not exists giftx_almox_siqueira_2026_freight_quotes_data_gin
  on public.giftx_almox_siqueira_2026_freight_quotes using gin (data);
create index if not exists giftx_almox_siqueira_2026_freight_quotes_created_idx
  on public.giftx_almox_siqueira_2026_freight_quotes (created_at desc);

create index if not exists giftx_almox_siqueira_2026_carriers_data_gin
  on public.giftx_almox_siqueira_2026_carriers using gin (data);
create index if not exists giftx_almox_siqueira_2026_carriers_created_idx
  on public.giftx_almox_siqueira_2026_carriers (created_at desc);

create index if not exists giftx_almox_siqueira_2026_module_settings_lookup_idx
  on public.giftx_almox_siqueira_2026_module_settings (module_key, setting_key);

create index if not exists giftx_almox_siqueira_2026_audit_logs_record_idx
  on public.giftx_almox_siqueira_2026_audit_logs (module_key, record_id, created_at desc);

-- --------------------------------------------------------------------------
-- TRIGGERS DE updated_at
-- Os blocos verificam antes de criar para o comando poder ser reexecutado.
-- --------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'giftx_almox_siqueira_2026_sales_quotes_updated') then
    create trigger giftx_almox_siqueira_2026_sales_quotes_updated
    before update on public.giftx_almox_siqueira_2026_sales_quotes
    for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'giftx_almox_siqueira_2026_service_orders_updated') then
    create trigger giftx_almox_siqueira_2026_service_orders_updated
    before update on public.giftx_almox_siqueira_2026_service_orders
    for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'giftx_almox_siqueira_2026_freight_quotes_updated') then
    create trigger giftx_almox_siqueira_2026_freight_quotes_updated
    before update on public.giftx_almox_siqueira_2026_freight_quotes
    for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'giftx_almox_siqueira_2026_carriers_updated') then
    create trigger giftx_almox_siqueira_2026_carriers_updated
    before update on public.giftx_almox_siqueira_2026_carriers
    for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'giftx_almox_siqueira_2026_module_settings_updated') then
    create trigger giftx_almox_siqueira_2026_module_settings_updated
    before update on public.giftx_almox_siqueira_2026_module_settings
    for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();
  end if;
end $$;

-- --------------------------------------------------------------------------
-- RLS / POLÍTICAS
-- A matriz atual usa a anon key com CRUD aberto para uso interno.
-- Estas políticas seguem o MESMO comportamento, sem alterar políticas antigas.
-- --------------------------------------------------------------------------
alter table public.giftx_almox_siqueira_2026_sales_quotes enable row level security;
alter table public.giftx_almox_siqueira_2026_service_orders enable row level security;
alter table public.giftx_almox_siqueira_2026_freight_quotes enable row level security;
alter table public.giftx_almox_siqueira_2026_carriers enable row level security;
alter table public.giftx_almox_siqueira_2026_module_settings enable row level security;
alter table public.giftx_almox_siqueira_2026_audit_logs enable row level security;

do $$
declare
  t text;
  p text;
begin
  foreach t in array array[
    'giftx_almox_siqueira_2026_sales_quotes',
    'giftx_almox_siqueira_2026_service_orders',
    'giftx_almox_siqueira_2026_freight_quotes',
    'giftx_almox_siqueira_2026_carriers',
    'giftx_almox_siqueira_2026_module_settings',
    'giftx_almox_siqueira_2026_audit_logs'
  ] loop
    p := t || '_open_crud';
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = p
    ) then
      execute format(
        'create policy %I on public.%I for all to anon, authenticated using (true) with check (true)',
        p, t
      );
    end if;
  end loop;
end $$;

-- Permissões explícitas para a API do Supabase.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.giftx_almox_siqueira_2026_sales_quotes to anon, authenticated;
grant select, insert, update, delete on public.giftx_almox_siqueira_2026_service_orders to anon, authenticated;
grant select, insert, update, delete on public.giftx_almox_siqueira_2026_freight_quotes to anon, authenticated;
grant select, insert, update, delete on public.giftx_almox_siqueira_2026_carriers to anon, authenticated;
grant select, insert, update, delete on public.giftx_almox_siqueira_2026_module_settings to anon, authenticated;
grant select, insert, update, delete on public.giftx_almox_siqueira_2026_audit_logs to anon, authenticated;

commit;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- O resultado deve listar 6 tabelas.
-- ============================================================================
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'giftx_almox_siqueira_2026_sales_quotes',
    'giftx_almox_siqueira_2026_service_orders',
    'giftx_almox_siqueira_2026_freight_quotes',
    'giftx_almox_siqueira_2026_carriers',
    'giftx_almox_siqueira_2026_module_settings',
    'giftx_almox_siqueira_2026_audit_logs'
  )
order by table_name;
