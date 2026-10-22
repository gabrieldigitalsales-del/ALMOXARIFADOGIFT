import {detectTechnicalFields} from './productTechnicalParser';

const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const compact=value=>normalize(value).replace(/\s+/g,'');
const generic=new Set(['DE','DA','DO','DAS','DOS','PARA','COM','EM','E','A','O','NOVO','NOVA','PROFISSIONAL','POLEGADAS','POLEGADA','POL','WATTS','UND','UN','UNI','UNID','UNIDADE','UNIDADES','PECAS','PECA','PC','PCS','KIT','PACOTE','EMBALAGEM','CONJUNTO','CARTELA','CAIXA','CONTEM','CONTENDO']);
const tokens=s=>normalize(s).split(' ').filter(Boolean);
// Quantidade de um anúncio não é dimensão nem referência do produto.
const cleanPack=s=>normalize(s)
 .replace(/\b(?:KIT|PACOTE|EMBALAGEM|CAIXA|CONJUNTO|CONTEM|CONTENDO)\s+(?:COM\s+|DE\s+)?\d+\s*(?:UND|UN|UNI|UNID|UNIDADE|UNIDADES|PECAS|PECA|PCS|PC)?\b/g,' ')
 .replace(/\b\d+\s*(?:UND|UN|UNI|UNID|UNIDADE|UNIDADES|PECAS|PECA|PCS|PC)\b/g,' ')
 .replace(/\(\s*\d+\s*\)\s*$/g,' ')
 .replace(/\b\d+\s*$/g,' ')
 .replace(/\s+/g,' ').trim();
const productTokens=s=>tokens(cleanPack(s)).filter(t=>!generic.has(t));
const familyOf=s=>{
 const n=normalize(s);
 if(/\b(?:PONTEIRA|SAPATA)\b/.test(n)&&/\b(?:BORRACHA|PLASTICO|PE)\b/.test(n))return 'PONTEIRA';
 if(/\bESMERILHADEIRA\b/.test(n))return 'ESMERILHADEIRA';
 if(/\bDISCO\b.*\bCORTE\b/.test(n))return 'DISCO CORTE';
 if(/\bCANTONEIRA\b/.test(n))return 'CANTONEIRA';
 if(/\bPENEIRA\b/.test(n))return 'PENEIRA';
 if(/\bLUVA\b/.test(n))return 'LUVA';
 return productTokens(s).find(t=>t.length>=4)||'';
};
const dimensionsOf=s=>{
 const n=normalize(s).replace(/\b(\d{1,4})\s*[X×]\s*(\d{1,4})(?:\s*[X×]\s*(\d{1,4}))?/g,(_,a,b,c)=>` ${a}X${b}${c?'X'+c:''} `);
 return [...n.matchAll(/\b\d{1,4}X\d{1,4}(?:X\d{1,4})?\b/g)].map(x=>x[0]).sort();
};
const voltageOf=item=>{const m=String([item.name,item.specifications].join(' ')).match(/\b(110|127|220|380)\s*V\b/i);return m?.[1]||''};
const brandOf=item=>compact(item.brand||detectTechnicalFields(item.name||'').brand);
const modelOf=item=>compact(item.model||detectTechnicalFields(item.name||'').model);
const sameFamily=(a,b)=>Boolean(a&&b&&a===b);
const compatible=(a,b)=>{
 const aVolt=voltageOf(a),bVolt=voltageOf(b);
 if(aVolt&&bVolt&&aVolt!==bVolt)return false;
 const da=dimensionsOf(a.name),db=dimensionsOf(b.name);
 if(da.length&&db.length&&da.join('|')!==db.join('|'))return false;
 const ba=brandOf(a),bb=brandOf(b);
 if(ba&&bb&&ba!==bb)return false;
 const ma=modelOf(a),mb=modelOf(b);
 if(ma&&mb&&ma!==mb)return false;
 return true;
};
export function findDuplicateItem(item,stock=[],currentId=null){
 const name=compact(item.name),family=familyOf(item.name);
 const ta=new Set(productTokens(item.name));
 for(const existing of stock){
  if(existing.id===currentId||existing.archived)continue;
  if(!compatible(item,existing))continue;
  if(name&&name===compact(existing.name))return {item:existing,reason:'Nome idêntico'};
  const eb=familyOf(existing.name);
  if(!sameFamily(family,eb))continue;
  const m=modelOf(item),em=modelOf(existing);
  if(m&&em&&m===em&&(!brandOf(item)||!brandOf(existing)||brandOf(item)===brandOf(existing)))return {item:existing,reason:'Mesmo modelo e família'};
  const tb=new Set(productTokens(existing.name));
  const all=new Set([...ta,...tb]);
  const common=[...ta].filter(t=>tb.has(t)).length;
  // Correspondência forte, com família e dimensões compatíveis.
  if(all.size>=4&&common/all.size>=0.78&&common>=4)return {item:existing,reason:'Descrição técnica equivalente (quantidade da embalagem ignorada)'};
 }
 return null;
}
