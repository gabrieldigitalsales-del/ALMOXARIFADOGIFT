import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const filepath=path.resolve('src/utils/itemClassifier.js');
const source=fs.readFileSync(filepath,'utf8').replace("import catalog from '../data/classificationRules.json';",`const catalog = ${fs.readFileSync('src/data/classificationRules.json','utf8').trim()};`);
const encoded='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const {classifyItem}=await import(encoded);
const cases=[
 ['CANTONEIRA 1 1/2 X 1/8','Matéria-prima','Cantoneiras'],
 ['CANTONEIRA AÇO INOX','Matéria-prima','Cantoneiras'],
 ['DISCO DE CORTE 4 1/2','Consumíveis','Discos'],
 ['BROCA 10MM','Consumíveis','Brocas'],
 ['ESTOPA','Consumíveis','Estopas'],
 ['ESMERILHADEIRA ANGULAR MAKITA','Ferramentas','Elétricas'],
 ['ROLETE DE ESTEIRA','Esteiras','Roletes'],
 ['MOTOVIBRADOR','Vibração','Motovibradores'],
 ['MOLA INDUSTRIAL','Vibração','Molas'],
 ['ELETRODO 2.5MM','Soldagem','Eletrodos'],
 ['DISJUNTOR TRIPOLAR','Elétrica','Disjuntores'],
 ['PLACA DE COBRE ITEM INEXISTENTE 999','Diversos','Diversos'],
];
for(const [name,cat,sub] of cases)test(name,()=>{const r=classifyItem(name);assert.equal(r.category,cat);assert.equal(r.subcategory,sub);if(cat==='Diversos')assert.equal(r.needsReview,true)});
