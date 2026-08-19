import{useMemo,useState}from'react';
import{ArrowDownCircle,ArrowUpCircle,CheckCircle2,Minus,Plus,RefreshCcw,Search}from'lucide-react';
import PageHeader from'../components/PageHeader';
import DataTable from'../components/DataTable';
import Modal from'../components/Modal';
import FormGrid,{Field}from'../components/FormGrid';
import{useApp}from'../context/AppContext';
import{canSeeCosts}from'../utils/permissions';
import{availableOf,num}from'../utils/costs';

const today=()=>new Date().toISOString().slice(0,10);

function QuickEmployeeMovements({movements,stock,quickMove,auth}){
 const[form,setForm]=useState({type:'saída',productId:'',qty:1,reason:'Uso em produção'});
 const[query,setQuery]=useState('');
 const selected=stock.find(s=>s.id===form.productId);
 const filtered=useMemo(()=>{
  const q=query.trim().toLowerCase();
  if(!q)return stock.slice(0,12);
  return stock.filter(s=>`${s.code||''} ${s.name||''} ${s.category||''}`.toLowerCase().includes(q)).slice(0,18)
 },[stock,query]);
 const todayRows=movements.filter(m=>m.date===today()&&(!auth?.user||m.user===auth.user)).slice(0,12);
 const typeOptions=[
  {key:'entrada',label:'Entrada',icon:<ArrowDownCircle size={18}/>},
  {key:'saída',label:'Saída',icon:<ArrowUpCircle size={18}/>},
  {key:'devolução',label:'Voltou para o estoque',icon:<RefreshCcw size={18}/>},
  {key:'perda',label:'Perda',icon:<Minus size={18}/>}
 ];
 const reasons=['Uso em produção','Reposição de estoque','Voltou para o estoque','Perda/Avaria','Empréstimo','Ajuste de contagem','Outro'];
 const register=()=>{
  if(!form.productId)return;
  quickMove({productId:form.productId,type:form.type,qty:form.qty,reason:form.reason});
  setForm(f=>({...f,qty:1,reason:f.reason||'Uso em produção'}));
 };
 const cols=[{key:'date',label:'Data'},{key:'type',label:'Tipo'},{key:'item',label:'Item'},{key:'qty',label:'Qtd.'},{key:'reason',label:'Motivo'}];

 return <>
  <PageHeader title="Movimentação rápida" subtitle="Entrada e saída de ferramentas e materiais no balcão do almoxarifado"/>
  <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
   <div className="card">
    <h3 className="mb-4 text-xl font-semibold">Registrar movimentação</h3>

    <div className="mb-5 grid gap-3 sm:grid-cols-4">
     {typeOptions.map(t=><button key={t.key} type="button" onClick={()=>setForm({...form,type:t.key,reason:t.key==='entrada'?'Reposição de estoque':t.key==='devolução'?'Voltou para o estoque':t.key==='perda'?'Perda/Avaria':'Uso em produção'})} className={`${form.type===t.key?'btn-primary':'btn-ghost'} h-12 w-full`}>
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
      <label className="mb-2 block font-semibold">Motivo</label>
      <select className="input h-11 text-brand-black dark:text-white" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}>
       {reasons.map(r=><option key={r}>{r}</option>)}
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
     <div className="grid grid-cols-2 gap-3">
      <div className="border border-brand-line p-4 dark:border-white/10"><p className="text-sm text-brand-steel dark:text-white/60">Estoque</p><b className="text-2xl">{selected.qty}</b></div>
      <div className="border border-brand-line p-4 dark:border-white/10"><p className="text-sm text-brand-steel dark:text-white/60">Disponível</p><b className="text-2xl">{availableOf(selected)}</b></div>
      <div className="border border-brand-line p-4 dark:border-white/10"><p className="text-sm text-brand-steel dark:text-white/60">Reservado</p><b className="text-2xl">{selected.reserved||0}</b></div>
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
 const showAdmin=canSeeCosts(auth);
 const[edit,setEdit]=useState(null);
 const cols=[{key:'date',label:'Data'},{key:'user',label:'Usuário'},{key:'type',label:'Tipo'},{key:'item',label:'Item'},{key:'qty',label:'Quantidade'},{key:'reason',label:'Motivo'}];
 if(showAdmin)cols.push({key:'op',label:'OP'});
 if(!showAdmin)return <QuickEmployeeMovements movements={movements} stock={stock} quickMove={quickMove} auth={auth}/>;
 return <>
  <PageHeader title="Movimentações" subtitle="Entrada, saída, devolução, perda, transferência e reserva de produção" actions={<button className="btn-primary" onClick={()=>setEdit({productId:stock[0]?.id,type:'entrada',qty:1,reason:''})}><Plus size={18}/>Nova movimentação</button>}/>
  <DataTable rows={movements} columns={cols}/>
  <Modal open={!!edit} title="Registrar movimentação" onClose={()=>setEdit(null)}>
   <FormGrid>
    <Field label="Item" value={edit?.productId} options={stock.map(s=>({value:s.id,label:`${s.code} - ${s.name}`}))} onChange={v=>setEdit({...edit,productId:v})}/>
    <Field label="Tipo" value={edit?.type} options={['entrada','saída','devolução','perda','transferência','reserva produção']} onChange={v=>setEdit({...edit,type:v})}/>
    <Field label="Quantidade" type="number" value={edit?.qty} onChange={v=>setEdit({...edit,qty:v})}/>
    <Field label="Motivo" value={edit?.reason} onChange={v=>setEdit({...edit,reason:v})}/>
    {showAdmin&&<Field label="OP vinculada" value={edit?.op} onChange={v=>setEdit({...edit,op:v})}/>}
   </FormGrid>
   <button className="btn-primary mt-5" onClick={()=>{quickMove(edit);setEdit(null)}}>Registrar</button>
  </Modal>
 </>
}
