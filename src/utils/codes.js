export function normalizeCodeText(text=''){
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9\s-]/g,' ').trim();
}
export function generateProductCode(name='',items=[],currentId=null){
  const clean=normalizeCodeText(name);
  const words=clean.split(/\s+/).filter(Boolean);
  const base=(words.length?words.slice(0,3).map(w=>w.length<=4?w:w.slice(0,4)).join('-'):'ITEM').slice(0,18);
  const same=items.filter(i=>i.id!==currentId&&String(i.code||'').startsWith(base));
  const used=new Set(same.map(i=>String(i.code||'')));
  let n=1,code='';
  do{code=`${base}-${String(n).padStart(3,'0')}`;n++;}while(used.has(code));
  return code;
}
