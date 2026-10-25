import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSample, uploadTarget, validatePng } from '../youcam.mjs';
import { fixtures } from '../fixtures.mjs';
import { createLiveSession } from '../live-session.mjs';
// Header-only fake PNG for transport-unit tests; deliberately never sent to a real API.
function png(width=480,height=480){const b=Buffer.alloc(33);Buffer.from([137,80,78,71,13,10,26,10]).copy(b);b.write('IHDR',12);b.writeUInt32BE(width,16);b.writeUInt32BE(height,20);return b;}
const key='unit-test-placeholder-not-a-real-key';
const upload='https://yce-us.s3-accelerate.amazonaws.com/test-only/fixture?signature=FAKE';
const file={status:200,data:{files:[{file_id:'fixture-file',requests:[{method:'PUT',url:upload}]}]}};
const task={status:200,data:{task_id:'fixture/task+id'}};
const running={status:200,data:{task_status:'running'}};
const success={status:200,data:fixtures.moisture.data};
function mock(sequence){const calls=[];return {calls,transport:async(url,options)=>{calls.push({url,options});const next=sequence.shift();if(next instanceof Error)throw next;if(next===undefined)throw new Error('Unexpected transport call');if(typeof next?.ok==='boolean')return next;return {ok:true,status:200,json:async()=>next};}};}
const args={bytes:png(),key,authorized:true,wait:async()=>{}};
test('documented upload/create/poll sequence, exact actions, no bearer on signed upload',async()=>{
  const m=mock([file,{},task,running,success]);const result=await analyzeSample({...args,...m});
  assert.equal(result.scores[0].raw,42);assert.equal(m.calls.length,5);
  assert.equal(m.calls[0].url,'https://yce-api-01.makeupar.com/s2s/v2.0/file');
  assert.equal(m.calls[1].options.headers.Authorization,undefined);
  assert.equal(m.calls[1].options.redirect,'error');
  assert.equal(m.calls[2].options.headers.Authorization,`Bearer ${key}`);
  assert.deepEqual(JSON.parse(m.calls[2].options.body).dst_actions,['moisture','oiliness','texture','redness']);
  assert.match(m.calls[3].url,/fixture%2Ftask%2Bid$/);
});
test('live mode cannot upload without authorization, key, or valid image dimensions',async()=>{
  const m=mock([]);
  await assert.rejects(analyzeSample({...args,...m,authorized:false}),e=>e.code==='authorization');
  await assert.rejects(analyzeSample({...args,...m,key:''}),e=>e.code==='access');
  await assert.rejects(analyzeSample({...args,...m,bytes:png(479,480)}),e=>e.code==='image');
  assert.equal(m.calls.length,0);assert.throws(()=>validatePng(Buffer.from('private text')),/PNG/);
});
test('unverified or deceptive upload hosts rejected before transport',()=>{
  for(const url of ['http://yce-us.s3-accelerate.amazonaws.com/x','https://yce-us.s3-accelerate.amazonaws.com.attacker.invalid/x','https://user@yce-us.s3-accelerate.amazonaws.com/x','https://localhost/x','file:///private.png'])assert.throws(()=>uploadTarget({method:'PUT',url}));
});
for(const [status,code] of [[401,'access'],[403,'access'],[429,'rate'],[402,'units'],[500,'provider']])test(`provider HTTP ${status} sanitized and no retry`,async()=>{
  const m=mock([{ok:false,status,json:async()=>({error:`secret ${key}`})}]);
  await assert.rejects(analyzeSample({...args,...m}),e=>e.code===code&&!e.message.includes(key));assert.equal(m.calls.length,1);
});
test('failed presigned upload prevents task creation',async()=>{
  const m=mock([file,{ok:false,status:500}]);await assert.rejects(analyzeSample({...args,...m}),e=>e.code==='provider');assert.equal(m.calls.length,2);
});
test('bounded polling times out without creating another task',async()=>{
  const m=mock([file,{},task,running,running]);await assert.rejects(analyzeSample({...args,...m,maxPolls:2}),e=>e.code==='timeout');
  assert.equal(m.calls.filter(x=>x.options.method==='POST'&&x.url.includes('task/')).length,1);
});
test('engine failure and unexpected state do not return fixtures',async()=>{
  for(const state of ['error','invented']){const m=mock([file,{},task,{status:200,data:{task_status:state}}]);await assert.rejects(analyzeSample({...args,...m}),e=>['analysis','contract'].includes(e.code));}
});
test('network errors and malformed JSON do not expose key or presigned destination',async()=>{
  const m=mock([new Error(`${key} ${upload}`)]);await assert.rejects(analyzeSample({...args,...m}),e=>e.code==='network'&&!e.message.includes(key)&&!e.message.includes(upload));
  const malformed=mock([{ok:true,status:200,json:async()=>{throw new Error('malformed');}}]);await assert.rejects(analyzeSample({...args,...malformed}),e=>e.code==='contract');
});
test('invalid successful score contract rejected',async()=>{
  const data=structuredClone(success);data.data.results.output[0].raw_score=101;const m=mock([file,{},task,data]);
  await assert.rejects(analyzeSample({...args,...m}),e=>e.code==='contract');
});
test('failure after task creation retains reservation and pauses any second operation',async()=>{
  const session=createLiveSession(90);const m=mock([file,{},task,new Error('lost polling connection')]);
  await assert.rejects(session.run(()=>analyzeSample({...args,...m})),e=>e.code==='network');
  assert.equal(session.reservedUnits,9);assert.equal(session.available,false);
  let secondOperation=false;await assert.rejects(session.run(async()=>{secondOperation=true;}),e=>e.code==='paused');
  assert.equal(secondOperation,false);assert.equal(m.calls.length,4);assert.equal(session.reservedUnits,9);
});
