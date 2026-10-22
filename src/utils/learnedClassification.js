import { categories } from '../data/seed.js';

export const LEARNED_RULES_KEY = 'gift-sandbox-local-v1:gift.classification.learned.v1';
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
export const normalizeLearnedTerm = normalize;
export const readLearnedRules = () => {
  try { const rules=JSON.parse(localStorage.getItem(LEARNED_RULES_KEY)||'[]'); return Array.isArray(rules)?rules.filter(r=>r&&r.id&&r.term&&r.category):[]; } catch { return []; }
};
export const writeLearnedRules = rules => {
  localStorage.setItem(LEARNED_RULES_KEY,JSON.stringify(rules));
  window.dispatchEvent(new Event('gift:classification-updated'));
};
export const upsertLearnedRule = ({term,category,subcategory,unit='un',application='Estoque geral',mode='exact'}) => {
  const normalized=normalize(term);
  if(normalized.length<3) throw Error('Informe um nome ou termo com pelo menos três caracteres.');
  if(!categories[category]||!categories[category].includes(subcategory))throw Error('Categoria ou subcategoria inválida.');
  if(!['exact','term'].includes(mode))throw Error('Tipo de regra inválido.');
  const all=readLearnedRules();
  const prev=all.find(r=>normalize(r.term)===normalized&&r.mode===mode);
  const rule={id:prev?.id||crypto.randomUUID(),term:String(term).trim(),mode,category,subcategory,unit:String(unit||'un').trim(),application,createdAt:prev?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  writeLearnedRules(prev?all.map(r=>r.id===prev.id?rule:r):[...all,rule]);
  return rule;
};
export const deleteLearnedRule = id => writeLearnedRules(readLearnedRules().filter(r=>r.id!==id));
export const findLearnedRule = name => {
  const key=normalize(name); if(!key)return null;
  const rules=readLearnedRules();
  const exact=rules.find(r=>r.mode==='exact'&&normalize(r.term)===key);
  if(exact)return exact;
  // A keyword rule must match whole words to prevent accidental substring matches.
  const match=rules.filter(r=>r.mode==='term'&&(` ${key} `).includes(` ${normalize(r.term)} `));
  return match.sort((a,b)=>normalize(b.term).length-normalize(a.term).length)[0]||null;
};
