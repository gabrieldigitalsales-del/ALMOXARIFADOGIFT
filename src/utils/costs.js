export const currency=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const num=v=>Number(v||0);
export const today=()=>new Date().toISOString().slice(0,10);
export const availableOf=i=>Math.max(0,num(i.qty)-num(i.reserved));
export const statusOf=i=> num(i.qty)<=0?'Em falta':num(i.qty)<=num(i.min)?'Estoque baixo':'OK';
export const calcBomLine=(line,stock)=>{const p=stock.find(x=>x.id===line.productId);const cost=num(line.unitCost??p?.avgCost??p?.unitCost);return{...line,product:p,unitCost:cost,total:cost*num(line.qty)}};
export const calcMachineCost=(machine,bom,stock)=>{const lines=bom.filter(x=>x.machineId===machine.id).map(l=>calcBomLine(l,stock));const bySector=lines.reduce((a,l)=>{a[l.sector]=(a[l.sector]||0)+l.total;return a},{});const materials=lines.reduce((a,l)=>a+l.total,0);const labor=num(machine.labor);const indirect=num(machine.indirect);const production=materials+labor;const total=production+indirect;const price=total*(1+num(machine.profit)/100);return{lines,bySector,materials,labor,indirect,production,total,price,profitValue:price-total,margin:price?((price-total)/price)*100:0}};
export const calcABC=stock=>{const total=stock.reduce((a,i)=>a+num(i.qty)*num(i.avgCost||i.unitCost),0)||1;let acc=0;return[...stock].sort((a,b)=>num(b.qty)*num(b.avgCost||b.unitCost)-num(a.qty)*num(a.avgCost||a.unitCost)).map(i=>{const v=num(i.qty)*num(i.avgCost||i.unitCost);acc+=v;return{...i,value:v,percent:v/total*100,acc:acc/total*100,abc:acc/total<=.8?'A':acc/total<=.95?'B':'C'}})};
