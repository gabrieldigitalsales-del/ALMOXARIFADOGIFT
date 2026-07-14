import { supabase, isSupabaseConfigured } from './supabaseClient';

export const moduleTables = {
  quotes: 'giftx_almox_siqueira_2026_sales_quotes',
  serviceOrders: 'giftx_almox_siqueira_2026_service_orders',
  freightQuotes: 'giftx_almox_siqueira_2026_freight_quotes',
  carriers: 'giftx_almox_siqueira_2026_carriers',
  suppliers: 'giftx_almox_siqueira_2026_suppliers',
};

const ensure = () => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase não configurado. Confira VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
};

const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
const clean = value => {
  const data = { ...(value || {}) };
  delete data.id;
  delete data.created_at;
  delete data.updated_at;
  return data;
};
const mapRow = row => ({ id: row.id, ...(row.data || {}), created_at: row.created_at, updated_at: row.updated_at });

export async function loadModuleRows(table) {
  ensure();
  const { data, error } = await supabase.from(table).select('id,data,created_at,updated_at').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function saveModuleRow(table, value) {
  ensure();
  const payload = isUuid(value?.id) ? { id: value.id, data: clean(value) } : { data: clean(value) };
  const { data, error } = await supabase.from(table).upsert(payload, { onConflict: 'id' }).select('id,data,created_at,updated_at').single();
  if (error) throw error;
  return mapRow(data);
}

export async function deleteModuleRow(table, id) {
  ensure();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

export async function replaceModuleRows(table, rows) {
  ensure();
  const safeRows = Array.isArray(rows) ? rows : [];
  const { error: deleteError } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) throw deleteError;
  if (!safeRows.length) return [];
  const payload = safeRows.map(value => isUuid(value?.id) ? { id: value.id, data: clean(value) } : { data: clean(value) });
  const { data, error } = await supabase.from(table).insert(payload).select('id,data,created_at,updated_at');
  if (error) throw error;
  return (data || []).map(mapRow);
}
