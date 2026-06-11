-- ============================================================
-- ADICIONAL SEGURO - GARANTIAS + AVISO WHATSAPP
-- Sistema: ALMOXARIFADO GIFT EXCELLENCE
--
-- IMPORTANTE:
-- Este script NAO apaga nenhuma tabela existente.
-- Ele apenas adiciona a tabela de garantias/avisos e politicas de acesso.
-- Execute no Supabase SQL Editor antes de usar a tela "Garantias / WhatsApp".
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.giftx_almox_siqueira_2026_warranty_reminders (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists giftx_almox_siqueira_2026_warranty_reminders_data_gin
on public.giftx_almox_siqueira_2026_warranty_reminders using gin (data);

create index if not exists giftx_almox_siqueira_2026_warranty_reminders_created_idx
on public.giftx_almox_siqueira_2026_warranty_reminders (created_at desc);

create index if not exists giftx_almox_siqueira_2026_warranty_reminders_reminder_date_idx
on public.giftx_almox_siqueira_2026_warranty_reminders ((data->>'reminderDate'));

create or replace trigger giftx_almox_siqueira_2026_warranty_reminders_updated
before update on public.giftx_almox_siqueira_2026_warranty_reminders
for each row execute function public.giftx_almox_siqueira_2026_set_updated_at();

alter table public.giftx_almox_siqueira_2026_warranty_reminders enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'giftx_almox_siqueira_2026_warranty_reminders'
      and policyname = 'giftx_almox_siqueira_2026_public_warranty_reminders'
  ) then
    create policy giftx_almox_siqueira_2026_public_warranty_reminders
    on public.giftx_almox_siqueira_2026_warranty_reminders
    for all using (true) with check (true);
  end if;
end $$;

-- Conferencia:
-- select id, data->>'customerName' as cliente, data->>'reminderDate' as aviso, data->>'status' as status
-- from public.giftx_almox_siqueira_2026_warranty_reminders
-- order by data->>'reminderDate';
