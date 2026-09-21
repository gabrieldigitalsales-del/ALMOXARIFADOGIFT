import { supabase, isSupabaseConfigured } from './supabaseClient';

export const moduleTables={quotes:'giftx_almox_siqueira_2026_sales_quotes',serviceOrders:'giftx_almox_siqueira_2026_service_orders',freightQuotes:'giftx_almox_siqueira_2026_freight_quotes',carriers:'giftx_almox_siqueira_2026_carriers',suppliers:'giftx_almox_siqueira_2026_suppliers'};
const collectionForTable=Object.fromEntries(Object.entries(moduleTables).map(([k,v])=>[v,k]));
const ensure=()=>{if(!isSupabaseConfigured||!supabase)throw new Error('Supabase não configurado.')};
const getToken=()=>{try{const t=JSON.parse(localStorage.getItem('gift.auth.v4')||'null')?.token;if(t)return t}catch{}throw new Error('Sessão expirada. Entre novamente.')};
const isUuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));
const clean=value=>{const data={...(value||{})};delete data.id;delete data.created_at;delete data.updated_at;return data};
const mapRow=row=>({id:row.id,...(row.data||{}),created_at:row.created_at,updated_at:row.updated_at});
const collection=table=>collectionForTable[table]||table;

export async function loadModuleRows(table){ensure();const{data,error}=await supabase.rpc('giftx_almox_read_collection',{p_token:getToken(),p_collection:collection(table)});if(error)throw error;return(data||[]).map(mapRow)}
export async function saveModuleRow(table,value){ensure();const{data,error}=await supabase.rpc('giftx_almox_upsert_item',{p_token:getToken(),p_collection:collection(table),p_id:isUuid(value?.id)?value.id:null,p_data:clean(value)});if(error)throw error;const row=Array.isArray(data)?data[0]:data;return row?mapRow(row):value}
export async function deleteModuleRow(table,id){ensure();const{error}=await supabase.rpc('giftx_almox_delete_item',{p_token:getToken(),p_collection:collection(table),p_id:id});if(error)throw error}
export async function replaceModuleRows(table,rows){ensure();const{error}=await supabase.rpc('giftx_almox_replace_collection',{p_token:getToken(),p_collection:collection(table),p_rows:Array.isArray(rows)?rows:[]});if(error)throw error;return true}
