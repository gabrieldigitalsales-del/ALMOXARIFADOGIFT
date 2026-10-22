import {Edit, Trash2, Eye} from 'lucide-react';

/** The action buttons remain visible when wide tables scroll horizontally. */
export default function DataTable({columns, rows, onEdit, onDelete, onView, empty='Nenhum registro encontrado'}) {
 const actions = !!(onView || onEdit || onDelete);
 return <div className="w-full min-w-0 max-w-full border border-brand-line bg-white dark:border-white/10 dark:bg-brand-graphite">
  <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
   <table className="w-full min-w-max border-collapse">
    <thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}{actions&&<th className="sticky right-0 z-20 !min-w-[172px] !w-[172px] border-l border-white/20 !pl-4 !pr-8 text-center bg-brand-black shadow-[-7px_0_14px_-12px_rgba(0,0,0,0.5)]">Ações</th>}</tr></thead>
    <tbody>{rows.length?rows.map((r,i)=><tr key={r.id||i} className="group hover:bg-brand-turquoise/10 dark:hover:bg-white/5">{columns.map(c=><td key={c.key}>{c.render?c.render(r,i):r[c.key]}</td>)}{actions&&<td className="sticky right-0 z-10 !min-w-[172px] !w-[172px] !pl-4 !pr-8 border-l border-brand-line bg-white group-hover:bg-[#fff0f0] dark:border-white/10 dark:!bg-brand-graphite shadow-[-7px_0_14px_-12px_rgba(0,0,0,0.15)]"><div className="flex w-full items-center justify-end gap-2">{onView&&<button type="button" title="Visualizar" aria-label="Visualizar" onClick={()=>onView(r)} className="btn-ghost shrink-0 p-2"><Eye size={16}/></button>}{onEdit&&<button type="button" title="Editar" aria-label="Editar" onClick={()=>onEdit(r)} className="btn-ghost shrink-0 p-2"><Edit size={16}/></button>}{onDelete&&<button type="button" title="Excluir" aria-label="Excluir" onClick={()=>onDelete(r)} className="btn-ghost shrink-0 p-2 text-brand-red"><Trash2 size={16}/></button>}</div></td>}</tr>):<tr><td colSpan={columns.length+(actions?1:0)} className="py-10 text-center text-brand-steel">{empty}</td></tr>}</tbody>
   </table>
  </div>
 </div>
}
