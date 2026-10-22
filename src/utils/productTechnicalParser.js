/** Extrai apenas informações que aparecem explicitamente no título. Nunca inventa especificações. */
const BRANDS = ['Black+Decker','Black & Decker','Makita','Bosch','DeWalt','Starrett','Tramontina','Vonder','Stanley','Milwaukee','Einhell','Norton','Wurth','Gedore','Dremel','Skil','Metabo','Elastobor','Schulz','Wap','Volk','Weld Smart','3M','SKF','NSK','Fischer','Tekbond','Beltools','Irwin','MTX'];
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const hasTerm = (raw, term) => new RegExp(`(^|[^A-Z0-9])${escapeRegExp(normalize(term))}(?=$|[^A-Z0-9])`).test(normalize(raw));
const notModel = value => /^(?:\d+(?:W|V|MM|CM|POL|RPM|HZ|KG|ML|L)|M\d{1,2}|PPV|INOX|A\d+)$/i.test(value);

export function detectTechnicalFields(title='') {
 const raw=clean(title), brand=BRANDS.find(b=>hasTerm(raw,b))||'';
 const isEpi=/\b(?:LUVA|CAPACETE|BOTINA|PROTETOR|RESPIRADOR|OCULOS|ÓCULOS)\b/i.test(raw);
 const tokens=raw.match(/\b[A-Z]{1,8}[-]?[A-Z]*\d{2,}[A-Z0-9-]*\b/gi)||[];
 const models=tokens.filter(x=>!notModel(x));
 const model=models.at(-1)||'';
 const specs=[];
 const add=(label,pattern)=>{const found=raw.match(pattern);if(found)specs.push(`${label}: ${clean(found[0])}`)};
 add('Medida', /\b\d+\s+\d\s*\/\s*\d\s*(?:polegadas?|pol|\")\b/i);
 add('Diâmetro', /\b\d{2,4}\s*mm\b/i);
 add('Potência', /\b\d{2,5}\s*W\b/i);
 add('Tensão', /\b(?:110|127|220|380)\s*V\b/i);
 if(isEpi)add('CA', /\bCA\s*\d{4,6}\b/i);
 add('Dimensão', /\b\d{2,4}\s*[x×]\s*\d{2,4}(?:\s*[x×]\s*\d{1,4})?\b/i);
 return {brand,model,specifications:specs.join(' • '),requiresReview:!brand&&!model&&!specs.length};
}
