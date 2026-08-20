import{useMemo,useState}from'react';
import{ArrowDownCircle,ArrowUpCircle,CheckCircle2,Minus,Plus,RefreshCcw,Search}from'lucide-react';
import PageHeader from'../components/PageHeader';
import DataTable from'../components/DataTable';
import Modal from'../components/Modal';
import FormGrid,{Field}from'../components/FormGrid';
import{useApp}from'../context/AppContext';
import{availableOf,num}from'../utils/costs';

export const COLLABORATORS=['Vinicius','Luciano','Bruno','Gabriel','Sidney','Hanyel','Robson','Julia','Carla'];
const today=()=>new Date().toISOString().slice(0,10);
const movementStamp=m=>m.createdAt||`${m.date||''}T${m.time||'00:00:00'}`;
const sortMovements=rows=>[...rows].sort((a,b)=>movementStamp(b).localeCompare(movementStamp(a)));
const typeBadge=t=>{const cls=t==='entrada'?'bg-green-100 text-green-700':t==='saída'?'bg-brand-yellow text-brand-black':t==='devolução'?'bg-blue-100 text-blue-700':t==='perda'?'bg-brand-red text-white':t==='item removido'?'bg-black text-white':'bg-brand-light text-brand-steel dark:bg-white/10 dark:text-white/80';const label=t==='devolução'?'Voltou para o estoque':t==='item removido'?'Item removido':t;return <span className={`badge ${cls}`}>{label}</span>};

function QuickEmployeeMovements({movements,stock,quickMove,auth}){
 const[form,setForm]=useState({type:'saída',productId:'',qty:1,reason:COLLABORATORS[0]});
 const[query,setQuery]=useState('');
 const selected=stock.find(s=>s.id===form.productId);
 const filtered=useMemo(()=>{
  const q=query.trim().toLowerCase();
  if(!q)return stock.slice(0,12);
  return stock.filter(s=>`${s.code||''} ${s.name||''} ${s.category||''}`.toLowerCase().includes(q)).slice(0,18)
 },[stock,query]);
 const todayRows=sortMovements(movements.filter(m=>m.date===today()&&(!auth?.user||m.user===auth.user))).slice(0,12);
 const typeOptions=[
  {key:'entrada',label:'Entrada',icon:<ArrowDownCircle size={18}/>},
  {key:'saída',label:'Saída',icon:<ArrowUpCircle size={18}/>},
  {key:'devolução',label:'Voltou para o estoque',icon:<RefreshCcw size={18}/>},
  {key:'perda',label:'Perda',icon:<Minus size={18}/>}
 ];
 const register=()=>{
  if(!form.productId)return;
  quickMove({productId:form.productId,type:form.type,qty:form.qty,reason:form.reason});
  setForm(f=>({...f,qty:1,reason:f.reason||COLLABORATORS[0]}));
 };
 const cols=[{key:'date',label:'Data'},{key:'time',label:'Hora'},{key:'type',label:'Tipo',render:r=>typeBadge(r.type)},{key:'item',label:'Item'},{key:'qty',label:'Qtd.'},{key:'reason',label:'Colaborador'}];

 return <>
  <PageHeader title="Movimentação rápida" subtitle="Entrada, saída e retorno de ferramentas por colaborador"/>
  <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
   <div className="card">
    <h3 className="mb-4 text-xl font-semibold">Registrar movimentação</h3>

    <div className="mb-5 grid gap-3 sm:grid-cols-4">
     {typeOptions.map(t=><button key={t.key} type="button" onClick={()=>setForm({...form,type:t.key})} className={`${form.type===t.key?'btn-primary':'btn-ghost'} h-12 w-full`}>
      {t.icon}{t.label}
     </button>)}
    </div>

    <label className="mb-3 block font-semibold">Buscar ferramenta/material</label>
    <div className="mb-4 flex items-center gap-2 rounded-none border border-brand-line bg-white px-3 py-2 dark:border-white/10 dark:bg-white/10">
     <Search size={18}/>
     <input className="w-full bg-transparent outline-none text-brand-black dark:text-white" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Digite nome, código ou categoria"/>
    </div>

    <div className="mb-5 max-h-72 overflow-auto border border-brand-line dark:border-white/10">
     {filtered.map(item=>{
      const active=form.productId===item.id;
      return <button key={item.id} type="button" onClick={()=>setForm({...form,productId:item.id})} className={`grid w-full grid-cols-[1fr_auto] gap-3 border-b border-brand-line p-3 text-left transition last:border-b-0 dark:border-white/10 ${active?'bg-brand-red text-white':'bg-white hover:bg-black/5 dark:bg-white/5 dark:hover:bg-white/10'}`}>
       <span>
        <b className="block">{item.name}</b>
        <small className={active?'text-white/80':'text-brand-steel dark:text-white/60'}>{item.code||'Sem código'} · Disponível: {availableOf(item)} {item.unit}</small>
       </span>
       {active&&<CheckCircle2 size={20}/>}
      </button>
     })}
     {!filtered.length&&<p className="p-4 text-sm text-brand-steel dark:text-white/60">Nenhum item encontrado.</p>}
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
     <div>
      <label className="mb-2 block font-semibold">Quantidade</label>
      <div className="flex items-center gap-2">
       <button className="btn-ghost h-11" type="button" onClick={()=>setForm({...form,qty:Math.max(1,num(form.qty)-1)})}><Minus size={18}/></button>
       <input type="number" min="1" className="input h-11 text-center text-brand-black dark:text-white" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/>
       <button className="btn-ghost h-11" type="button" onClick={()=>setForm({...form,qty:num(form.qty)+1})}><Plus size={18}/></button>
      </div>
     </div>
     <div>
      <label className="mb-2 block font-semibold">Colaborador</label>
      <select className="input h-11 text-brand-black dark:text-white" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}>
       {COLLABORATORS.map(r=><option key={r}>{r}</option>)}
      </select>
     </div>
    </div>

    <button className="btn-primary mt-5 h-14 w-full text-base" disabled={!form.productId} onClick={register}>
     <CheckCircle2 size={20}/>Registrar {form.type}
    </button>
   </div>

   <div className="card">
    <h3 className="mb-4 text-xl font-semibold">Resumo do item</h3>
    {selected?<div className="space-y-3">
     <div className="border border-brand-line p-4 dark:border-white/10">
      <p className="text-sm text-brand-steel dark:text-white/60">Selecionado</p>
      <h4 className="text-lg font-semibold">{selected.name}</h4>
      <p className="text-sm text-brand-steel dark:text-white/60">{selected.code||'Sem código'}</p>
     </div>
     <div className="grid gap-3 sm:grid-cols-3">
      <div className="border border-brand-line p-4 dark:border-white/10"><p className="text-sm text-brand-steel dark:text-white/60">Estoque</p><b className="text-2xl">{selected.qty}</b></div>
      <div className="border border-brand-line p-4 dark:border-white/10"><p className="text-sm text-brand-steel dark:text-white/60">Disponível</p><b className="text-2xl">{availableOf(selected)}</b></div>
      <div className="border border-brand-line p-4 dark:border-white/10"><p className="text-sm text-brand-steel dark:text-white/60">Unidade</p><b className="text-2xl">{selected.unit}</b></div>
     </div>
    </div>:<p className="text-brand-steel dark:text-white/60">Selecione um item para ver o saldo.</p>}
   </div>
  </div>

  <div className="card mt-5">
   <h3 className="mb-4 text-xl font-semibold">Minhas movimentações de hoje</h3>
   <DataTable rows={todayRows} columns={cols}/>
  </div>
 </>
}

