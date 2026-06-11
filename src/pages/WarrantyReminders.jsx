import {useMemo,useState} from 'react';
import {CalendarDays,CheckCircle,Copy,ExternalLink,MessageCircle,Plus,ShieldCheck,Trash2} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormGrid,{Field} from '../components/FormGrid';
import {useApp} from '../context/AppContext';
import {today} from '../utils/costs';

const statuses=['Ativa','Mensagem enviada','Concluída','Cancelada'];
const providers=['Z-API','Twilio','Meta Cloud API','Manual'];
const warrantyMonthOptions=[{value:3,label:'3 meses'},{value:6,label:'6 meses'},{value:12,label:'12 meses'}];

const addMonths=(date,months=6)=>{const d=new Date(`${date||today()}T12:00:00`);d.setMonth(d.getMonth()+Number(months||0));return d.toISOString().slice(0,10)};
const addDays=(date,days)=>{const d=new Date(`${date||today()}T12:00:00`);d.setDate(d.getDate()+Number(days||0));return d.toISOString().slice(0,10)};
const diffDays=date=>Math.ceil((new Date(`${date}T12:00:00`)-new Date(`${today()}T12:00:00`))/86400000);
const onlyDigits=v=>String(v||'').replace(/\D/g,'');
const whatsappHref=(phone,message)=>`https://wa.me/${onlyDigits(phone)}?text=${encodeURIComponent(message||'')}`;
const getCustomerName=r=>String(r?.customerName||r?.customer_name||r?.clientName||r?.cliente||'').trim();
const getMachineName=r=>String(r?.machineName||r?.machine_name||r?.machine||r?.maquina||'').trim();
const defaultMessage=r=>{
 const customer=getCustomerName(r)||'tudo bem';
 const machine=getMachineName(r);
 const serial=String(r?.serialNumber||r?.serial_number||'').trim();
 const machineText=machine?` da máquina ${machine}${serial?` / série ${serial}`:''}`:' da sua máquina';
 return `Olá, ${customer}! Aqui é da GIFT Excellence. Passando para avisar que a garantia${machineText} está próxima do fim. Caso precise de suporte, estamos à disposição.`;
};
const isAutoMessage=(message,row)=>!message||message===defaultMessage(row)||String(message).includes('Olá, S?');
function statusClass(status,days){
 if(status==='Cancelada')return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200';
 if(status==='Concluída'||status==='Mensagem enviada')return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
 if(days<=7)return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
 return 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-white';
}

