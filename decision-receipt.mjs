import { concerns, normalizeResult, decide } from './domain.mjs';
import { fixtures, catalog } from './fixtures.mjs';
import { recordedSample } from './recorded-sample.mjs';

const names={moisture:'Moisture',oiliness:'Oiliness',texture:'Texture',redness:'Redness'};
const labels={fixture:'Invented engineering response',recorded:'Recorded October 25, 2026 YouCam sample — no new inference',live:'Current server-verified live YouCam response'};
function exactKeys(value,allowed){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!allowed.includes(k)))throw new Error('Invalid receipt input.');
}
export function resolveReceiptAnalysis(source,lastLiveAnalysis){
  exactKeys(source,['mode','id']);
  if(source.mode==='recorded'&&source.id===undefined)return recordedSample;
  if(source.mode==='fixture'&&Object.hasOwn(fixtures,source.id))return {mode:'fixture',...normalizeResult({status:200,data:fixtures[source.id].data})};
  if(source.mode==='live'&&source.id===undefined&&lastLiveAnalysis)return {mode:'live',...lastLiveAnalysis};
  throw new Error('Receipt source is unavailable.');
}
export function buildDecisionReceipt(input,lastLiveAnalysis=null){
  exactKeys(input,['source','concern','preferences']);
  exactKeys(input.preferences,['budget','fragranceFree','lightweight']);
  if(!concerns.includes(input.concern))throw new Error('Select a known concern.');
  const analysis=resolveReceiptAnalysis(input.source,lastLiveAnalysis);
  const choice=decide(catalog,input.preferences);
  const selected=analysis.scores.find(s=>s.type===input.concern);
  const raw=selected.raw,adjusted=selected.ui;
  return {
    schema:'skinshelf-decision-receipt/v1',
    analysis:{source:{...input.source},label:labels[analysis.mode],scores:analysis.scores.map(s=>({...s})),complete:analysis.complete},
    context:{
      concern:input.concern,name:names[input.concern],raw,adjusted,
      explanation:raw===null?'Raw score unavailable. No cosmetic interpretation is inferred from the adjusted score.':`${names[input.concern]} raw score ${Number(raw.toFixed(2))}/100 is higher-is-better within this concern. ${adjusted===null?'Adjusted score unavailable.':`Adjusted score ${adjusted}/100 is a presentation score, not confidence, a percentage measurement or a diagnosis.`}`,
      apiContribution:raw===null?'The response establishes a data gap for your selected concern.':`The scan supplies the ${names[input.concern].toLowerCase()} values above; your choice selects which concern to explain.`
    },
    preferences:{budget:input.preferences.budget,fragranceFree:input.preferences.fragranceFree??false,lightweight:input.preferences.lightweight??false},
    comparison:{eligible:choice.eligible.map(({id,name,price,reasons})=>({id,name,price,reasons:[...reasons]})),excluded:choice.trace.filter(p=>!p.eligible).map(({id,name,price,reasons})=>({id,name,price,reasons:[...reasons]})),keep:{...choice.keep}},
    boundaries:[
      'Scores describe one image only. Different concerns are not ranked against each other.',
      'No score establishes product suitability, ingredient advice, treatment or expected benefit.',
      'Product eligibility and price order use only your budget/preferences and fictional catalog attributes.',
      'Keeping your existing routine costs INR 0 and remains available. Nothing is for sale.',
      'This receipt creates no new API analysis and contains no image, API key, account or task identifier.'
    ]
  };
}
