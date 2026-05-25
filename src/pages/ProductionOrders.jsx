import {useMemo,useState} from 'react';
import {AlertTriangle,CalendarDays,CheckCircle,ClipboardList,Eye,PackageCheck,Plus,Trash2} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormGrid,{Field} from '../components/FormGrid';
import {useApp} from '../context/AppContext';
import {availableOf,calcMachineCost,currency,num,today} from '../utils/costs';

const opStatus=['Planejada','Materiais reservados','Em produção','Pausada','Finalizada','Cancelada'];
const priorities=['Normal','Alta','Urgente'];

function pct(value){return Math.max(0,Math.min(100,num(value)))}
function statusClass(status){
 if(status==='Finalizada')return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
 if(status==='Cancelada')return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200';
 if(status==='Em produção')return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200';
 if(status==='Materiais reservados')return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
 return 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-white';
}

export default function ProductionOrders(){
 const{ops,setOps,machines,bom,stock,reserveOP,finishOP,deleteOP,rid,notify}=useApp();
 const[edit,setEdit]=useState(null);
 const[view,setView]=useState(null);

 const enriched=useMemo(()=>ops.map(o=>{
  const machine=machines.find(x=>x.id===o.machineId);
  const costing=machine?calcMachineCost(machine,bom,stock):{lines:[],total:0,price:0,materials:0,labor:0,indirect:0};
  const lines=costing.lines.map(l=>{
   const available=availableOf(l.product||{});
   const reserved=num(l.product?.reserved);
   const need=num(l.qty);
   return {...l,available,reserved,missing:Math.max(0,need-available),reservedMissing:Math.max(0,need-reserved)};
  });
  const missing=lines.filter(l=>l.missing>0);
  const reservedMissing=lines.filter(l=>l.reservedMissing>0);
  return {...o,machineName:machine?.name||'Máquina não encontrada',machineCode:machine?.code||'',costing,lines,materialsCount:lines.length,missingCount:missing.length,reservedMissingCount:reservedMissing.length,cost:costing.total,price:costing.price};
 }),[ops,machines,bom,stock]);

 const kpis=useMemo(()=>({
  total:enriched.length,
  planned:enriched.filter(o=>o.status==='Planejada').length,
  active:enriched.filter(o=>['Materiais reservados','Em produção','Pausada'].includes(o.status)).length,
  finished:enriched.filter(o=>o.status==='Finalizada').length,
  value:enriched.reduce((a,o)=>a+num(o.cost),0)
 }),[enriched]);

 const newOP=()=>setEdit({machineId:machines[0]?.id||'',status:'Planejada',priority:'Normal',progress:0,plannedAt:today(),dueAt:'',responsible:'',notes:''});
 const save=()=>{
  if(!edit?.machineId)return notify('Escolha uma máquina para criar a OP','error');
  const clean={...edit,progress:pct(edit.progress),priority:edit.priority||'Normal',status:edit.status||'Planejada'};
  setOps(os=>clean.id?os.map(o=>o.id===clean.id?clean:o):[{...clean,id:rid('op'),number:`OP-${String(os.length+1).padStart(4,'0')}`,realCost:0,createdAt:today()},...os]);
  setEdit(null);notify('OP salva');
 };
 const remove=r=>{if(confirm(`Remover ${r.number}? Se ela tiver materiais reservados, a reserva será liberada.`))deleteOP(r.id)};
 const runReserve=r=>{const ok=reserveOP(r.id);if(ok)setView(null)};
 const runFinish=r=>finishOP(r.id);

 return <>
  <PageHeader title="Ordens de Produção" subtitle="Planeje, reserve materiais, acompanhe custos e finalize a fabricação" actions={<button className="btn-primary" onClick={newOP}><Plus size={18}/>Nova OP</button>}/>

  <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">OPs</p><strong className="text-2xl">{kpis.total}</strong></div>
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Planejadas</p><strong className="text-2xl">{kpis.planned}</strong></div>
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Em andamento</p><strong className="text-2xl">{kpis.active}</strong></div>
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Finalizadas</p><strong className="text-2xl">{kpis.finished}</strong></div>
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Custo previsto</p><strong className="text-xl">{currency(kpis.value)}</strong></div>
  </div>

  <DataTable rows={enriched} empty="Nenhuma OP cadastrada" columns={[
   {key:'number',label:'OP',render:r=><div><strong>{r.number}</strong><p className="text-xs text-brand-steel">{r.priority||'Normal'} • {r.createdAt||r.plannedAt||'-'}</p></div>},
   {key:'machineName',label:'Máquina',render:r=><div><strong>{r.machineName}</strong><p className="text-xs text-brand-steel">{r.machineCode}</p></div>},
   {key:'status',label:'Status',render:r=><span className={`inline-flex whitespace-nowrap px-2 py-1 text-xs font-bold ${statusClass(r.status)}`}>{r.status}</span>},
   {key:'materials',label:'Materiais',render:r=><div className="text-sm"><strong>{r.materialsCount}</strong> itens{r.missingCount>0?<p className="mt-1 flex items-center gap-1 text-xs font-bold text-brand-red"><AlertTriangle size={13}/>{r.missingCount} com falta</p>:<p className="mt-1 text-xs text-emerald-600">Disponível</p>}</div>},
   {key:'dates',label:'Datas',render:r=><div className="text-sm"><p className="flex items-center gap-1"><CalendarDays size={14}/>{r.plannedAt||'-'}</p><p className="text-xs text-brand-steel">Prazo: {r.dueAt||'-'}</p></div>},
   {key:'progress',label:'Progresso',render:r=><div className="min-w-36"><div className="h-8 border bg-white dark:bg-white/10"><div className="h-full bg-brand-turquoise text-center text-xs font-semibold leading-8 text-brand-black" style={{width:`${pct(r.progress)}%`}}>{pct(r.progress)}%</div></div></div>},
   {key:'cost',label:'Custos',render:r=><div><strong>{currency(r.cost)}</strong><p className="text-xs text-brand-steel">Real: {currency(r.realCost)}</p></div>},
   {key:'actions2',label:'Produção',render:r=><div className="flex flex-wrap gap-2"><button className="btn-warning p-2" onClick={()=>runReserve(r)} disabled={r.status==='Finalizada'||r.status==='Cancelada'}><PackageCheck size={15}/>Reservar</button><button className="btn-primary p-2" onClick={()=>runFinish(r)} disabled={r.status==='Finalizada'||r.status==='Cancelada'}><CheckCircle size={15}/>Finalizar</button></div>}
  ]} onView={setView} onEdit={setEdit} onDelete={remove}/>

  <Modal open={!!edit} title={edit?.id?'Alterar OP':'Adicionar OP'} onClose={()=>setEdit(null)} size="max-w-4xl">
   <FormGrid>
    {edit?.number&&<Field label="Número da OP" value={edit.number} onChange={v=>setEdit({...edit,number:v})}/>} 
    <Field label="Máquina" value={edit?.machineId} options={machines.map(m=>({value:m.id,label:`${m.code} - ${m.name}`}))} onChange={v=>setEdit({...edit,machineId:v})}/>
    <Field label="Status" value={edit?.status} options={opStatus} onChange={v=>setEdit({...edit,status:v})}/>
    <Field label="Prioridade" value={edit?.priority} options={priorities} onChange={v=>setEdit({...edit,priority:v})}/>
    <Field label="Data planejada" type="date" value={edit?.plannedAt} onChange={v=>setEdit({...edit,plannedAt:v})}/>
    <Field label="Prazo" type="date" value={edit?.dueAt} onChange={v=>setEdit({...edit,dueAt:v})}/>
    <Field label="Responsável" value={edit?.responsible} onChange={v=>setEdit({...edit,responsible:v})}/>
    <Field label="Progresso %" type="number" value={edit?.progress} onChange={v=>setEdit({...edit,progress:v})}/>
    <Field label="Observações" textarea value={edit?.notes} onChange={v=>setEdit({...edit,notes:v})}/>
   </FormGrid>
   <div className="mt-5 flex flex-wrap gap-2"><button className="btn-primary" onClick={save}>Salvar OP</button>{edit?.id&&<button className="btn-danger" onClick={()=>remove(edit)}><Trash2 size={16}/>Remover OP</button>}</div>
  </Modal>

  <Modal open={!!view} title={`Detalhes ${view?.number||''}`} onClose={()=>setView(null)} size="max-w-6xl">
   {view&&<div className="space-y-5">
    <div className="grid gap-3 md:grid-cols-4">
     <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Máquina</p><strong>{view.machineName}</strong></div>
     <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Status</p><strong>{view.status}</strong></div>
     <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Custo previsto</p><strong>{currency(view.cost)}</strong></div>
     <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Preço sugerido</p><strong>{currency(view.price)}</strong></div>
    </div>
    <div className="rounded-none border border-brand-line dark:border-white/10"><div className="flex items-center gap-2 border-b border-brand-line p-3 font-semibold dark:border-white/10"><ClipboardList size={18}/> Materiais necessários</div><div className="overflow-x-auto"><table className="min-w-full"><thead><tr><th>Item</th><th>Setor</th><th>Necessário</th><th>Disponível</th><th>Reservado</th><th>Falta</th><th>Custo</th></tr></thead><tbody>{view.lines.length?view.lines.map(l=><tr key={l.id}><td><strong>{l.product?.name||'Item não encontrado'}</strong><p className="text-xs text-brand-steel">{l.product?.code||''}</p></td><td>{l.sector}</td><td>{num(l.qty)} {l.product?.unit||''}</td><td>{l.available}</td><td>{l.reserved}</td><td>{l.missing>0?<span className="font-bold text-brand-red">{l.missing}</span>:<span className="text-emerald-600">OK</span>}</td><td>{currency(l.total)}</td></tr>):<tr><td colSpan="7" className="py-8 text-center text-brand-steel">Nenhum material definido no BOM desta máquina</td></tr>}</tbody></table></div></div>
    {view.notes&&<div className="card-premium"><p className="text-xs uppercase text-brand-steel">Observações</p><p>{view.notes}</p></div>}
    <div className="flex flex-wrap gap-2"><button className="btn-warning" onClick={()=>runReserve(view)}><PackageCheck size={16}/>Reservar materiais</button><button className="btn-primary" onClick={()=>runFinish(view)}><CheckCircle size={16}/>Finalizar OP</button><button className="btn-danger" onClick={()=>remove(view)}><Trash2 size={16}/>Remover OP</button></div>
   </div>}
  </Modal>
 </>
}