export default function WarrantyReminders(){
 const{warranties,setWarranties,machines,ops,rid,notify}=useApp();
 const[edit,setEdit]=useState(null);
 const[view,setView]=useState(null);
 const machineOptions=useMemo(()=>machines.map(m=>({value:m.id,label:`${m.code||'S/C'} - ${m.name}${m.model?` - Modelo ${m.model}`:''}`})),[machines]);
 const opOptions=useMemo(()=>ops.map(o=>({value:o.id,label:`${o.number||'OP'} - ${machines.find(m=>m.id===o.machineId)?.name||'Máquina'}`})),[ops,machines]);
 const rows=useMemo(()=>warranties.map(w=>{
  const days=diffDays(w.reminderDate||w.warrantyEndDate||today());
  return {...w,daysToReminder:days,message:isAutoMessage(w.message,w)?defaultMessage(w):w.message};
 }).sort((a,b)=>(a.reminderDate||'').localeCompare(b.reminderDate||'')),[warranties]);
 const kpis=useMemo(()=>({
  total:rows.length,
  due:rows.filter(r=>r.status==='Ativa'&&r.daysToReminder<=7).length,
  sent:rows.filter(r=>r.status==='Mensagem enviada'||r.reminderSentAt).length,
  canceled:rows.filter(r=>r.status==='Cancelada').length
 }),[rows]);
 const buildWarrantyDates=(deliveryDate=today(),warrantyMonths=6,reminderDaysBefore=7)=>{const warrantyEndDate=addMonths(deliveryDate,warrantyMonths);return{warrantyEndDate,reminderDate:addDays(warrantyEndDate,-Number(reminderDaysBefore||7))}};
 const normalizeWarranty=row=>{const base={...row};const dates=buildWarrantyDates(base.deliveryDate||today(),base.warrantyMonths||6,base.reminderDaysBefore||7);if(!base.warrantyEndDate)base.warrantyEndDate=dates.warrantyEndDate;if(!base.reminderDate)base.reminderDate=dates.reminderDate;if(isAutoMessage(base.message,base))base.message=defaultMessage(base);return base};
 const newWarranty=()=>setEdit(normalizeWarranty({customerName:'',customerPhone:'55',machineId:'',opId:'',machineName:'',serialNumber:'',deliveryDate:today(),warrantyMonths:6,reminderDaysBefore:7,status:'Ativa',provider:'Z-API'}));
 const openEdit=row=>setEdit(normalizeWarranty(row));
 const updateEdit=(patch)=>setEdit(prev=>{
  const next={...prev,...patch};
  if('machineId'in patch){const m=machines.find(x=>x.id===patch.machineId);if(m)next.machineName=m.name;}
  if('opId'in patch){const op=ops.find(x=>x.id===patch.opId);const m=machines.find(x=>x.id===op?.machineId);if(m){next.machineId=m.id;next.machineName=m.name;}}
  if('deliveryDate'in patch||'warrantyMonths'in patch||'reminderDaysBefore'in patch){
   const end=addMonths(next.deliveryDate,next.warrantyMonths||6);next.warrantyEndDate=end;next.reminderDate=addDays(end,-Number(next.reminderDaysBefore||7));
  }
  if(!next.warrantyEndDate){const end=addMonths(next.deliveryDate,next.warrantyMonths||6);next.warrantyEndDate=end;next.reminderDate=addDays(end,-Number(next.reminderDaysBefore||7));}
  const shouldRefreshMessage=isAutoMessage(prev?.message,prev)||['customerName','machineName','serialNumber','machineId','opId'].some(key=>key in patch);
  if(shouldRefreshMessage)next.message=defaultMessage(next);
  return next;
 });
 const regenerateMessage=()=>setEdit(prev=>prev?{...prev,message:defaultMessage(prev)}:prev);
 const save=()=>{
  if(!edit.customerName)return notify('Informe o nome do cliente','error');
  if(!onlyDigits(edit.customerPhone))return notify('Informe o WhatsApp do cliente','error');
  if(!edit.deliveryDate)return notify('Informe a data de entrega','error');
  const end=edit.warrantyEndDate||addMonths(edit.deliveryDate,edit.warrantyMonths||6);
  const finalRow={...edit,warrantyEndDate:end,reminderDate:edit.reminderDate||addDays(end,-Number(edit.reminderDaysBefore||7))};
  const clean={...finalRow,customerPhone:onlyDigits(finalRow.customerPhone),warrantyMonths:Number(finalRow.warrantyMonths||6),reminderDaysBefore:Number(finalRow.reminderDaysBefore||7),status:finalRow.status||'Ativa',message:isAutoMessage(finalRow.message,edit)?defaultMessage(finalRow):(finalRow.message||defaultMessage(finalRow)),updatedAt:new Date().toISOString()};
  setWarranties(ws=>clean.id?ws.map(w=>w.id===clean.id?clean:w):[{...clean,id:rid('gar'),createdAt:new Date().toISOString()},...ws]);
  setEdit(null);notify('Garantia salva');
 };
 const remove=r=>{if(confirm(`Remover garantia de ${r.customerName}?`)){setWarranties(ws=>ws.filter(w=>w.id!==r.id));notify('Garantia removida')}};
 const markSent=r=>{setWarranties(ws=>ws.map(w=>w.id===r.id?{...w,status:'Mensagem enviada',reminderSentAt:new Date().toISOString()}:w));notify('Marcado como enviado')};
 const copyMessage=async r=>{await navigator.clipboard?.writeText(r.message||defaultMessage(r));notify('Mensagem copiada')};

 return <>
  <PageHeader title="Garantias e WhatsApp" subtitle="Controle pós-entrega: escolha 3, 6 ou 12 meses e avise automaticamente antes do vencimento" actions={<button className="btn-primary" onClick={newWarranty}><Plus size={18}/>Nova garantia</button>}/>
  <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Garantias</p><strong className="text-2xl">{kpis.total}</strong></div>
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">A vencer / disparar</p><strong className="text-2xl text-brand-yellow">{kpis.due}</strong></div>
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Mensagens enviadas</p><strong className="text-2xl">{kpis.sent}</strong></div>
   <div className="card-premium"><p className="text-xs uppercase text-brand-steel">Canceladas</p><strong className="text-2xl">{kpis.canceled}</strong></div>
  </div>
  <div className="mb-5 border border-brand-line bg-white p-4 text-sm dark:border-white/10 dark:bg-brand-graphite">
   <div className="flex items-start gap-3"><ShieldCheck className="mt-1 text-brand-turquoise" size={22}/><div><strong>Como funciona:</strong><p className="text-brand-steel dark:text-white/60">Cadastre a entrega da máquina. O sistema calcula fim da garantia e data de aviso. Para automação real, rode o SQL adicional e publique a Supabase Edge Function incluída no pacote.</p></div></div>
  </div>
  <DataTable rows={rows} empty="Nenhuma garantia cadastrada" columns={[
   {key:'customer',label:'Cliente',render:r=><div><strong>{r.customerName}</strong><p className="text-xs text-brand-steel">WhatsApp: {r.customerPhone}</p></div>},
   {key:'machine',label:'Máquina',render:r=><div><strong>{r.machineName||'-'}</strong><p className="text-xs text-brand-steel">Série: {r.serialNumber||'-'} • OP: {ops.find(o=>o.id===r.opId)?.number||'-'}</p></div>},
   {key:'dates',label:'Datas',render:r=><div className="text-sm"><p className="flex items-center gap-1"><CalendarDays size={14}/>Entrega: {r.deliveryDate||'-'}</p><p className="text-xs text-brand-steel">Fim: {r.warrantyEndDate||'-'} • Aviso: {r.reminderDate||'-'}</p></div>},
   {key:'status',label:'Status',render:r=><span className={`inline-flex whitespace-nowrap px-2 py-1 text-xs font-bold ${statusClass(r.status,r.daysToReminder)}`}>{r.status||'Ativa'}</span>},
   {key:'send',label:'WhatsApp',render:r=><div className="flex flex-wrap gap-2"><a className="btn-primary p-2" href={whatsappHref(r.customerPhone,r.message)} target="_blank" rel="noreferrer"><MessageCircle size={15}/>Abrir</a><button className="btn-ghost p-2" onClick={()=>copyMessage(r)}><Copy size={15}/></button><button className="btn-warning p-2" onClick={()=>markSent(r)}><CheckCircle size={15}/>Enviado</button></div>}
  ]} onView={setView} onEdit={openEdit} onDelete={remove}/>
  <Modal open={!!edit} title={edit?.id?'Alterar garantia':'Nova garantia'} onClose={()=>setEdit(null)} size="max-w-5xl">
   <FormGrid>
    <Field label="Cliente" value={edit?.customerName} onChange={v=>updateEdit({customerName:v})}/>
    <Field label="WhatsApp do cliente" value={edit?.customerPhone} placeholder="5531999999999" onChange={v=>updateEdit({customerPhone:v})}/>
    <Field label="Vincular OP" value={edit?.opId} options={[{value:'',label:'Sem vínculo'},...opOptions]} onChange={v=>updateEdit({opId:v})}/>
    <Field label="Vincular máquina" value={edit?.machineId} options={[{value:'',label:'Sem vínculo'},...machineOptions]} onChange={v=>updateEdit({machineId:v})}/>
    <Field label="Nome da máquina" value={edit?.machineName} onChange={v=>updateEdit({machineName:v})}/>
    <Field label="Número de série / identificação" value={edit?.serialNumber} onChange={v=>updateEdit({serialNumber:v})}/>
    <Field label="Data de entrega" type="date" value={edit?.deliveryDate} onChange={v=>updateEdit({deliveryDate:v})}/>
    <Field label="Garantia" value={edit?.warrantyMonths} options={warrantyMonthOptions} onChange={v=>updateEdit({warrantyMonths:Number(v)})}/>
    <Field label="Avisar quantos dias antes" type="number" min="1" value={edit?.reminderDaysBefore} onChange={v=>updateEdit({reminderDaysBefore:v})}/>
    <Field label="Fim da garantia" type="date" value={edit?.warrantyEndDate} onChange={v=>updateEdit({warrantyEndDate:v})}/>
    <Field label="Data do aviso" type="date" value={edit?.reminderDate} onChange={v=>updateEdit({reminderDate:v})}/>
    <Field label="Status" value={edit?.status} options={statuses} onChange={v=>updateEdit({status:v})}/>
    <Field label="Provedor planejado" value={edit?.provider} options={providers} onChange={v=>updateEdit({provider:v})}/>
    <Field label="Observações internas" textarea value={edit?.notes} onChange={v=>updateEdit({notes:v})}/>
    <Field label="Mensagem do WhatsApp" textarea value={edit?.message} onChange={v=>updateEdit({message:v})}/>
   </FormGrid>
   <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-brand-steel dark:text-white/60"><button className="btn-ghost" onClick={regenerateMessage}>Regerar mensagem com nome do cliente</button><span>Ao trocar cliente, máquina, garantia ou data de entrega, o sistema recalcula as datas automaticamente.</span></div>
   <div className="mt-5 flex flex-wrap gap-2"><button className="btn-primary" onClick={save}>Salvar garantia</button>{edit?.customerPhone&&<a className="btn-warning" href={whatsappHref(edit.customerPhone,edit.message||defaultMessage(edit))} target="_blank" rel="noreferrer"><ExternalLink size={16}/>Testar mensagem</a>}{edit?.id&&<button className="btn-danger" onClick={()=>remove(edit)}><Trash2 size={16}/>Remover</button>}</div>
  </Modal>
  <Modal open={!!view} title={`Garantia - ${view?.customerName||''}`} onClose={()=>setView(null)} size="max-w-3xl">
   {view&&<div className="space-y-4"><div className="card-premium"><p className="text-xs uppercase text-brand-steel">Mensagem</p><p className="whitespace-pre-wrap">{view.message||defaultMessage(view)}</p></div><div className="grid gap-3 md:grid-cols-2"><div className="card-premium"><p className="text-xs uppercase text-brand-steel">Cliente</p><strong>{view.customerName}</strong><p>{view.customerPhone}</p></div><div className="card-premium"><p className="text-xs uppercase text-brand-steel">Garantia</p><strong>{view.warrantyEndDate}</strong><p>Aviso: {view.reminderDate}</p></div></div><div className="flex flex-wrap gap-2"><a className="btn-primary" href={whatsappHref(view.customerPhone,view.message||defaultMessage(view))} target="_blank" rel="noreferrer"><MessageCircle size={16}/>Abrir WhatsApp</a><button className="btn-warning" onClick={()=>markSent(view)}><CheckCircle size={16}/>Marcar enviado</button></div></div>}
  </Modal>
 </>
}
