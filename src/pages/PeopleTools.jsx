import{useMemo}from'react';
import{UserRound,PackageCheck,Clock3}from'lucide-react';
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
 const holdings=useMemo(()=>buildHoldings(movements),[movements]);
 const totalPeople=COLLABORATORS.filter(p=>holdings[p]?.length).length;
 const totalItems=COLLABORATORS.reduce((a,p)=>a+(holdings[p]||[]).reduce((s,i)=>s+num(i.qty),0),0);
 const recent=movements.filter(m=>COLLABORATORS.includes(m.reason)&&['saída','devolução'].includes(m.type)).slice(0,15);
 const recentCols=[{key:'date',label:'Data'},{key:'time',label:'Hora'},{key:'reason',label:'Colaborador'},{key:'type',label:'Tipo'},{key:'item',label:'Item'},{key:'qty',label:'Qtd.'}];

 return <>
  <PageHeader title="Colaboradores" subtitle="Ferramentas e materiais que estão com cada pessoa"/>
  <div className="mb-5 grid gap-4 md:grid-cols-3">
   <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Pessoas com itens</p><b className="text-3xl">{totalPeople}</b></div>
   <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Itens fora do estoque</p><b className="text-3xl">{totalItems}</b></div>
   <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Controle</p><b className="text-xl">Por movimentação</b></div>
  </div>

  <div className="grid gap-5 xl:grid-cols-3">
   {COLLABORATORS.map(person=>{
    const items=holdings[person]||[];
    const count=items.reduce((a,i)=>a+num(i.qty),0);
    return <div className="card" key={person}>
     <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
       <div className="grid h-11 w-11 place-items-center border border-brand-line bg-brand-light dark:border-white/10 dark:bg-white/10"><UserRound size={20}/></div>
       <div>
        <h3 className="text-xl font-semibold">{person}</h3>
        <p className="text-sm text-brand-steel dark:text-white/60">{count} item(ns) com a pessoa</p>
       </div>
      </div>
      <span className={`badge ${count?'bg-brand-yellow text-brand-black':'bg-brand-light text-brand-steel dark:bg-white/10 dark:text-white/60'}`}>{count?`${count} fora`:'ok'}</span>
     </div>
     {items.length?<div className="space-y-2">
      {items.map(i=><div className="grid gap-1 border border-brand-line p-3 dark:border-white/10" key={i.item}>
       <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{i.item}</span>
        <span className="badge bg-brand-red text-white">{i.qty}</span>
       </div>
       <p className="flex items-center gap-2 text-xs text-brand-steel dark:text-white/60"><Clock3 size={13}/>Última movimentação: {i.lastDate||'-'} {i.lastTime||''}</p>
      </div>)}
     </div>:<div className="grid place-items-center border border-dashed border-brand-line p-6 text-center text-sm text-brand-steel dark:border-white/10 dark:text-white/60">
      <PackageCheck className="mb-2" size={26}/>
      Nenhuma ferramenta com este colaborador.
     </div>}
    </div>
   })}
  </div>

  <div className="card mt-5">
   <h3 className="mb-4 text-xl font-semibold">Últimas movimentações vinculadas a colaboradores</h3>
   <DataTable rows={recent} columns={recentCols}/>
  </div>
 </>
}
