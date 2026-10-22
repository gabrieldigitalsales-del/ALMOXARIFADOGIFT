import{useMemo}from'react';
import{AlertTriangle,Boxes,CircleDollarSign,Factory}from'lucide-react';
import{Bar,BarChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis}from'recharts';
import KpiCard from'../components/KpiCard';
import DataTable from'../components/DataTable';
import PageHeader from'../components/PageHeader';
import{useApp}from'../context/AppContext';
import{currency}from'../utils/costs';

export default function Dashboard(){
 const{totals,machineCosts,movements,ops,stock}=useApp();
 const hasMachineData=machineCosts.length>0;
 const data=useMemo(()=>{
   if(hasMachineData)return machineCosts.map(m=>({name:m.machine.name,custo:Number(m.total)||0}));
   const counts={};
   (stock||[]).forEach(item=>{const cat=item.category||'Sem categoria';counts[cat]=(counts[cat]||0)+1});
   return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,quantidade])=>({name,quantidade}));
 },[hasMachineData,machineCosts,stock]);
 const metric=hasMachineData?'custo':'quantidade';
 return <>
  <PageHeader title="Dashboard" subtitle="Resumo principal do almoxarifado"/>
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
   <KpiCard icon={Boxes} label="Estoque" value={totals.items} detail="Itens cadastrados"/>
   <KpiCard icon={CircleDollarSign} label="Valor total" value={currency(totals.value)} detail="Custo médio" tone="yellow"/>
   <KpiCard icon={AlertTriangle} label="Alertas" value={totals.low.length} detail="Baixo ou em falta" tone="red"/>
   <KpiCard icon={Factory} label="Máquinas" value={machineCosts.length} detail="Cadastradas"/>
  </div>
  <div className="mt-6 grid gap-6 xl:grid-cols-2">
   <div className="card min-w-0">
    <h3 className="mb-1 text-lg font-semibold">{hasMachineData?'Custo por máquina':'Itens por categoria'}</h3>
    <p className="mb-4 text-xs text-brand-steel">{hasMachineData?'Custos calculados pelas estruturas das máquinas':'Enquanto não houver máquinas cadastradas, mostramos a distribuição real dos itens do estoque.'}</p>
    {data.length ? <div className="h-[280px] w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{top:10,right:20,left:0,bottom:35}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:10}} angle={-25} textAnchor="end" interval={0} height={75}/><YAxis allowDecimals={!hasMachineData?false:true}/><Tooltip formatter={v=>hasMachineData?currency(v):`${v} itens`}/><Bar dataKey={metric} fill="#db202a" maxBarSize={55}/></BarChart></ResponsiveContainer></div>:
    <div className="flex min-h-[280px] items-center justify-center border border-dashed border-brand-line p-4 text-center text-sm text-brand-steel">O gráfico será exibido assim que houver itens ou máquinas cadastradas.</div>}
   </div>
   <div>
    <h3 className="mb-3 text-lg font-semibold">Últimas movimentações</h3>
    <DataTable rows={movements.slice(0,6)} columns={[{key:'date',label:'Data'},{key:'type',label:'Tipo'},{key:'item',label:'Item'},{key:'qty',label:'Qtd'}]}/>
    <h3 className="mb-3 mt-6 text-lg font-semibold">OPs recentes</h3>
    <DataTable rows={ops.slice(0,4)} columns={[{key:'number',label:'OP'},{key:'status',label:'Status'},{key:'progress',label:'%'}]}/>
   </div>
  </div>
 </>
}
