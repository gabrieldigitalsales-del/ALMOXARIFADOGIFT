import { supabase, isSupabaseConfigured } from './supabaseClient';

export const tableNames = {
  stock:'giftx_almox_siqueira_2026_stock_items',machines:'giftx_almox_siqueira_2026_machine_models',bom:'giftx_almox_siqueira_2026_machine_bom_lines',suppliers:'giftx_almox_siqueira_2026_suppliers',movements:'giftx_almox_siqueira_2026_stock_movements',purchases:'giftx_almox_siqueira_2026_purchase_orders',ops:'giftx_almox_siqueira_2026_production_orders',maintenance:'giftx_almox_siqueira_2026_maintenance_records',warranties:'giftx_almox_siqueira_2026_warranty_reminders',soldMachines:'giftx_almox_siqueira_2026_sold_machines'
};
const allCollections=Object.keys(tableNames);
const ensure=()=>{if(!isSupabaseConfigured||!supabase)throw new Error('Supabase não configurado')};
const getAuth=()=>{try{return JSON.parse(localStorage.getItem('gift.auth.v4')||'null')||{}}catch{return{}}};
const token=()=>{const t=getAuth()?.token;if(!t)throw new Error('Sessão expirada. Entre novamente.');return t};
const isUuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));
const cleanData=row=>{const data={...(row||{})};delete data.id;delete data.created_at;delete data.updated_at;return data};
const mapRow=row=>({id:row.id,...(row.data||{}),created_at:row.created_at,updated_at:row.updated_at});

export async function loadCollection(collection){
  ensure();
  const{data,error}=await supabase.rpc('giftx_almox_read_collection',{p_token:token(),p_collection:collection});
  if(error)throw error;
  return(data||[]).map(mapRow);
}
export async function replaceCollection(collection,rows){
  ensure();
  const{error}=await supabase.rpc('giftx_almox_replace_collection',{p_token:token(),p_collection:collection,p_rows:Array.isArray(rows)?rows:[]});
  if(error)throw error;
  return true;
}
export async function upsertCollectionItem(collection,item){
  ensure();
  const{data,error}=await supabase.rpc('giftx_almox_upsert_item',{p_token:token(),p_collection:collection,p_id:isUuid(item?.id)?item.id:null,p_data:cleanData(item)});
  if(error)throw error;
  const row=Array.isArray(data)?data[0]:data;
  return row?mapRow(row):item;
}
export async function deleteCollectionItem(collection,id){
  ensure();
  const{error}=await supabase.rpc('giftx_almox_delete_item',{p_token:token(),p_collection:collection,p_id:id});
  if(error)throw error;
}
export async function loadAllCollections(role='admin'){
  const allowed=role==='garantia'?['warranties','machines','ops']:role==='almox'?['stock','movements']:allCollections;
  const entries=await Promise.all(allowed.map(async key=>[key,await loadCollection(key)]));
  return Object.fromEntries(entries);
}
export async function listDailyCloudBackups(limit=20){
  ensure();
  const{data,error}=await supabase.rpc('giftx_almox_list_backups',{p_token:token(),p_limit:limit});
  if(error)throw error;
  return data||[];
}
export async function saveDailyCloudBackup(label,snapshot){
  ensure();
  const{data,error}=await supabase.rpc('giftx_almox_save_backup',{p_token:token(),p_label:label||'backup-diario',p_data:snapshot||{}});
  if(error)throw error;
  return data;
}
export async function uppercaseStockNames(){
  ensure();
  const{data,error}=await supabase.rpc('giftx_almox_uppercase_stock_names_secure',{p_token:token()});
  if(error)throw error;
  return data||{};
}
export async function deleteStorageFile(bucket,path){
  ensure();
  if(!path)return;
  const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/giftx-almox-item-photo`,{method:'POST',headers:{apikey:import.meta.env.VITE_SUPABASE_ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({token:token(),action:'delete',path})});
  if(!response.ok){const p=await response.json().catch(()=>({}));throw new Error(p.error||'Não foi possível apagar a foto')}
}
