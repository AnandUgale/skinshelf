import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeResult, decide } from '../domain.mjs';
import { fixtures, catalog } from '../fixtures.mjs';
const envelope=data=>({status:200,data});
test('four fixture values remain exact without inferring concern priority',()=>{
  const result=normalizeResult(envelope(fixtures.moisture.data));
  assert.equal(result.complete,true);assert.equal(Object.hasOwn(result,'focus'),false);
  assert.deepEqual(result.scores[0],{type:'moisture',raw:42,ui:68});
  assert.equal(normalizeResult(envelope(fixtures.texture.data)).scores[2].raw,44);
});
test('higher raw score remains a value without a derived severity label',()=>{
  const data=structuredClone(fixtures.moisture.data);data.results.output[0].raw_score=99;
  const result=normalizeResult(envelope(data));assert.equal(result.scores[0].raw,99);assert.equal(Object.hasOwn(result.scores[0],'severity'),false);
});
test('partial scores remain missing and do not create a false complete comparison',()=>{
  const result=normalizeResult(envelope(fixtures.partial.data));
  assert.equal(result.complete,false);assert.equal(Object.hasOwn(result,'focus'),false);
  assert.equal(result.scores[0].ui,null);assert.equal(result.scores[1].raw,null);
});
for(const value of ['42',NaN,Infinity,-1,0,101,null]) test(`reject invalid raw score ${String(value)}`,()=>{
  const data=structuredClone(fixtures.moisture.data);data.results.output[0].raw_score=value;
  assert.throws(()=>normalizeResult(envelope(data)),/Invalid raw/);
});
test('adjusted score is not allowed to silently accept fractions or missing shape',()=>{
  const data=structuredClone(fixtures.moisture.data);data.results.output[0].ui_score=68.2;
  assert.throws(()=>normalizeResult(envelope(data)),/Invalid adjusted/);
  for(const invalid of [null,{}, {status:200,data:{task_status:'running'}},{status:200,data:{task_status:'success',results:{output:{}}}}])assert.throws(()=>normalizeResult(invalid));
});
test('duplicates are rejected, unknown concern does not become known data',()=>{
  const data=structuredClone(fixtures.moisture.data);data.results.output.push(data.results.output[0]);
  assert.throws(()=>normalizeResult(envelope(data)),/Duplicate/);
  assert.equal(normalizeResult(envelope({task_status:'success',results:{output:[{type:'unknown',raw_score:50}]}})).complete,false);
});
test('budget and both preferences override cheaper fictional item',()=>{
  const result=decide(catalog,{budget:500,fragranceFree:true,lightweight:true});
  assert.equal(result.suggested,'quiet');assert.equal(result.eligible.length,1);
  assert.match(result.trace.find(x=>x.id==='cloud').reasons[0],/fragrance-free/);
  assert.match(result.trace.find(x=>x.id==='cushion').reasons[0],/lightweight/);
});
test('zero budget retains keep routine; boundary price accepted; deterministic output',()=>{
  assert.equal(decide(catalog,{budget:0}).eligible.length,0);
  assert.equal(decide(catalog,{budget:0}).keep.price,0);
  const input={budget:399,fragranceFree:true,lightweight:true};
  assert.equal(decide(catalog,input).suggested,'quiet');assert.deepEqual(decide(catalog,input),decide(catalog,input));
  assert.equal(decide(catalog,{...input,budget:398}).suggested,null);
});
test('invalid constraints rejected rather than silently coerced',()=>{
  for(const budget of ['500',-1,0.5,10001,NaN]) assert.throws(()=>decide(catalog,{budget}));
  assert.throws(()=>decide(catalog,{budget:500,fragranceFree:'yes'}));
});
test('specified raw values do not create automatic lowest-concern selection',()=>{
  const data=structuredClone(fixtures.moisture.data);[62,81,74,90].forEach((score,i)=>data.results.output[i].raw_score=score);
  const result=normalizeResult(envelope(data));assert.deepEqual(Object.keys(result),['scores','complete']);
  assert.deepEqual(result.scores.map(x=>x.type),['moisture','oiliness','texture','redness']);
});
test('swapping moisture/redness preserves concern identity without deriving priority',()=>{
  const data=structuredClone(fixtures.moisture.data);[data.results.output[0].raw_score,data.results.output[3].raw_score]=[data.results.output[3].raw_score,data.results.output[0].raw_score];
  const result=normalizeResult(envelope(data));assert.equal(Object.hasOwn(result,'focus'),false);
  assert.equal(result.scores[0].type,'moisture');assert.equal(result.scores[3].type,'redness');
  assert.equal(result.scores[0].raw,81);assert.equal(result.scores[3].raw,42);
});
