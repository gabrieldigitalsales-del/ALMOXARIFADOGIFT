import {useMemo,useState} from 'react';
import {CheckCircle,Factory,Plus,Search,Trash2} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import FormGrid,{Field} from '../components/FormGrid';
import {useApp} from '../context/AppContext';
import {today} from '../utils/costs';

const blank={machineId:'',serialNumber:'',soldAt:today(),customerName:'',opNumber:'',notes:''};
const normal=s=>String(s||'').trim();
const lower=s=>normal(s).toLowerCase();

export default function SoldMachines(){
 const{machines,ops,soldMachines,setSoldMachines,rid,notify}=useApp();
 const[form,setForm]=useState({...blank,machineId:machines[0]?.id||''});
 const[query,setQuery]=useState('');
 const[selectedOp,setSelectedOp]=useState('');

 const machineOptions=useMemo(()=>machines.map(m=>({value:m.id,label:`${m.code||'S/C'} - ${m.name}${m.model?` - ${m.model}`:''}${m.client?` • ${m.client}`:''}`})),[machines]);
 const opOptions=useMemo(()=>[{value:'',label:'Sem OP vinculada'},...ops.map(o=>{const m=machines.find(x=>x.id===o.machineId);return{value:o.id,label:`${o.number||'OP'} - ${m?.name||'Máquina'}${m?.model?` - ${m.model}`:''}`}})],[ops,machines]);
 const selectedMachine=machines.find(m=>m.id===form.machineId);

 const enriched=useMemo(()=>soldMachines.map(s=>{
  const machine=machines.find(m=>m.id===s.machineId);
  return {...s,machine,machineCode:s.machineCode||machine?.code||'',machineName:s.machineName||machine?.name||'Máquina removida',machineModel:s.machineModel||machine?.model||'',customerName:s.customerName||machine?.client||''};
 }).sort((a,b)=>String(b.soldAt||'').localeCompare(String(a.soldAt||''))),[soldMachines,machines]);

 const filtered=useMemo(()=>{const q=lower(query);if(!q)return enriched;return enriched.filter(r=>[r.serialNumber,r.machineCode,r.machineName,r.machineModel,r.customerName,r.opNumber,r.notes].some(v=>lower(v).includes(q)))},[enriched,query]);
 const usedSerials=useMemo(()=>new Set(soldMachines.map(s=>lower(s.serialNumber)).filter(Boolean)),[soldMachines]);

 const chooseOp=id=>{setSelectedOp(id);const op=ops.find(o=>o.id===id);if(!op)return setForm(f=>({...f,opNumber:''}));const machine=machines.find(m=>m.id===op.machineId);setForm(f=>({...f,machineId:op.machineId||f.machineId,opNumber:op.number||'',customerName:f.customerName||machine?.client||''}))};
 const chooseMachine=id=>{const machine=machines.find(m=>m.id===id);setForm(f=>({...f,machineId:id,customerName:f.customerName||machine?.client||''}))};
 const save=()=>{
  if(!form.machineId)return notify('Selecione a máquina vendida','error');
  if(!normal(form.serialNumber))return notify('Digite o número de série','error');
  if(usedSerials.has(lower(form.serialNumber)))return notify('Esse número de série já está no histórico','error');
  const machine=machines.find(m=>m.id===form.machineId);
  const row={id:rid('sold'),machineId:form.machineId,machineCode:machine?.code||'',machineName:machine?.name||'',machineModel:machine?.model||'',customerName:normal(form.customerName||machine?.client),serialNumber:normal(form.serialNumber).toUpperCase(),soldAt:form.soldAt||today(),opNumber:normal(form.opNumber),notes:normal(form.notes),createdAt:new Date().toISOString()};
  setSoldMachines(v=>[row,...v]);
  setForm({...blank,machineId:machines[0]?.id||''});
  setSelectedOp('');
  notify('Máquina vendida registrada no histórico');
 };
 const remove=r=>{if(confirm(`Remover do histórico a série ${r.serialNumber}?`)){setSoldMachines(v=>v.filter(x=>x.id!==r.id));notify('Registro removido')}};

 return <>
  <PageHeader title="Máquinas Vendidas" subtitle="Controle por número de série, sem precisar de planilha. Selecione a máquina, informe a série e salve no histórico." actions={<button className="btn-primary" onClick={save}><Plus size={18}/>Registrar venda</button>}/>

  <div className="mb-5 grid gap-3 md:grid-cols-4">
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Total vendido</p><strong className="text-2xl">{soldMachines.length}</strong></div>
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Máquinas cadastradas</p><strong className="text-2xl">{machines.length}</strong></div>
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Última série</p><strong className="text-xl">{enriched[0]?.serialNumber||'-'}</strong></div>
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Última venda</p><strong className="text-xl">{enriched[0]?.soldAt||'-'}</strong></div>
  </div>

  <section className="mb-5 rounded-none border border-brand-line bg-white p-4 shadow-industrial dark:border-white/10 dark:bg-brand-graphite">
   <div className="mb-4 flex items-center gap-2 font-semibold"><Factory size={18}/> Registrar máquina vendida</div>
   <FormGrid>
    <Field label="OP vinculada (opcional)" value={selectedOp} options={opOptions} onChange={chooseOp}/>
    <Field label="Máquina vendida" value={form.machineId} options={machineOptions} onChange={chooseMachine}/>
    <Field label="Número de série" value={form.serialNumber} placeholder="Ex: GE-040T-141" onChange={v=>setForm({...form,serialNumber:v})}/>
    <Field label="Data da venda / entrega" type="date" value={form.soldAt} onChange={v=>setForm({...form,soldAt:v})}/>
    <Field label="Cliente" value={form.customerName} placeholder="Preenche pelo cadastro da máquina se tiver" onChange={v=>setForm({...form,customerName:v})}/>
    <Field label="Número da OP" value={form.opNumber} placeholder="Ex: OP-0001" onChange={v=>setForm({...form,opNumber:v})}/>
    <Field label="Observações" textarea value={form.notes} placeholder="Ex: entregue com manual, garantia iniciada, etc." onChange={v=>setForm({...form,notes:v})}/>
   </FormGrid>
   {selectedMachine&&<div className="mt-4 flex flex-wrap gap-2 text-xs text-brand-steel dark:text-white/60"><span className="badge bg-brand-light text-brand-black dark:bg-white/10 dark:text-white">Código: {selectedMachine.code||'-'}</span><span className="badge bg-brand-light text-brand-black dark:bg-white/10 dark:text-white">Modelo: {selectedMachine.model||'-'}</span><span className="badge bg-brand-light text-brand-black dark:bg-white/10 dark:text-white">Cliente no cadastro: {selectedMachine.client||'-'}</span></div>}
   <div className="mt-5 flex flex-wrap gap-2"><button className="btn-primary" onClick={save}><CheckCircle size={16}/>Salvar no histórico</button><button className="btn-ghost" onClick={()=>{setForm({...blank,machineId:machines[0]?.id||''});setSelectedOp('')}}>Limpar</button></div>
  </section>

  <div className="mb-4 flex flex-col gap-3 rounded-none border border-brand-line bg-white p-4 dark:border-white/10 dark:bg-brand-graphite md:flex-row md:items-center md:justify-between">
   <div><strong>Histórico de máquinas vendidas</strong><p className="text-sm text-brand-steel dark:text-white/60">Fica salvo no Supabase e também entra no backup JSON do sistema.</p></div>
   <label className="relative w-full md:w-80"><Search size={16} className="absolute left-3 top-3 text-brand-steel"/><input className="input pl-9" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar série, cliente, máquina ou OP"/></label>
  </div>

  <DataTable rows={filtered} empty="Nenhuma máquina vendida registrada" columns={[
   {key:'serialNumber',label:'Série',render:r=><div><strong>{r.serialNumber}</strong><p className="text-xs text-brand-steel">Venda/entrega: {r.soldAt||'-'}</p></div>},
   {key:'machine',label:'Máquina',render:r=><div><strong>{r.machineName}</strong><p className="text-xs text-brand-steel">Código: {r.machineCode||'-'} • Modelo: {r.machineModel||'-'}</p></div>},
   {key:'customerName',label:'Cliente',render:r=>r.customerName||'-'},
   {key:'opNumber',label:'OP',render:r=>r.opNumber||'-'},
   {key:'notes',label:'Observações',render:r=><span className="text-sm text-brand-steel dark:text-white/70">{r.notes||'-'}</span>}
  ]} onDelete={remove}/>
 </>
}
