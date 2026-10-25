import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDecisionReceipt } from '../decision-receipt.mjs';
import { recordedSample } from '../recorded-sample.mjs';
const input=()=>({source:{mode:'recorded'},concern:'moisture',preferences:{budget:500,fragranceFree:true,lightweight:true}});
test('receipt preserves canonical observed scores and explicitly separates presentation from measurement',()=>{
  const receipt=buildDecisionReceipt(input());
  assert.equal(receipt.schema,'skinshelf-decision-receipt/v1');
  assert.deepEqual(receipt.analysis.scores,recordedSample.scores);
  assert.equal(receipt.context.raw,recordedSample.scores[0].raw);assert.equal(receipt.context.adjusted,65);
  assert.match(receipt.context.explanation,/not confidence, a percentage measurement or a diagnosis/);
  assert.match(receipt.analysis.label,/Recorded.*no new inference/);
  assert.equal(receipt.comparison.keep.price,0);
});
test('client cannot supply forged live evidence, extra score fields or credential fields',()=>{
  for(const source of [{mode:'live'},{mode:'unknown'},{mode:'fixture',id:'__proto__'},{mode:'recorded',key:'not-a-real-credential'},{mode:'recorded',id:'fake'}])assert.throws(()=>buildDecisionReceipt({...input(),source}));
  assert.throws(()=>buildDecisionReceipt({...input(),scores:[{raw:99}]}));
  assert.throws(()=>buildDecisionReceipt({...input(),concern:'__proto__'}));
  assert.throws(()=>buildDecisionReceipt({...input(),preferences:{budget:500,apiKey:'not-a-real-credential'}}));
});
test('missing raw and adjusted values stay missing and never gain inferred interpretation',()=>{
  const missing=buildDecisionReceipt({...input(),source:{mode:'fixture',id:'partial'},concern:'oiliness'});
  assert.equal(missing.context.raw,null);assert.equal(missing.context.adjusted,null);
  assert.match(missing.context.explanation,/No cosmetic interpretation is inferred/);assert.match(missing.context.apiContribution,/data gap/);
  assert.match(missing.analysis.label,/Invented/);
  const partial=buildDecisionReceipt({...input(),source:{mode:'fixture',id:'partial'}});
  assert.equal(partial.context.raw,65);assert.equal(partial.context.adjusted,null);assert.match(partial.context.explanation,/Adjusted score unavailable/);
});
test('context changes receipt values, preferences alone determine products and zero budget retains keep routine',()=>{
  const moisture=buildDecisionReceipt(input());const redness=buildDecisionReceipt({...input(),concern:'redness'});
  assert.notEqual(moisture.context.raw,redness.context.raw);assert.deepEqual(moisture.comparison,redness.comparison);
  assert.deepEqual(moisture.comparison.eligible.map(p=>p.id),['quiet']);
  const zero=buildDecisionReceipt({...input(),preferences:{budget:0,fragranceFree:true,lightweight:true}});
  assert.equal(zero.comparison.eligible.length,0);assert.equal(zero.comparison.excluded.length,3);assert.equal(zero.comparison.keep.price,0);
  assert.throws(()=>buildDecisionReceipt({...input(),preferences:{budget:-1}}));
});
test('a supplied successful server result can be receipted without mutating its cached evidence',()=>{
  const serverResult={scores:structuredClone(recordedSample.scores),complete:true};
  const receipt=buildDecisionReceipt({...input(),source:{mode:'live'}},serverResult);
  assert.match(receipt.analysis.label,/server-verified live/);assert.deepEqual(receipt.analysis.source,{mode:'live'});
  receipt.analysis.scores[0].raw=1;assert.equal(serverResult.scores[0].raw,recordedSample.scores[0].raw);
  assert.ok(!Object.hasOwn(receipt,'key'));assert.ok(!Object.hasOwn(receipt,'image'));assert.ok(!Object.hasOwn(receipt,'task_id'));
});