export default function Movements(){
 const{movements,stock,quickMove,auth}=useApp();
 const[edit,setEdit]=useState(null);
 const[filter,setFilter]=useState('Todos');
 const[search,setSearch]=useState('');
 const isEmployee=auth?.role==='almox';
 const cols=[{key:'date',label:'Data'},{key:'time',label:'Hora'},{key:'user',label:'Usuário'},{key:'type',label:'Tipo',render:r=>typeBadge(r.type)},{key:'item',label:'Item'},{key:'qty',label:'Quantidade'},{key:'reason',label:'Colaborador'},{key:'op',label:'OP'}];
 const adminRows=sortMovements(movements.filter(m=>(filter==='Todos'||m.type===filter)&&`${m.date||''} ${m.time||''} ${m.user||''} ${m.type||''} ${m.item||''} ${m.reason||''} ${m.op||''}`.toLowerCase().includes(search.toLowerCase())));
 if(isEmployee)return <QuickEmployeeMovements movements={movements} stock={stock} quickMove={quickMove} auth={auth}/>;
 return <>
  <PageHeader title="Movimentações" subtitle="Entrada, saída, retorno de ferramenta, perda, transferência e reserva de produção" actions={<button className="btn-primary" onClick={()=>setEdit({productId:stock[0]?.id,type:'entrada',qty:1,reason:COLLABORATORS[0]})}><Plus size={18}/>Nova movimentação</button>}/>
  <div className="card mb-4 grid gap-3 md:grid-cols-[1fr_auto]"><input className="input" placeholder="Buscar por item, colaborador, tipo, data ou usuário..." value={search} onChange={e=>setSearch(e.target.value)}/><select className="input" value={filter} onChange={e=>setFilter(e.target.value)}><option>Todos</option><option value="entrada">Entrada</option><option value="saída">Saída</option><option value="devolução">Voltou para o estoque</option><option value="perda">Perda</option></select></div><DataTable rows={adminRows} columns={cols}/>
  <Modal open={!!edit} title="Registrar movimentação" dirty={!!edit} onClose={()=>setEdit(null)}>
   <FormGrid>
    <Field label="Item" value={edit?.productId} options={stock.map(s=>({value:s.id,label:`${s.code} - ${s.name}`}))} onChange={v=>setEdit({...edit,productId:v})}/>
    <Field label="Tipo" value={edit?.type} options={['entrada','saída','devolução','perda','transferência','reserva produção']} onChange={v=>setEdit({...edit,type:v})}/>
    <Field label="Quantidade" type="number" value={edit?.qty} onChange={v=>setEdit({...edit,qty:v})}/>
    <Field label="Colaborador" value={edit?.reason} options={COLLABORATORS} onChange={v=>setEdit({...edit,reason:v})}/>
    <Field label="OP vinculada" value={edit?.op} onChange={v=>setEdit({...edit,op:v})}/>
   </FormGrid>
   <button className="btn-primary mt-5" onClick={()=>{quickMove(edit);setEdit(null)}}>Registrar</button>
  </Modal>
 </>
}
