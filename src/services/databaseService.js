import { supabase, isSupabaseConfigured } from './supabaseClient';

export const tableNames = {
  stock: 'giftx_almox_siqueira_2026_stock_items',
  machines: 'giftx_almox_siqueira_2026_machine_models',
  bom: 'giftx_almox_siqueira_2026_machine_bom_lines',
  suppliers: 'giftx_almox_siqueira_2026_suppliers',
  movements: 'giftx_almox_siqueira_2026_stock_movements',
  purchases: 'giftx_almox_siqueira_2026_purchase_orders',
  ops: 'giftx_almox_siqueira_2026_production_orders',
  maintenance: 'giftx_almox_siqueira_2026_maintenance_records'
};

const ensure = () => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase não configurado');
};

export async function loadCollection(collection) {
  ensure();
  const table = tableNames[collection];
  const { data, error } = await supabase.from(table).select('id,data,created_at,updated_at').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({ id: row.id, ...(row.data || {}) }));
}

export async function replaceCollection(collection, rows) {
  ensure();
  const table = tableNames[collection];
  const safeRows = Array.isArray(rows) ? rows : [];
  const { error: deleteError } = await supabase.from(table).delete().neq('id', '__never__');
  if (deleteError) throw deleteError;
  if (!safeRows.length) return [];
  const payload = safeRows.map(row => ({ id: row.id, data: row }));
  const { data, error } = await supabase.from(table).insert(payload).select('id,data');
  if (error) throw error;
  return (data || []).map(row => ({ id: row.id, ...(row.data || {}) }));
}

export async function upsertCollectionItem(collection, item) {
  ensure();
  const table = tableNames[collection];
  const { data, error } = await supabase.from(table).upsert({ id: item.id, data: item }).select('id,data').single();
  if (error) throw error;
  return { id: data.id, ...(data.data || {}) };
}

export async function deleteCollectionItem(collection, id) {
  ensure();
  const table = tableNames[collection];
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

export async function loadAllCollections() {
  const keys = Object.keys(tableNames);
  const entries = await Promise.all(keys.map(async key => [key, await loadCollection(key)]));
  return Object.fromEntries(entries);
}
