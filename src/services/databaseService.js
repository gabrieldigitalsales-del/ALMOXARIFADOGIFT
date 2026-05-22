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

const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

const cleanData = row => {
  const data = { ...(row || {}) };
  delete data.id;
  return data;
};

const payloadFor = row => {
  const data = cleanData(row);
  return isUuid(row?.id) ? { id: row.id, data } : { data };
};

const mapRow = row => ({ id: row.id, ...(row.data || {}) });

export async function loadCollection(collection) {
  ensure();
  const table = tableNames[collection];
  const { data, error } = await supabase
    .from(table)
    .select('id,data,created_at,updated_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function replaceCollection(collection, rows) {
  ensure();
  const table = tableNames[collection];
  const safeRows = Array.isArray(rows) ? rows : [];

  // Primeiro tenta limpar a coleção para refletir remoções/reset.
  // Depois usa UPSERT, não INSERT, para evitar erro de chave duplicada caso
  // alguma limpeza falhe, rode em paralelo, ou o mesmo item já exista no banco.
  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) throw deleteError;

  if (!safeRows.length) return [];

  const payload = safeRows.map(payloadFor);
  const { data, error } = await supabase
    .from(table)
    .upsert(payload, { onConflict: 'id' })
    .select('id,data');
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function upsertCollectionItem(collection, item) {
  ensure();
  const table = tableNames[collection];
  const payload = payloadFor(item);

  const { data, error } = await supabase
    .from(table)
    .upsert(payload, { onConflict: 'id' })
    .select('id,data')
    .single();
  if (error) throw error;
  return mapRow(data);
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
