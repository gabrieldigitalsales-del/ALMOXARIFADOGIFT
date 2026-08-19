import{useMemo,useState}from'react';
import{ArrowLeft,Clock3,History,PackageCheck,UserRound}from'lucide-react';
import PageHeader from'../components/PageHeader';
import DataTable from'../components/DataTable';
import{useApp}from'../context/AppContext';
import{num}from'../utils/costs';
import{COLLABORATORS}from'./Movements';

function buildHoldings(movements){
 const allowed=new Set(COLLABORATORS);
 const map=Object.fromEntries(COLLABORATORS.map(name=>[name,new Map()]));
 movements.forEach(m=>{
  const person=m.reason;
  if(!allowed.has(person))return;
  const item=m.item||'Item sem nome';
  const current=map[person].get(item)||{item,qty:0,lastDate:'',lastTime:''};
  if(m.type==='saída')current.qty+=num(m.qty);
  if(m.type==='devolução')current.qty-=num(m.qty);
  if(m.date&&(`${m.date} ${m.time||''}`>=`${current.lastDate||''} ${current.lastTime||''}`)){current.lastDate=m.date;current.lastTime=m.time||''}
  map[person].set(item,current);
 });
 return Object.fromEntries(Object.entries(map).map(([person,items])=>[person,[...items.values()].filter(i=>i.qty>0).sort((a,b)=>a.item.localeCompare(b.item))]));
}

export default function PeopleTools(){
 const{movements}=useApp();
 const[selected,setSelected]=useState(null);
 const holdings=useMemo(()=>buildHoldings(movements),[movements]);
 const totalPeople=COLLABORATORS.filter(p=>holdings[p]?.length).length;
 const totalItems=COLLABORATORS.reduce((a,p)=>a+(holdings[p]||[]).reduce((s,i)=>s+num(i.qty),0),0);
 const recent=movements.filter(m=>COLLABORATORS.includes(m.reason)&&['saída','devolução'].includes(m.type)).slice(0,15);
 const recentCols=[{key:'date',label:'Data'},{key:'time',label:'Hora'},{key:'reason',label:'Colaborador'},{key:'type',label:'Tipo'},{key:'item',label:'Item'},{key:'qty',label:'Qtd.'}];

 if(selected){
  const items=holdings[selected]||[];
  const history=movements.filter(m=>m.reason===selected).slice(0,80);
  const historyCols=[{key:'date',label:'Data'},{key:'time',label:'Hora'},{key:'type',label:'Tipo'},{key:'item',label:'Item'},{key:'qty',label:'Qtd.'},{key:'user',label:'Registrado por'}];
  const count=items.reduce((a,i)=>a+num(i.qty),0);
  return <>
   <PageHeader title={selected} subtitle="Ferramentas e histórico deste colaborador" actions={<button className="btn-ghost" onClick={()=>setSelected(null)}><ArrowLeft size={18}/>Voltar aos colaboradores</button>}/>
   <div className="mb-5 grid gap-4 md:grid-cols-3">
    <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Itens atualmente com a pessoa</p><b className="text-3xl">{count}</b></div>
    <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Tipos de ferramentas</p><b className="text-3xl">{items.length}</b></div>
    <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Histórico registrado</p><b className="text-3xl">{history.length}</b></div>
   </div>

   <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
    <div className="card">
     <h3 className="mb-4 text-xl font-semibold">Ferramentas com {selected}</h3>
     {items.length?<div className="space-y-2">
      {items.map(i=><div className="grid gap-1 border border-brand-line p-4 dark:border-white/10" key={i.item}>
       <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{i.item}</span>
        <span className="badge bg-brand-red text-white">{i.qty}</span>
       </div>
       <p className="flex items-center gap-2 text-xs text-brand-steel dark:text-white/60"><Clock3 size={13}/>Última movimentação: {i.lastDate||'-'} {i.lastTime||''}</p>
      </div>)}
     </div>:<div className="grid place-items-center border border-dashed border-brand-line p-8 text-center text-sm text-brand-steel dark:border-white/10 dark:text-white/60">
      <PackageCheck className="mb-2" size={28}/>
      Nenhuma ferramenta está com este colaborador.
     </div>}
    </div>

    <div className="card">
     <h3 className="mb-4 text-xl font-semibold">Histórico de movimentações</h3>
     <DataTable rows={history} columns={historyCols}/>
    </div>
   </div>
  </>
 }

 return <>
  <PageHeader title="Colaboradores" subtitle="Clique em um colaborador para ver ferramentas e histórico"/>
  <div className="mb-5 grid gap-4 md:grid-cols-3">
   <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Pessoas com itens</p><b className="text-3xl">{totalPeople}</b></div>
   <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Itens fora do estoque</p><b className="text-3xl">{totalItems}</b></div>
   <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Controle</p><b className="text-xl">Por colaborador</b></div>
  </div>

  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
   {COLLABORATORS.map(person=>{
    const items=holdings[person]||[];
    const count=items.reduce((a,i)=>a+num(i.qty),0);
    const last=movements.find(m=>m.reason===person);
    return <button className="card text-left transition hover:-translate-y-0.5 hover:shadow-industrial" key={person} onClick={()=>setSelected(person)}>
     <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
       <div className="grid h-11 w-11 place-items-center border border-brand-line bg-brand-light dark:border-white/10 dark:bg-white/10"><UserRound size={20}/></div>
       <div>
        <h3 className="text-xl font-semibold">{person}</h3>
        <p className="text-sm text-brand-steel dark:text-white/60">Clique para abrir detalhes</p>
       </div>
      </div>
      <span className={`badge ${count?'bg-brand-yellow text-brand-black':'bg-brand-light text-brand-steel dark:bg-white/10 dark:text-white/60'}`}>{count?`${count} fora`:'ok'}</span>
     </div>
     <div className="grid grid-cols-2 gap-3">
      <div className="border border-brand-line p-3 dark:border-white/10">
       <p className="text-xs text-brand-steel dark:text-white/60">Ferramentas</p>
       <b className="text-2xl">{count}</b>
      </div>
      <div className="border border-brand-line p-3 dark:border-white/10">
       <p className="text-xs text-brand-steel dark:text-white/60">Tipos</p>
       <b className="text-2xl">{items.length}</b>
      </div>
     </div>
     <p className="mt-4 flex items-center gap-2 text-xs text-brand-steel dark:text-white/60"><History size={14}/>Última movimentação: {last?`${last.date||'-'} ${last.time||''}`:'sem histórico'}</p>
    </button>
   })}
  </div>

  <div className="card mt-5">
   <h3 className="mb-4 text-xl font-semibold">Últimas movimentações vinculadas a colaboradores</h3>
   <DataTable rows={recent} columns={recentCols}/>
  </div>
 </>
}
