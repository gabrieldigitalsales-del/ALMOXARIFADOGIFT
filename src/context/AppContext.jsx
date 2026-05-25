import{createContext,useContext,useEffect,useMemo,useRef,useState}from'react';
import{bomSeed,machinesSeed,maintenanceSeed,movementsSeed,opsSeed,purchasesSeed,stockSeed,suppliersSeed}from'../data/seed';
import{useLocalStorage}from'../hooks/useLocalStorage';
import{isSupabaseConfigured}from'../services/supabaseClient';
import{deleteCollectionItem,loadAllCollections,replaceCollection,upsertCollectionItem}from'../services/databaseService';
import{availableOf,calcMachineCost,num,statusOf,today}from'../utils/costs';
import{downloadJson}from'../utils/exporters';

const Ctx=createContext(null);const rid=()=>crypto.randomUUID();
const collections=['stock','machines','bom','suppliers','movements','purchases','ops','maintenance'];

export function AppProvider({children}){
 const[stockRaw,setStockRaw]=useLocalStorage('gift.stock.v4',stockSeed);
 const[machinesRaw,setMachinesRaw]=useLocalStorage('gift.machines.v4',machinesSeed);
 const[bomRaw,setBomRaw]=useLocalStorage('gift.bom.v4',bomSeed);
 const[suppliersRaw,setSuppliersRaw]=useLocalStorage('gift.suppliers.v4',suppliersSeed);
 const[movementsRaw,setMovementsRaw]=useLocalStorage('gift.movements.v4',movementsSeed);
 const[purchasesRaw,setPurchasesRaw]=useLocalStorage('gift.purchases.v4',purchasesSeed);
 const[opsRaw,setOpsRaw]=useLocalStorage('gift.ops.v4',opsSeed);
 const[maintenanceRaw,setMaintenanceRaw]=useLocalStorage('gift.maintenance.v4',maintenanceSeed);
 const[settings,setSettings]=useLocalStorage('gift.settings.v4',{dark:false,user:'Administrador',logo:'/logo-gift.png'});
 const[auth,setAuth]=useLocalStorage('gift.auth.v4',{logged:false});
 const[toast,setToast]=useState(null);
 const[dbStatus,setDbStatus]=useState(isSupabaseConfigured?'Conectando ao Supabase':'Modo local');
 const loadedRef=useRef(!isSupabaseConfigured);
 const settersRef=useRef({});
 const statesRef=useRef({});

 const notify=(message,type='ok')=>{setToast({message,type});setTimeout(()=>setToast(null),2600)};
 const showDbError=e=>{console.error(e);setDbStatus('Erro no Supabase');notify(`Erro no Supabase: ${e.message||e}`,'error')};
 const persist=(collection,rows)=>{if(!isSupabaseConfigured||!loadedRef.current)return;replaceCollection(collection,rows).catch(showDbError)};
 const makeSetter=(collection,baseSetter)=>update=>baseSetter(prev=>{const next=typeof update==='function'?update(prev):update;statesRef.current[collection]=next;persist(collection,next);return next});
 const setStock=makeSetter('stock',setStockRaw);const setMachines=makeSetter('machines',setMachinesRaw);const setBom=makeSetter('bom',setBomRaw);const setSuppliers=makeSetter('suppliers',setSuppliersRaw);const setMovements=makeSetter('movements',setMovementsRaw);const setPurchases=makeSetter('purchases',setPurchasesRaw);const setOps=makeSetter('ops',setOpsRaw);const setMaintenance=makeSetter('maintenance',setMaintenanceRaw);
 settersRef.current={stock:setStockRaw,machines:setMachinesRaw,bom:setBomRaw,suppliers:setSuppliersRaw,movements:setMovementsRaw,purchases:setPurchasesRaw,ops:setOpsRaw,maintenance:setMaintenanceRaw};
 statesRef.current={stock:stockRaw,machines:machinesRaw,bom:bomRaw,suppliers:suppliersRaw,movements:movementsRaw,purchases:purchasesRaw,ops:opsRaw,maintenance:maintenanceRaw};

 useEffect(()=>{let active=true;if(!isSupabaseConfigured)return;setDbStatus('Conectando ao Supabase');loadAllCollections().then(data=>{if(!active)return;loadedRef.current=false;collections.forEach(key=>{settersRef.current[key](data[key]||[]);statesRef.current[key]=data[key]||[]});loadedRef.current=true;setDbStatus('Supabase conectado')}).catch(e=>{loadedRef.current=true;showDbError(e)});return()=>{active=false}},[]);

 const stock=stockRaw,machines=machinesRaw,bom=bomRaw,suppliers=suppliersRaw,movements=movementsRaw,purchases=purchasesRaw,ops=opsRaw,maintenance=maintenanceRaw;
 const addMovement=m=>{const mv={id:rid('mv'),date:today(),user:settings.user,...m};setMovements(v=>[mv,...v]);if(isSupabaseConfigured&&loadedRef.current)upsertCollectionItem('movements',mv).catch(showDbError)};
 const upsertStock=item=>{const clean={...item,application:item.application||'Estoque geral',qty:Math.max(0,num(item.qty)),reserved:Math.max(0,num(item.reserved)),unitCost:Math.max(0,num(item.unitCost)),avgCost:Math.max(0,num(item.avgCost||item.unitCost)),min:Math.max(1,num(item.min||1))};clean.status=statusOf(clean);if(!clean.id)clean.id=rid('p');setStock(s=>clean.id?s.some(i=>i.id===clean.id)?s.map(i=>i.id===clean.id?clean:i):[clean,...s]:[clean,...s]);if(isSupabaseConfigured&&loadedRef.current)upsertCollectionItem('stock',clean).catch(showDbError)};
 const deleteStock=id=>{setStock(s=>s.filter(i=>i.id!==id));if(isSupabaseConfigured&&loadedRef.current)deleteCollectionItem('stock',id).catch(showDbError)};
 const quickMove=({productId,type,qty,reason,op=''})=>{const q=num(qty);const p=stock.find(i=>i.id===productId);if(!p||q<=0)return notify('Movimentação inválida','error');let next={...p};if(type==='entrada'){const oldTotal=num(p.qty)*num(p.avgCost||p.unitCost);const cost=num(p.unitCost);next.qty=num(p.qty)+q;next.avgCost=(oldTotal+q*cost)/(next.qty||1)}else if(type==='saída'||type==='perda'){if(availableOf(p)<q)return notify('Estoque disponível insuficiente','error');next.qty=num(p.qty)-q}else if(type==='devolução'){next.qty=num(p.qty)+q}else if(type==='transferência'){}else if(type==='reserva produção'){if(availableOf(p)<q)return notify('Disponível insuficiente para reservar','error');next.reserved=num(p.reserved)+q}else if(type==='baixa reserva'){if(num(p.reserved)<q)return notify('Reserva insuficiente','error');next.reserved=num(p.reserved)-q;next.qty=num(p.qty)-q}next.status=statusOf(next);setStock(s=>s.map(i=>i.id===p.id?next:i));if(isSupabaseConfigured&&loadedRef.current)upsertCollectionItem('stock',next).catch(showDbError);addMovement({type,item:p.name,qty:q,reason,op});notify('Movimentação registrada')};
 const reserveOP=opId=>{const op=ops.find(o=>o.id===opId);const machine=machines.find(m=>m.id===op?.machineId);if(!op||!machine)return;const lines=bom.filter(l=>l.machineId===machine.id);const missing=lines.map(l=>({l,p:stock.find(i=>i.id===l.productId)})).filter(x=>!x.p||availableOf(x.p)<num(x.l.qty));if(missing.length){notify('Existem materiais insuficientes para reservar','error');return false}lines.forEach(l=>quickMove({productId:l.productId,type:'reserva produção',qty:l.qty,reason:`Reserva ${op.number}`,op:op.number}));const next=ops.map(x=>x.id===opId?{...x,status:'Materiais reservados',progress:40,startedAt:today()}:x);setOps(next);return true};
 const finishOP=opId=>{const op=ops.find(o=>o.id===opId);const machine=machines.find(m=>m.id===op?.machineId);if(!op||!machine)return;const lines=bom.filter(l=>l.machineId===machine.id);const missing=lines.map(l=>({l,p:stock.find(i=>i.id===l.productId)})).filter(x=>!x.p||num(x.p.reserved)<num(x.l.qty));if(missing.length){notify('Faça a reserva antes de finalizar','error');return}lines.forEach(l=>quickMove({productId:l.productId,type:'baixa reserva',qty:l.qty,reason:`Baixa ${op.number}`,op:op.number}));const cost=calcMachineCost(machine,bom,stock).total;setOps(o=>o.map(x=>x.id===opId?{...x,status:'Finalizada',progress:100,finishedAt:today(),realCost:cost}:x));notify('OP finalizada e estoque baixado')};
 const deleteOP=opId=>{const op=ops.find(o=>o.id===opId);if(!op)return;const machine=machines.find(m=>m.id===op.machineId);if(machine&&!['Finalizada','Cancelada'].includes(op.status)){const lines=bom.filter(l=>l.machineId===machine.id);const ids=new Set(lines.map(l=>l.productId));setStock(s=>s.map(item=>{if(!ids.has(item.id))return item;const qty=lines.filter(l=>l.productId===item.id).reduce((a,l)=>a+num(l.qty),0);const next={...item,reserved:Math.max(0,num(item.reserved)-qty)};next.status=statusOf(next);if(isSupabaseConfigured&&loadedRef.current)upsertCollectionItem('stock',next).catch(showDbError);return next}));lines.forEach(l=>addMovement({type:'cancelamento reserva',item:stock.find(i=>i.id===l.productId)?.name||'Item',qty:num(l.qty),reason:`Remoção ${op.number}`,op:op.number}))}setOps(o=>o.filter(x=>x.id!==opId));if(isSupabaseConfigured&&loadedRef.current)deleteCollectionItem('ops',opId).catch(showDbError);notify('OP removida')};
 const createPurchaseSuggestion=item=>{const buy=Math.max(num(item.min)+num(item.reserved)-num(item.qty),1);const pc={id:rid('pc'),number:`PC-${String(purchases.length+1).padStart(4,'0')}`,supplier:item.supplier,status:'Sugerido',eta:'',value:buy*num(item.avgCost||item.unitCost),items:[{productId:item.id,qty:buy,unitCost:num(item.avgCost||item.unitCost)}],notes:'Gerado por estoque mínimo'};setPurchases(p=>[pc,...p]);if(isSupabaseConfigured&&loadedRef.current)upsertCollectionItem('purchases',pc).catch(showDbError);notify('Pedido de compra sugerido')};
 const receivePurchase=id=>{const pc=purchases.find(p=>p.id===id);if(!pc)return;pc.items?.forEach(it=>quickMove({productId:it.productId,type:'entrada',qty:it.qty,reason:`Recebimento ${pc.number}`}));setPurchases(ps=>ps.map(p=>p.id===id?{...p,status:'Recebido',receivedAt:today()}:p));notify('Compra recebida no estoque')};
 const backup=()=>downloadJson('backup-almoxarifado-gift.json',{stock,machines,bom,suppliers,movements,purchases,ops,maintenance,settings,createdAt:new Date().toISOString()});
 const restore=data=>{if(data.stock)setStock(data.stock);if(data.machines)setMachines(data.machines);if(data.bom)setBom(data.bom);if(data.suppliers)setSuppliers(data.suppliers);if(data.movements)setMovements(data.movements);if(data.purchases)setPurchases(data.purchases);if(data.ops)setOps(data.ops);if(data.maintenance)setMaintenance(data.maintenance);notify('Backup restaurado')};
 const resetDemo=()=>{setStock([]);setMachines([]);setBom([]);setSuppliers([]);setMovements([]);setPurchases([]);setOps([]);setMaintenance([]);notify('Sistema zerado')};
 const totals=useMemo(()=>{const items=stock.reduce((a,i)=>a+num(i.qty),0);const reserved=stock.reduce((a,i)=>a+num(i.reserved),0);const available=stock.reduce((a,i)=>a+availableOf(i),0);const value=stock.reduce((a,i)=>a+num(i.qty)*num(i.avgCost||i.unitCost),0);const low=stock.filter(i=>statusOf(i)!=='OK');return{items,reserved,available,value,low}},[stock]);
 const machineCosts=useMemo(()=>machines.map(m=>({machine:m,...calcMachineCost(m,bom,stock)})),[machines,bom,stock]);
 const value={stock,setStock,upsertStock,deleteStock,quickMove,addMovement,machines,setMachines,bom,setBom,suppliers,setSuppliers,movements,setMovements,purchases,setPurchases,receivePurchase,createPurchaseSuggestion,ops,setOps,reserveOP,finishOP,deleteOP,maintenance,setMaintenance,settings,setSettings,auth,setAuth,toast,notify,totals,machineCosts,backup,restore,resetDemo,rid,dbStatus,isSupabaseConfigured};return <Ctx.Provider value={value}>{children}</Ctx.Provider>}
export const useApp=()=>useContext(Ctx);
