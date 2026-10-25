import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserSession } from '../browser-session.mjs';
const key='test-only-placeholder-credential';
function sample(){const b=Buffer.alloc(33);Buffer.from([137,80,78,71,13,10,26,10]).copy(b);b.write('IHDR',12);b.writeUInt32BE(480,16);b.writeUInt32BE(480,20);return b.toString('base64');}
const input=()=>({key,sample:sample(),authorized:true,freeOnly:true});
test('browser operator setup requires explicit permission and never reports secrets',()=>{
  assert.throws(()=>createBrowserSession(false).prepare(input()));
  const s=createBrowserSession(true);
  assert.throws(()=>s.prepare({...input(),authorized:false}));
  assert.throws(()=>s.prepare({...input(),freeOnly:false}));
  assert.throws(()=>s.prepare({...input(),sample:'invalid'}));
  assert.equal(s.available,false);s.prepare(input());assert.equal(s.available,true);
  assert.ok(!JSON.stringify(s.status).includes(key));assert.ok(!JSON.stringify(s.status).includes(sample()));
  assert.throws(()=>s.prepare(input()));
});
test('one-use success clears image and key, records only allowed stages, blocks second run and rearm',async()=>{
  const s=createBrowserSession(true);s.prepare(input());let active;
  const result=await s.run(async args=>{active=args;assert.equal(args.key,key);args.onStage('file_registered');args.onStage(key);args.onStage('success');return {complete:true};});
  assert.equal(result.complete,true);assert.equal(active.bytes.some(x=>x!==0),false);
  assert.equal(s.available,false);assert.equal(s.status.prepared,false);assert.equal(s.status.reservedUnits,9);
  assert.deepEqual(s.status.stages,['file_registered','success']);
  await assert.rejects(s.run(()=>assert.fail('second provider call')));assert.throws(()=>s.prepare(input()));
});
test('failed attempt also clears memory, reserves 9 units and prevents retry',async()=>{
  const s=createBrowserSession(true);s.prepare(input());let bytes;
  await assert.rejects(s.run(async args=>{bytes=args.bytes;throw new Error('test failure');}));
  assert.equal(bytes.some(x=>x!==0),false);assert.equal(s.available,false);assert.equal(s.status.reservedUnits,9);
  await assert.rejects(s.run(()=>assert.fail('second provider call')));assert.throws(()=>s.prepare(input()));
});
