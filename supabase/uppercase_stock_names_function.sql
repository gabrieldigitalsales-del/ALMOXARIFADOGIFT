-- FUNÇÃO SQL PARA BOTÃO: PADRONIZAR NOMES DO ESTOQUE EM MAIÚSCULO
-- Pode rodar mais de uma vez. Não apaga itens.

create or replace function public.giftx_almox_siqueira_2026_uppercase_stock_names()
returns table(backup_table text, total_updated integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_backup_table text;
  v_total integer := 0;
begin
  v_backup_table := 'giftx_almox_siqueira_2026_stock_items_backup_maiusculo_' || to_char(now(), 'YYYYMMDD_HH24MISS');

  execute format(
    'create table if not exists public.%I as select * from public.giftx_almox_siqueira_2026_stock_items',
    v_backup_table
  );

  update public.giftx_almox_siqueira_2026_stock_items
  set
    data = jsonb_set(
      data,
      '{name}',
      to_jsonb(upper(coalesce(data->>'name', '')))
    ),
    updated_at = now()
  where coalesce(data->>'name', '') <> ''
    and data->>'name' <> upper(data->>'name');

  get diagnostics v_total = row_count;

  backup_table := v_backup_table;
  total_updated := v_total;
  return next;
end;
$$;

grant execute on function public.giftx_almox_siqueira_2026_uppercase_stock_names() to anon, authenticated;
