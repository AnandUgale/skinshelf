const $=id=>document.getElementById(id);
let config,currentResult,selectedContext=null,decisionReceipt=null,receiptRevision=0,buildingReceipt=false;
const names={moisture:'Moisture',oiliness:'Oiliness',texture:'Texture',redness:'Redness'};
const money=value=>`₹${value}`;
function element(tag, text, className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
async function request(path,input){const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});const data=await res.json();if(!res.ok)throw Object.assign(new Error(data.error||'Request failed.'),{code:data.code});return data;}
function reportError(error){$('error').textContent=error.message;$('error').hidden=false;}
function clearError(){$('error').hidden=true;}
function receiptReady(){return !!currentResult?.source&&!!selectedContext;}
function invalidateDecisionReceipt(){receiptRevision++;decisionReceipt=null;$('decision-output').hidden=true;$('decision-output').replaceChildren();$('download-receipt').hidden=true;$('build-receipt').disabled=buildingReceipt||!receiptReady();$('decision-note').textContent=receiptReady()?'Build a fresh receipt for the current scan context and preferences.':'Explore a concern above to build a receipt.';}
function preferences(){return {budget:Number($('budget').value),fragranceFree:$('fragrance').checked,lightweight:$('lightweight').checked};}
function clearContext(){ currentResult=null;invalidateDecisionReceipt();$('scores').replaceChildren();$('receipt-panel').hidden=true;$('receipt').replaceChildren();$('focus-title').textContent='No current analysis';$('focus-copy').textContent='Choose an engineering scenario, review the recorded sample or complete an authorized live request.';$('score-source').textContent='No current response'; }
function explainContext(){
  invalidateDecisionReceipt();
  if(!selectedContext){$('focus-title').textContent='Choose what to explore.';$('focus-copy').textContent='Select an available concern to read its own score. Different concerns are not ranked against each other.';return;}
  const score=currentResult.scores.find(x=>x.type===selectedContext);
  $('focus-title').textContent=`${names[selectedContext]} · selected by you`;
  $('focus-copy').textContent=score?.raw===null||!score?'Raw score unavailable in this response. No interpretation is inferred from the adjusted score.':`Raw score ${Number(score.raw.toFixed(2))} / 100. Higher means better within this reported concern. ${score.ui===null?'Adjusted score unavailable.':`Adjusted score ${score.ui} / 100 is a presentation value, not a probability.`} This does not predict product effectiveness or change the shelf.`;
}
function renderContext(result){
  currentResult=result;
  if(result.mode!=='fixture')$('scenario').value='';
  $('scores').replaceChildren();
  const recorded=result.mode==='recorded';
  $('provenance').textContent=result.mode==='live'?'Live YouCam API response · authorized local sample. Scores describe this image only.':recorded?'Recorded YouCam sample · October 25, 2026 · no new analysis or upload.':'Simulated API response — not live analysis. No photo is uploaded.';
  $('receipt-panel').hidden=!recorded;$('receipt').replaceChildren();
  if(recorded)for(const value of Object.values(result.receipt))$('receipt').append(element('p',value));
  for(const score of result.scores){
    const card=element('article',undefined,'score');card.append(element('h3',names[score.type]));
    const raw=element('div',score.raw===null?'Unavailable':String(Number(score.raw.toFixed(2))),'raw');if(score.raw!==null)raw.append(element('span',' / 100 raw'));
    card.append(raw);if(score.raw!==null){const meter=element('meter');meter.min=1;meter.max=100;meter.value=score.raw;meter.setAttribute('aria-label',`${names[score.type]} raw score`);card.append(meter);}
    card.append(element('div',score.ui===null?'Adjusted score unavailable':`Adjusted score ${score.ui} / 100`,'adjusted'));const explore=element('button',`Explore ${names[score.type]}`,'explore');explore.disabled=score.raw===null;explore.dataset.concern=score.type;explore.setAttribute('aria-pressed',String(selectedContext===score.type));explore.addEventListener('click',()=>{selectedContext=score.type;for(const b of $('scores').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.concern===selectedContext));explainContext();});card.append(explore);$('scores').append(card);
  }
  $('score-source').textContent=result.mode==='live'?'Live YouCam response':recorded?'Recorded YouCam response · Oct 25':'Simulated response';explainContext();
}
async function compare(){
  clearError();invalidateDecisionReceipt();const revision=receiptRevision;try{
    const prefs=preferences(),budget=prefs.budget;const data=await request('/api/decide',prefs);
    if(revision!==receiptRevision)return false;
    $('match-count').textContent=`${data.eligible.length} of 3 match`;$('products').replaceChildren();
    const ordered=[...data.eligible,...data.trace.filter(x=>!x.eligible)];
    for(const item of ordered){
      const card=element('article',undefined,`product${item.eligible?'':' excluded'}`);const miniature=element('div',undefined,`miniature ${item.color}`);miniature.setAttribute('aria-hidden','true');miniature.append(element('div',undefined,'bottle'));card.append(miniature);
      const body=element('div');body.append(element('h3',item.name),element('div',`${item.finish} · fictional cosmetic`,'finish'),element('p',item.eligible?'Matches your choices':'Outside your choices','eligibility'));const reasons=element('ul',undefined,'reasons');for(const reason of item.reasons)reasons.append(element('li',reason));body.append(reasons);card.append(body,element('div',money(item.price),'price'));$('products').append(card);
    }
    const baseline=config.catalog.filter(x=>x.price<=budget).sort((a,b)=>a.price-b.price)[0];const audit=data.trace.find(x=>x.id===baseline?.id);
    $('baseline').textContent=!baseline?'No fictional product fits this budget. The ₹0 keep-routine option remains available.':!audit.eligible?`A price-only filter would show ${baseline.name} at ${money(baseline.price)} first. SkinShelf excludes it: ${audit.reasons.join('; ')}.`:`A price-only filter also shows ${baseline.name} first. Here it meets your selected preferences; SkinShelf makes that reasoning visible.`;
    return true;
  }catch(error){$('products').replaceChildren();$('match-count').textContent='Check your choices';$('baseline').textContent='No comparison is available for these inputs.';reportError(error);return false;}
}
function renderDecisionReceipt(data){
  const out=$('decision-output');out.replaceChildren();out.append(element('h3',data.context.name+' · your selected context'),element('p',data.analysis.label));
  const values=element('div',undefined,'decision-values');
  for(const [label,value] of [['Raw within this concern',data.context.raw],['Adjusted presentation score',data.context.adjusted]]){const cell=element('div');cell.append(element('strong',value===null?'Unavailable':String(Number(value.toFixed(2)))),element('span',label));values.append(cell);}
  out.append(values,element('p',data.context.explanation),element('p',data.context.apiContribution),element('h3','Your shopping constraints'));
  const count=data.comparison.eligible.length;
  out.append(element('p',`Maximum ${money(data.preferences.budget)} per item${data.preferences.fragranceFree?' · fragrance-free':''}${data.preferences.lightweight?' · lightweight feel':''}. ${count} fictional ${count===1?'product matches':'products match'}.`));
  const matches=element('ul');for(const item of data.comparison.eligible)matches.append(element('li',`${item.name} · ${money(item.price)} · ${item.reasons.join('; ')}`));for(const item of data.comparison.excluded)matches.append(element('li',`${item.name} excluded: ${item.reasons.join('; ')}`));out.append(matches,element('p','Keep your existing routine · ₹0 · always available.'),element('h3','What this receipt cannot justify'));
  const limits=element('ul');for(const text of data.boundaries)limits.append(element('li',text));out.append(limits);out.hidden=false;
}
$('preferences').addEventListener('input',invalidateDecisionReceipt);
$('build-receipt').addEventListener('click',async()=>{
  if(buildingReceipt||!receiptReady())return;buildingReceipt=true;$('build-receipt').disabled=true;
  try{
    if(!await compare())return;
    const revision=receiptRevision;
    const data=await request('/api/decision-receipt',{source:currentResult.source,concern:selectedContext,preferences:preferences()});
    if(revision!==receiptRevision){$('decision-note').textContent='Your context or choices changed. Build a new receipt.';return;}
    decisionReceipt=data;renderDecisionReceipt(data);$('download-receipt').hidden=false;$('decision-note').textContent='Receipt ready. It preserves this context and these choices; no new analysis was run.';
  }catch(error){reportError(error);}finally{buildingReceipt=false;$('build-receipt').disabled=!receiptReady();}
});
$('download-receipt').addEventListener('click',()=>{
  if(!decisionReceipt)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(decisionReceipt,null,2)],{type:'application/json'}));
  const link=element('a');link.href=url;link.download='skinshelf-decision-receipt.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('preferences').addEventListener('submit',event=>{event.preventDefault();compare();});
