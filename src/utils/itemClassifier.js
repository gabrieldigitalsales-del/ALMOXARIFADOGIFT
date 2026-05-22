const removeAccents = (text = '') =>
  String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalize = (text = '') =>
  removeAccents(text).toUpperCase().replace(/[^A-Z0-9#\/\.\s-]/g, ' ').replace(/\s+/g, ' ').trim();

const onlyDigits = (text = '') => String(text).replace(/\D/g, '');

const codePart = (text = '') => normalize(text).replace(/#/g, '').replace(/\//g, '').replace(/\./g, '').split(/\s+/).filter(Boolean).slice(0, 4).join('-');

const uniqueCode = (base, items = [], currentId = null) => {
  const cleanBase = (base || 'ITEM').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'ITEM';
  const used = new Set((items || []).filter(i => i.id !== currentId).map(i => String(i.code || '')));
  if (!used.has(cleanBase)) return cleanBase;
  let n = 2;
  let code = '';
  do {
    code = `${cleanBase}-${String(n).padStart(2, '0')}`;
    n += 1;
  } while (used.has(code));
  return code;
};

const rules = [
  {
    label: 'Metalon / perfil metálico', prefix: 'MET', category: 'Matéria-prima', subcategory: 'Perfis', application: 'Produção de máquinas', unit: 'barra',
    words: ['METALON', 'TUBO METALON', 'PERFIL METALICO', 'PERFIL']
  },
  {
    label: 'Chapa metálica', prefix: 'CHA', category: 'Matéria-prima', subcategory: 'Chapas', application: 'Produção de máquinas', unit: 'chapa',
    words: ['CHAPA', 'LAMINA', 'AÇO', 'ACO']
  },
  {
    label: 'Barra / cantoneira', prefix: 'BAR', category: 'Matéria-prima', subcategory: 'Cantoneiras', application: 'Produção de máquinas', unit: 'barra',
    words: ['BARRA CHATA', 'CANTONEIRA', 'BARRA REDONDA', 'FERRO CHATO']
  },
  {
    label: 'Fixador', prefix: 'FIX', category: 'Fixadores', subcategory: 'Parafusos', application: 'Produção de máquinas', unit: 'un',
    words: ['PARAFUSO', 'PORCA', 'ARRUELA', 'CHUMBADOR', 'REBITE', 'PINO', 'GRAMPO']
  },
  {
    label: 'Rolamento / transmissão', prefix: 'ROL', category: 'Transmissão Mecânica', subcategory: 'Rolamentos', application: 'Produção de máquinas', unit: 'un',
    words: ['ROLAMENTO', 'MANCAL', 'BUCHA', 'POLIA', 'CORRENTE', 'REDUTOR', 'ACOPLAMENTO']
  },
  {
    label: 'Correia / esteira', prefix: 'COR', category: 'Esteiras', subcategory: 'Correias transportadoras', application: 'Produção de máquinas', unit: 'm',
    words: ['CORREIA TRANSPORTADORA', 'CORREIA', 'ESTEIRA', 'ROLETE', 'TAMBOR']
  },
  {
    label: 'Elétrica', prefix: 'ELE', category: 'Elétrica', subcategory: 'Motores', application: 'Produção de máquinas', unit: 'un',
    words: ['MOTOR', 'MOTOVIBRADOR', 'CABO', 'SENSOR', 'CONTATOR', 'DISJUNTOR', 'INVERSOR', 'BOTAO', 'BOTOEIRA', 'PAINEL']
  },
  {
    label: 'Pintura', prefix: 'PIN', category: 'Pintura', subcategory: 'Tintas', application: 'Consumível', unit: 'l',
    words: ['TINTA', 'PRIMER', 'THINNER', 'SOLVENTE', 'ESMALTE', 'CATALISADOR', 'VERNIZ']
  },
  {
    label: 'Soldagem', prefix: 'SOL', category: 'Soldagem', subcategory: 'Consumíveis de solda', application: 'Consumível', unit: 'un',
    words: ['ELETRODO', 'ARAME MIG', 'ARAME', 'SOLDA', 'GAS', 'DISCO DE CORTE', 'DISCO DESBASTE']
  },
  {
    label: 'Consumível', prefix: 'CON', category: 'Consumíveis', subcategory: 'Lixas', application: 'Consumível', unit: 'un',
    words: ['LIXA', 'BROCA', 'ESTOPA', 'PANO', 'FITA', 'COLA', 'SILICONE']
  },
  {
    label: 'Ferramenta', prefix: 'FER', category: 'Ferramentas', subcategory: 'Manuais', application: 'Ferramenta', unit: 'un',
    words: ['CHAVE', 'ALICATE', 'MARTELO', 'FURADEIRA', 'ESMERILHADEIRA', 'TRENA', 'PAQUIMETRO']
  },
  {
    label: 'EPI', prefix: 'EPI', category: 'EPIs', subcategory: 'Luvas', application: 'EPI', unit: 'un',
    words: ['LUVA', 'OCULOS', 'ÓCULOS', 'BOTINA', 'CAPACETE', 'PROTETOR', 'MASCARA', 'MÁSCARA', 'AVENTAL']
  },
  {
    label: 'Manutenção', prefix: 'MAN', category: 'Manutenção', subcategory: 'Lubrificantes', application: 'Manutenção', unit: 'un',
    words: ['OLEO', 'ÓLEO', 'GRAXA', 'LUBRIFICANTE', 'RETENTOR', 'VEDACAO', 'VEDAÇÃO']
  }
];

const findRule = (name = '') => {
  const n = normalize(name);
  return rules.find(rule => rule.words.some(word => n.includes(normalize(word)))) || null;
};

const buildBaseCode = (name, rule) => {
  const n = normalize(name);
  if (!n) return 'ITEM';
  const numbers = n.match(/\d+(?:[\/.]\d+)?/g) || [];
  const dims = numbers.slice(0, 3).map(v => v.replace(/\D/g, '')).filter(Boolean).join('-');
  const material = codePart(n.replace(/\d+(?:[\/.]\d+)?/g, ''));
  const prefix = rule?.prefix || (material ? material.slice(0, 3) : 'ITEM');
  return [prefix, dims || material || 'ITEM'].filter(Boolean).join('-');
};

export function classifyItem(name = '', items = [], currentId = null) {
  const rule = findRule(name);
  const fallback = { label: 'Diversos', prefix: 'ITEM', category: 'Consumíveis', subcategory: 'Estopas', application: 'Estoque geral', unit: 'un' };
  const selected = rule || fallback;
  const base = buildBaseCode(name, selected);
  return {
    matchedRule: selected.label,
    category: selected.category,
    subcategory: selected.subcategory,
    application: selected.application,
    unit: selected.unit,
    code: uniqueCode(base, items, currentId),
    confidence: rule ? 'alta' : 'baixa'
  };
}

export function applyItemClassification(item = {}, items = [], currentId = null) {
  const suggestion = classifyItem(item.name || '', items, currentId || item.id);
  return {
    ...item,
    code: suggestion.code,
    category: suggestion.category,
    subcategory: suggestion.subcategory,
    application: suggestion.application,
    unit: suggestion.unit,
    _smartSuggestion: suggestion
  };
}
