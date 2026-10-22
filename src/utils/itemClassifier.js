import catalog from '../data/classificationRules.json';
import {findLearnedRule} from './learnedClassification';

export const normalizeItemText = (text = '') => String(text)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toUpperCase().replace(/[^A-Z0-9\s./-]/g, ' ')
  .replace(/\s+/g, ' ').trim();

const uniqueCode = (base, items = [], currentId = null) => {
  const cleanBase = (base || 'ITEM').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'ITEM';
  const used = new Set(items.filter(i => i.id !== currentId).map(i => String(i.code || '')));
  if (!used.has(cleanBase)) return cleanBase;
  let n = 2;
  while (used.has(`${cleanBase}-${String(n).padStart(2, '0')}`)) n++;
  return `${cleanBase}-${String(n).padStart(2, '0')}`;
};

// Token boundaries stop substrings such as "SOLDA" matching unrelated words.
const includesTerm = (name, term) => {
  const haystack = ` ${normalizeItemText(name).replace(/[./-]/g, ' ')} `;
  const needle = ` ${normalizeItemText(term).replace(/[./-]/g, ' ')} `;
  return haystack.includes(needle);
};

const buildBaseCode = (name, rule) => {
  const numbers = normalizeItemText(name).match(/\d+(?:[/.]\d+)?/g) || [];
  const dims = numbers.map(n => n.replace(/\D/g, '')).filter(n => n.length <= 6).slice(0, 3).join('-');
  const words = normalizeItemText(name).replace(/\d+(?:[/.]\d+)?/g, '').split(/\s+/).filter(Boolean).slice(0, 3).join('-');
  return [rule.prefix || 'ITEM', dims || words || 'ITEM'].join('-');
};

export function classifyItem(name = '', items = [], currentId = null) {
  const matched = catalog.rules
    .map(rule => ({...rule, matchedTerms: (rule.terms || []).filter(term => includesTerm(name, term))}))
    .filter(rule => rule.matchedTerms.length)
    .sort((a,b) => b.priority - a.priority || Math.max(...b.matchedTerms.map(x=>x.length))-Math.max(...a.matchedTerms.map(x=>x.length)));
  const learned = findLearnedRule(name);
  const rule = learned ? { ...learned, label: `Regra aprendida: ${learned.term}`, prefix: "ITEM", confidence: "alta", priority: 999 } : (matched[0] || catalog.fallback);
  const conflict = !learned && matched.length > 1 && matched[0].priority === matched[1].priority && matched[0].id !== matched[1].id;
  return {
    matchedRule: rule.label,
    category: rule.category, subcategory: rule.subcategory,
    application: rule.application, unit: rule.unit,
    code: uniqueCode(buildBaseCode(name,rule),items,currentId),
    confidence: conflict ? 'baixa' : (rule.confidence || 'baixa'),
    needsReview: !learned && (!!rule.review || !matched.length || conflict),
    ruleId: rule.id || 'fallback', learned: !!learned, catalogVersion: catalog.version
  };
}

export function applyItemClassification(item = {}, items = [], currentId = null) {
  const suggestion = classifyItem(item.name || '', items, currentId || item.id);
  return { ...item, code: suggestion.code, category: suggestion.category,
    subcategory: suggestion.subcategory, application: suggestion.application,
    unit: suggestion.unit, _smartSuggestion: suggestion };
}
