import{useMemo,useState}from'react';
import{ArrowLeft,Clock3,History,PackageCheck,RotateCcw,UserRound}from'lucide-react';
import PageHeader from'../components/PageHeader';
import DataTable from'../components/DataTable';
import{useApp}from'../context/AppContext';
import{num}from'../utils/costs';
import{COLLABORATORS}from'./Movements';

const movementStamp=m=>m.createdAt||`${m.date||''}T${m.time||'00:00:00'}`;
const sortMovements=rows=>[...rows].sort((a,b)=>movementStamp(b).localeCompare(movementStamp(a)));
const normalize=v=>(v||'').toString().trim().toLowerCase();
const cleanType=t=>normalize(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const isOut=t=>['saida','saída','retirada','retirar'].includes(cleanType(t));
const isReturn=t=>['devolucao','devolução','devolver','retorno'].includes(cleanType(t));
const collaboratorOf=m=>{
 const fields=[m?.collaborator,m?.responsible,m?.person,m?.worker,m?.reason];
 for(const raw of fields){
  const text=(raw||'').toString().trim();
  if(!text)continue;
  const found=COLLABORATORS.find(c=>normalize(text)===normalize(c)||normalize(text).startsWith(`${normalize(c)} •`)||normalize(text).startsWith(`${normalize(c)} -`)||normalize(text).startsWith(`${normalize(c)} /`));
  if(found)return found;
 }
 return '';
};
const itemKeyOf=m=>m.productId||m.itemId||`name:${normalize(m.item||'Item sem nome')}`;
const typeBadge=t=>{const cls=t==='entrada'?'bg-green-100 text-green-700':isOut(t)?'bg-brand-yellow text-brand-black':isReturn(t)?'bg-blue-100 text-blue-700':t==='perda'?'bg-brand-red text-white':t==='item removido'?'bg-black text-white':'bg-brand-light text-brand-steel dark:bg-white/10 dark:text-white/80';const label=isReturn(t)?'Voltou para o estoque':t==='item removido'?'Item removido':t;return <span className={`badge ${cls}`}>{label}</span>};
const daysWithPerson=date=>{if(!date)return 'Sem data';const start=new Date(`${date}T00:00:00`);const now=new Date();const diff=Math.max(0,Math.floor((new Date(now.toISOString().slice(0,10))-start)/86400000));if(diff===0)return 'Com a pessoa desde hoje';if(diff===1)return 'Com a pessoa há 1 dia';return `Com a pessoa há ${diff} dias`};

function buildHoldings(movements){
 const map=Object.fromEntries(COLLABORATORS.map(name=>[name,new Map()]));
 movements.forEach(m=>{
  const person=collaboratorOf(m);
  if(!person)return;
  const key=itemKeyOf(m);
  const item=m.item||'Item sem nome';
  const current=map[person].get(key)||{key,productId:m.productId||m.itemId||'',item,qty:0,lastDate:'',lastTime:''};
  if(!current.item&&item)current.item=item;
  if(!current.productId&&(m.productId||m.itemId))current.productId=m.productId||m.itemId;
  if(isOut(m.type))current.qty+=num(m.qty);
  if(isReturn(m.type))current.qty-=num(m.qty);
  if(m.date&&(`${m.date} ${m.time||''}`>=`${current.lastDate||''} ${current.lastTime||''}`)){current.lastDate=m.date;current.lastTime=m.time||''}
  map[person].set(key,current);
 });
 return Object.fromEntries(Object.entries(map).map(([person,items])=>[person,[...items.values()].filter(i=>num(i.qty)>0).sort((a,b)=>a.item.localeCompare(b.item))]));
}

export default function PeopleTools(){
 const{movements,stock,quickMove,notify}=useApp();
 const[selected,setSelected]=useState(null);
 const[returningKey,setReturningKey]=useState('');
 const holdings=useMemo(()=>buildHoldings(movements),[movements]);
 const totalPeople=COLLABORATORS.filter(p=>holdings[p]?.length).length;
 const totalItems=COLLABORATORS.reduce((a,p)=>a+(holdings[p]||[]).reduce((s,i)=>s+num(i.qty),0),0);
 const recent=sortMovements(movements.filter(m=>collaboratorOf(m)&&(isOut(m.type)||isReturn(m.type)))).slice(0,15);
 const recentCols=[{key:'date',label:'Data'},{key:'time',label:'Hora'},{key:'reason',label:'Colaborador',render:r=>collaboratorOf(r)||r.reason||'-'},{key:'type',label:'Tipo',render:r=>typeBadge(r.type)},{key:'item',label:'Item'},{key:'qty',label:'Qtd.'}];
 const findProduct=item=>{
  if(item?.productId){const byId=stock.find(s=>s.id===item.productId);if(byId)return byId;}
  return stock.find(s=>(s.name||'')===item?.item)||stock.find(s=>normalize(s.name)===normalize(item?.item));
 };
 const currentHolding=(person,key)=>(holdings[person]||[]).find(i=>i.key===key)||null;
 const doReturnDirect=item=>{
  if(returningKey)return;
  const atual=currentHolding(selected,item.key);
  const maxAtual=num(atual?.qty||0);
  if(maxAtual<=0)return notify?.('Este item já não consta mais com o colaborador','error');
  const raw=window.prompt(`Quantidade para devolver de ${item.item}\nMáximo: ${maxAtual}`,String(maxAtual));
  if(raw===null)return;
  const q=num(raw);
  if(q<=0)return notify?.('Quantidade inválida','error');
  if(q>maxAtual)return notify?.(`Quantidade maior que o saldo atual do colaborador. Máximo: ${maxAtual}`,'error');
  const product=findProduct(item);
  if(!product)return notify?.('Item não encontrado no estoque','error');
  if(!window.confirm(`Confirmar devolução de ${q} unidade(s) de ${item.item} para o estoque?`))return;
  setReturningKey(item.key);
  quickMove({productId:product.id,type:'devolução',qty:q,reason:selected,collaborator:selected});
  setTimeout(()=>setReturningKey(''),1200);
 };

 if(selected){
  const items=holdings[selected]||[];
  const history=sortMovements(movements.filter(m=>collaboratorOf(m)===selected)).slice(0,80);
  const historyCols=[{key:'date',label:'Data'},{key:'time',label:'Hora'},{key:'type',label:'Tipo',render:r=>typeBadge(r.type)},{key:'item',label:'Item'},{key:'qty',label:'Qtd.'},{key:'user',label:'Registrado por'}];
  const count=items.reduce((a,i)=>a+num(i.qty),0);
  return <>
   <PageHeader title={selected} subtitle="Itens e histórico deste colaborador" actions={<button className="btn-ghost" onClick={()=>setSelected(null)}><ArrowLeft size={18}/>Voltar aos colaboradores</button>}/>
   <div className="mb-5 grid gap-4 md:grid-cols-3">
    <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Itens atualmente com a pessoa</p><b className="text-3xl">{count}</b></div>
    <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Tipos de itens</p><b className="text-3xl">{items.length}</b></div>
    <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Histórico registrado</p><b className="text-3xl">{history.length}</b></div>
   </div>

   <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
    <div className="card">
     <h3 className="mb-4 text-xl font-semibold">Itens com {selected}</h3>
     {items.length?<div className="space-y-2">
      {items.map(i=><div className="grid gap-3 border border-brand-line p-4 dark:border-white/10" key={i.key}>
       <div className="flex items-start justify-between gap-3">
        <div>
         <span className="font-semibold">{i.item}</span>
         <p className="mt-1 flex items-center gap-2 text-xs text-brand-steel dark:text-white/60"><Clock3 size={13}/>Última movimentação: {i.lastDate||'-'} {i.lastTime||''}</p>
        </div>
        <span className="badge bg-brand-red text-white">{i.qty}</span>
       </div>
       <p className="text-xs font-semibold text-brand-turquoise">{daysWithPerson(i.lastDate)}</p>
       <button className="btn-ghost w-full justify-center" disabled={!!returningKey} onClick={()=>doReturnDirect(i)}><RotateCcw size={16}/>{returningKey===i.key?'Devolvendo...':'Devolver'}</button>
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
  <PageHeader title="Colaboradores" subtitle="Clique em um colaborador para ver itens e histórico"/>
  <div className="mb-5 grid gap-4 md:grid-cols-3">
   <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Pessoas com itens</p><b className="text-3xl">{totalPeople}</b></div>
   <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Itens fora do estoque</p><b className="text-3xl">{totalItems}</b></div>
   <div className="card"><p className="text-sm text-brand-steel dark:text-white/60">Controle</p><b className="text-xl">Por colaborador</b></div>
  </div>

  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
   {COLLABORATORS.map(person=>{
    const items=holdings[person]||[];
    const count=items.reduce((a,i)=>a+num(i.qty),0);
    const last=movements.find(m=>collaboratorOf(m)===person);
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
       <p className="text-xs text-brand-steel dark:text-white/60">Itens</p>
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
