create table if not exists public.giftx_almox_siqueira_2026_daily_backups (
  id uuid primary key default gen_random_uuid(),
  backup_date date not null default current_date,
  label text,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists giftx_daily_backups_date_idx
on public.giftx_almox_siqueira_2026_daily_backups (backup_date desc, created_at desc);

alter table public.giftx_almox_siqueira_2026_daily_backups enable row level security;

drop policy if exists "giftx daily backups insert" on public.giftx_almox_siqueira_2026_daily_backups;
drop policy if exists "giftx daily backups select" on public.giftx_almox_siqueira_2026_daily_backups;

create policy "giftx daily backups insert"
on public.giftx_almox_siqueira_2026_daily_backups
for insert
to anon, authenticated
with check (true);

create policy "giftx daily backups select"
on public.giftx_almox_siqueira_2026_daily_backups
for select
to anon, authenticated
using (true);
