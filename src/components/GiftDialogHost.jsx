import React,{useEffect,useRef,useState} from 'react';
import {AlertTriangle} from 'lucide-react';

export default function GiftDialogHost(){
 const [job,setJob]=useState(null),[value,setValue]=useState('');
 const pending=useRef([]),active=useRef(null),input=useRef(null);
 useEffect(()=>{function onDialog(e){pending.current.push(e.detail);if(!active.current){const next=pending.current.shift();active.current=next;setValue(next.defaultValue||'');setJob(next)}}window.addEventListener('gift:dialog',onDialog);return()=>window.removeEventListener('gift:dialog',onDialog)},[]);
 useEffect(()=>{if(job&&(job.type==='input'||job.type==='phrase-confirm'))input.current?.focus()},[job]);
 function openNext(){if(pending.current.length){const next=pending.current.shift();active.current=next;setValue(next.defaultValue||'');setJob(next)}}
 function finish(result){const current=active.current;active.current=null;setJob(null);current?.resolve(result);openNext()}
 useEffect(()=>{if(!job)return;const esc=e=>{if(e.key==='Escape'){e.preventDefault();finish(job.type==='input'?null:false)}};window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc)},[job]);
 if(!job)return null;
 const destructive=/excluir|apagar|remover|cancelar|restaurar|substituir|zerar/i.test(job.message);
 const phrase=job?.meta?.phrase||'';
 const confirmLabel=job?.meta?.confirmLabel||'Confirmar';
 const cancelLabel=job?.meta?.cancelLabel||(job.type==='info'?'Fechar':'Cancelar');
 const title=job.type==='input'?'Informar quantidade / dados':job.type==='info'?'GIFT Excellence':job.type==='phrase-confirm'?'Confirmar exclusão':'Confirmar operação';
 const expectedQuoted=`"${phrase}"`;
 const phraseOk=job.type!=='phrase-confirm'||value.trim()===phrase||value.trim()===expectedQuoted;
 const copyPhrase=async()=>{try{await navigator.clipboard.writeText(phrase); }catch(e){console.error('clipboard',e)}};
 return <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4" role="presentation">
   <div role="dialog" aria-modal="true" aria-label="Confirmação GIFT" className="w-full max-w-lg border border-zinc-300 bg-white p-6 text-zinc-900 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
     <div className="mb-4 flex items-start gap-3">
       <div className={'grid h-11 w-11 shrink-0 place-items-center '+(destructive?'bg-red-50 text-red-700':'bg-zinc-100 text-zinc-800')}><AlertTriangle size={22}/></div>
       <div className="min-w-0 flex-1">
         <h3 className="text-lg font-bold">{title}</h3>
         <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">{job.message}</p>
       </div>
     </div>

     {job.type==='phrase-confirm'&&<div className="mb-4 rounded-md border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
       <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Digite exatamente o texto abaixo</div>
       <div className="mt-2 flex items-center gap-2">
         <div className="min-w-0 flex-1 select-all rounded border border-dashed border-red-300 bg-white px-3 py-2 text-sm dark:bg-zinc-900">
           <strong>&quot;{phrase}&quot;</strong>
         </div>
         <button type="button" className="shrink-0 border border-zinc-300 px-3 py-2 text-xs font-semibold" onClick={copyPhrase}>Copiar</button>
       </div>
       <div className="mt-2 text-xs text-zinc-500">Você pode copiar acima e colar abaixo.</div>
     </div>}

     {(job.type==='input'||job.type==='phrase-confirm')&&<input ref={input} value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();finish(job.type==='input'?value:(phraseOk?true:false))}}} className="mb-4 w-full border border-zinc-400 bg-white p-3 text-sm text-zinc-900 outline-none focus:border-red-600 dark:bg-zinc-800 dark:text-white" placeholder={job.type==='phrase-confirm'?'Cole ou digite a confirmação exata aqui':''}/>}

     <div className="flex justify-end gap-2">
       <button className="border border-zinc-300 px-4 py-2 text-sm" onClick={()=>finish(job.type==='input'?null:false)}>{cancelLabel}</button>
       {job.type!=='info'&&<button className="bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={job.type==='phrase-confirm'&&!phraseOk} onClick={()=>finish(job.type==='input'?value:(job.type==='phrase-confirm'?true:true))}>{confirmLabel}</button>}
     </div>
   </div>
 </div>
}
