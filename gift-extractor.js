import express from 'express';
import * as cheerio from 'cheerio';
import dns from 'node:dns/promises';
import net from 'node:net';
const app=express(); app.disable('x-powered-by'); app.use(express.json({limit:'30kb'}));
const badV4 = ip => {const b=ip.split('.').map(Number); return b[0]===0||b[0]===10||b[0]===127||b[0]>=224||(b[0]===169&&b[1]===254)||(b[0]===172&&b[1]>=16&&b[1]<=31)||(b[0]===192&&b[1]===168)||(b[0]===100&&b[1]>=64&&b[1]<=127)||(b[0]===192&&b[1]===0)||(b[0]===198&&(b[1]===18||b[1]===19));};
const publicHost=async host=>{if(!host||host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')) return false; const records=await dns.lookup(host,{all:true});return records.length>0&&records.every(x=>x.family===4?!badV4(x.address):!(x.address==='::1'||x.address==='::'||x.address.toLowerCase().startsWith('fc')||x.address.toLowerCase().startsWith('fd')||x.address.toLowerCase().startsWith('fe80')||x.address.toLowerCase().startsWith('::ffff:')));};
function isAccessChallenge(value){
 const s=String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
 return /confirme seu acesso|confirm(e|acao) (o )?acesso|para prosseguir|verificando seu navegador|verifique que voce e humano|checking your browser|access denied|acesso negado|just a moment|attention required|captcha|cloudflare|perimeterx|perfdrive|validat(e|ion)|security check|anti.?bot|robot check|nao sou um robo/.test(s);
}
function isStoreOnlyTitle(value,supplier){const s=String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();const brand=String(supplier||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();return !s||s===brand||isAccessChallenge(s)||['mercado libre','mercado livre','mercadolibre','mercadolivre','pagina inicial','home'].includes(s)}
// Restore fractional inch sizes encoded without the slash in commerce URL slugs.
// Only apply when a unit follows; never rewrite product IDs such as M9510B.
function restoreInchFractions(name){
 return String(name||'').replace(/\b(4|7|9)[\s-]+(12|14)[\s-]+(pol(?:egadas?)?|\")\b/gi,(all,whole,frac,unit)=>`${whole} ${frac[0]}/${frac[1]} ${unit}`)
 .replace(/\b(4|7|9)[\s-]+(12|14)[\s-]+(polegadas|pol)\b/gi,(all,whole,frac,unit)=>`${whole} ${frac[0]}/${frac[1]} ${unit}`);
}
function urlProductHint(raw){try{
 const u=new URL(raw);
 const parts=u.pathname.split('/').filter(Boolean).map(x=>decodeURIComponent(x)).filter(Boolean);
 const ignored=/^(up|p|item|itens|produto|produtos|product|products|dp|catalogo|categoria|loja|shop|oferta|anuncio|anuncios|mlb[ua]?\d+|\d+)$/i;
 const candidates=parts.filter(p=>!ignored.test(p)&&/[a-zA-Z]/.test(p)&&p.length>=8);
 const segment=candidates.sort((a,b)=>b.length-a.length)[0]||'';
 if(!segment)return '';
 const words=segment.replace(/[-_]+/g,' ').replace(/\s+/g,' ').replace(/\b(5060hz)\b/ig,'50/60Hz').replace(/\b(nxc\d+)\b/ig,m=>m.toUpperCase()).replace(/\b(\d+)v\b/ig,(_,n)=>n+'V').replace(/\bchint\b/ig,'CHINT').trim();
 return words.length>=8?restoreInchFractions(words.charAt(0).toUpperCase()+words.slice(1)):''
}catch{return ''}}
function vendorFrom(host){const h=String(host||'').toLowerCase();if(h.includes('mercadolivre')||h.includes('mercadolibre'))return 'Mercado Livre';if(h.includes('amazon.'))return 'Amazon';if(h.includes('shopee.'))return 'Shopee';if(h.includes('magazineluiza')||h.includes('magalu.'))return 'Magazine Luiza';if(h.includes('lojadomecanico.com.br'))return 'Loja do Mecânico';return h.replace(/^www\./,'');}
function unverifiedFallback(raw,reason){const u=new URL(raw);return {name:urlProductHint(raw),nameVerified:false,price:null,image:'',vendor:vendorFrom(u.hostname),url:raw,source:'Sugestão pelo endereço original (não verificada)',warning:`${reason} O nome é apenas uma sugestão do endereço e o preço NÃO foi confirmado. Confira no site antes de cadastrar.`};}
function findJsonOffers(node){if(!node||typeof node!=='object')return null;if(Array.isArray(node)){for(const item of node){const f=findJsonOffers(item);if(f)return f;}return null;}const type=String(node['@type']||'').toLowerCase();if(type.includes('product')){const offers=Array.isArray(node.offers)?node.offers[0]:node.offers;return {name:node.name,price:offers?.price??offers?.lowPrice,image:typeof node.image==='string'?node.image:Array.isArray(node.image)?node.image[0]:undefined,currency:offers?.priceCurrency};}for(const val of Object.values(node)){const f=findJsonOffers(val);if(f)return f;}return null;}
async function fetchSafe(raw){let current=new URL(raw);for(let i=0;i<4;i++){if(!['http:','https:'].includes(current.protocol)||current.username||current.password||net.isIP(current.hostname)||!await publicHost(current.hostname))throw Error('Endereço não permitido.');let response=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'User-Agent':'Mozilla/5.0 (compatible; GIFTCompras/1.0; metadata)',Accept:'text/html'}});if([301,302,303,307,308].includes(response.status)){const dest=response.headers.get('location');if(!dest)throw Error('Redirecionamento inválido.');current=new URL(dest,current);continue;}if(!response.ok)throw Error(`O site não permitiu a consulta (HTTP ${response.status}).`);if(!(response.headers.get('content-type')||'').includes('text/html'))throw Error('O link não aponta para uma página HTML.');const length=Number(response.headers.get('content-length')||0);if(length>2_000_000)throw Error('Página muito grande.');const text=await response.text();if(text.length>2_000_000)throw Error('Página muito grande.');return {text,url:current.toString()};}throw Error('Muitos redirecionamentos.');}
// Mercado Livre: tenta o endpoint oficial para os links /up/MLBU...
// Configure ML_ACCESS_TOKEN no ambiente do servidor. Nunca exponha o token no React.
function parsePrice(input){if(typeof input==='number')return Number.isFinite(input)&&input>0?input:null;let s=String(input??'').replace(/[^\d,.]/g,'');if(!s)return null;const lastComma=s.lastIndexOf(','),lastDot=s.lastIndexOf('.');if(lastComma>=0&&lastDot>=0)s=lastComma>lastDot?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');else if(lastComma>=0)s=s.replace(/\./g,'').replace(',','.');else if((s.match(/\./g)||[]).length>1)s=s.replace(/\./g,'');const n=Number(s);return Number.isFinite(n)&&n>0?n:null;}
function validImage(input,base){try{const u=new URL(String(input||''),base);return ['http:','https:'].includes(u.protocol)?u.toString():''}catch{return ''}}
async function fromMLListing(raw){const u=new URL(raw);if(!/(^|\.)mercadolivre\.com\.br$|(^|\.)mercadolibre\.com$/.test(u.hostname))return null;const id=(u.pathname.match(/MLB-?\d{7,}/i)||[])[0]; // Não confundir com product_trigger_id
if(!id)return null;const cleaned=id.replace('-','').toUpperCase();try{const r=await fetch('https://api.mercadolibre.com/items/'+cleaned,{signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});if(!r.ok)return null;const j=await r.json();if(!j?.title)return null;return {name:j.title,price:parsePrice(j.price),image:validImage(j.secure_thumbnail||j.thumbnail,raw),vendor:'Mercado Livre',url:raw,verifiedAt:new Date().toISOString(),source:'API pública de anúncios MLB',warning:'Preço anunciado; confirme variação, frete e disponibilidade.'}}catch{return null}}
async function fromMercadoLivre(raw){
 const u=new URL(raw);
 if(!/(^|\.)mercadolivre\.com\.br$|(^|\.)mercadolibre\.com$/.test(u.hostname))return null;
 const match=u.pathname.match(/\/up\/(MLBU\d+)/i);
 if(!match)return null;
 const token=process.env.ML_ACCESS_TOKEN;
 if(!token)return null; // sem token, tenta dados públicos da página e informa limitação se bloqueada
 const id=match[1].toUpperCase();
 const response=await fetch(`https://api.mercadolibre.com/user-products/${id}`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error(`O Mercado Livre não liberou este produto pela API (HTTP ${response.status}). Confira a permissão do token ou cadastre manualmente.`);
 const j=await response.json();
 const name=j.family_name||j.title||[j.brand,j.model].filter(Boolean).join(' ');
 if(!name)throw Error('A API não retornou um título utilizável. Cadastre manualmente.');
 const image=j.pictures?.[0]?.secure_url||j.pictures?.[0]?.url||'';
 // O preço é associado ao anúncio e ao contexto do comprador, não ao MLBU.
 return {name,price:null,image,vendor:'Mercado Livre',url:raw,verifiedAt:new Date().toISOString(),source:'API Mercado Livre (produto)',warning:'Produto identificado. Preço ainda não verificado: informe o anúncio vendedor/MLB e confirme o valor antes de salvar.'};
}
app.post('/api/extract',async(req,res)=>{try{
 const raw=String(req.body?.url||'').trim();if(raw.length>2000)throw Error('URL muito longa.');
 const parsed=new URL(raw);if(!['http:','https:'].includes(parsed.protocol))throw Error('Link inválido. Informe HTTP(S).');
 const originalVendor=vendorFrom(parsed.hostname);
 const listing=await fromMLListing(parsed.toString());if(listing)return res.json(listing);
 const ml=await fromMercadoLivre(parsed.toString());if(ml)return res.json(ml);
 let retrieved;
 try{retrieved=await fetchSafe(parsed.toString())}catch(error){
   if(/Endereço não permitido|URL muito longa/i.test(error.message))throw error;
   return res.json(unverifiedFallback(raw,'A loja bloqueou ou não permitiu a consulta automática.'));
 }
 const {text,url}=retrieved;
 const finalHost=new URL(url).hostname;
 // A challenge page often redirects to a third party. Never treat this party as the supplier.
 if(finalHost!==parsed.hostname && !finalHost.endsWith('.'+parsed.hostname) && !parsed.hostname.endsWith('.'+finalHost)){
   return res.json(unverifiedFallback(raw,'O site redirecionou a consulta para uma verificação de acesso.'));
 }
 const $=cheerio.load(text);
 const meta=(...keys)=>{for(const key of keys){const value=$(`meta[property="${key}"]`).attr('content')||$(`meta[name="${key}"]`).attr('content')||$(`meta[itemprop="${key}"]`).attr('content');if(value)return value.trim();}return '';};
 let json={};$('script[type="application/ld+json"]').each((_,el)=>{try{json=findJsonOffers(JSON.parse($(el).text()))||json}catch{}});
 const pageTitle=$('title').text().trim();const heading=$('h1').first().text().trim();
 if(isAccessChallenge(pageTitle)||isAccessChallenge(heading)||isAccessChallenge(text.slice(0,10000))){
   return res.json(unverifiedFallback(raw,'A página retornou uma tela de confirmação de acesso, não os dados do produto.'));
 }
 const rawName=json.name||meta('og:title','twitter:title')||heading||pageTitle;
 const isHint=isStoreOnlyTitle(rawName,originalVendor);
 const name=isHint?urlProductHint(raw):rawName;
 const price=json.price??meta('product:price:amount','og:price:amount','price','twitter:data1');
 const number=isHint?null:parsePrice(price);
 const image=isHint?'':json.image||meta('og:image','twitter:image');
 res.json({name:name||'',price:number,image:validImage(image,url),vendor:originalVendor,url:raw,verifiedAt:new Date().toISOString(),source:isHint?'Sugestão pelo endereço original (não verificada)':'metadados da página',nameVerified:!isHint,warning:isHint?'Título da loja não identificou um produto confiável. Nome sugerido pelo link original; confira antes de cadastrar. Preço não confirmado.':number===null?'Não foi possível confirmar o preço nesta página. Preencha manualmente.':'Confirme preço e frete no site antes da compra.'});
}catch(err){res.status(422).json({error:err.message||'Falha ao consultar link. Cadastre manualmente.'})}});
app.get('/api/health',(_req,res)=>res.json({ok:true}));
export default app;
if(process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) app.listen(process.env.PORT||3333,()=>console.log('GIFT API iniciada na porta '+(process.env.PORT||3333)));
