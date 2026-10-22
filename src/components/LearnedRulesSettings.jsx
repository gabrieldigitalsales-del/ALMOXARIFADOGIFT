import {useEffect,useState} from 'react';
import {categories} from '../data/seed';
import {readLearnedRules,upsertLearnedRule,deleteLearnedRule} from '../utils/learnedClassification';

export default function LearnedRulesSettings({notify}){
 const [rules,setRules]=useState(readLearnedRules);
 const [term,setTerm]=useState(''); const [mode,setMode]=useState('exact');
 const [category,setCategory]=useState('Matéria-prima');const [subcategory,setSubcategory]=useState('Chapas');
 const [unit,setUnit]=useState('un');const [application,setApplication]=useState('Produção de máquinas');
 useEffect(()=>{const reload=()=>setRules(readLearnedRules());window.addEventListener('gift:classification-updated',reload);return()=>window.removeEventListener('gift:classification-updated',reload)},[]);
 const save=()=>{try{upsertLearnedRule({term,mode,category,subcategory,unit,application});setRules(readLearnedRules());setTerm('');notify('Regra salva no dicionário local')}catch(e){notify(e.message,'error')}};
 return <section className="card mb-6 border-l-4 border-l-red-600"><h2 className="text-xl font-bold">Dicionário Inteligente — Regras aprendidas</h2><p className="mb-4 text-sm text-brand-steel">As 58 regras industriais do sistema permanecem intactas. Correções aprovadas aqui têm prioridade sobre as regras padrão.</p>
 <div className="grid gap-3 md:grid-cols-3">
  <label className="text-sm">Nome ou termo<input className="input mt-1" value={term} onChange={e=>setTerm(e.target.value)} placeholder="Ex.: CANTONEIRA GALVANIZADA"/></label>
  <label className="text-sm">Aplicação da regra<select className="input mt-1" value={mode} onChange={e=>setMode(e.target.value)}><option value="exact">Somente nome idêntico (seguro)</option><option value="term">Nome contendo este termo</option></select></label>
  <label className="text-sm">Categoria<select className="input mt-1" value={category} onChange={e=>{setCategory(e.target.value);setSubcategory(categories[e.target.value][0])}}>{Object.keys(categories).map(c=><option key={c}>{c}</option>)}</select></label>
  <label className="text-sm">Subcategoria<select className="input mt-1" value={subcategory} onChange={e=>setSubcategory(e.target.value)}>{(categories[category]||[]).map(c=><option key={c}>{c}</option>)}</select></label>
  <label className="text-sm">Unidade<input className="input mt-1" value={unit} onChange={e=>setUnit(e.target.value)}/></label>
  <label className="text-sm">Uso<input className="input mt-1" value={application} onChange={e=>setApplication(e.target.value)}/></label>
 </div>
 <button className="btn-primary mt-4" onClick={save}>Salvar regra no dicionário</button>
 <div className="mt-5 space-y-2">{rules.length===0?<p className="text-sm text-brand-steel">Nenhuma regra aprendida. O catálogo padrão continua ativo.</p>:rules.map(r=><div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border border-brand-line p-3 text-sm"><span><b>{r.term}</b> • {r.category} / {r.subcategory} • {r.mode==='exact'?'Nome exato':'Contém termo'}</span><button className="btn-ghost" onClick={()=>{deleteLearnedRule(r.id);setRules(readLearnedRules());notify('Regra aprendida removida')}}>Remover regra</button></div>)}</div>
 </section>
}