$('scenario').addEventListener('change',async()=>{clearError();clearContext();try{renderContext(await request('/api/fixture',{id:$('scenario').value}));}catch(error){reportError(error);}});
$('recorded').addEventListener('click',async()=>{clearError();clearContext();try{const res=await fetch('/api/recorded');if(!res.ok)throw new Error('Recorded sample unavailable.');renderContext(await res.json());}catch(error){$('provenance').textContent='Recorded sample unavailable. No current result.';reportError(error);}});
$('analyze').addEventListener('click',async()=>{clearError();clearContext();$('analyze').disabled=true;$('scenario').disabled=true;$('provenance').textContent='Waiting for live YouCam analysis. No fixture fallback will be used.';try{renderContext(await request('/api/analyze',{}));config=await(await fetch('/api/config')).json();$('live-note').textContent=config.live?'Live request completed.':'One authorized live sample completed. Further attempts are disabled.';}catch(error){config.live=false;$('provenance').textContent='Live analysis did not complete. No current result.';$('live-note').textContent='Live analysis paused. Review task status and free units before restarting the local server; a pending task may still complete.';reportError(error);}finally{$('analyze').disabled=!config.live;$('scenario').disabled=false;}});
try{
  const res=await fetch('/api/config');if(!res.ok)throw new Error('Local configuration unavailable.');config=await res.json();
  for(const f of config.fixtures){const option=element('option',f.label);option.value=f.id;$('scenario').append(option);}
  $('analyze').disabled=!config.live;$('live-note').textContent=config.live?'Uploads only the operator-configured authorized sample. A successful four-concern SD request costs 9 units. No automatic retry.':'Live mode unavailable: no configured key, verified units or authorized sample. Recorded and fixture review remain local.';
  $('scenario').value='moisture';renderContext(await request('/api/fixture',{id:'moisture'}));await compare();
}catch(error){clearContext();reportError(error);}
