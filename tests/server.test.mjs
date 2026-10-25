import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
test('local HTTP workflow, fixture provenance, disabled live and origin isolation',async()=>{
  const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:'4177',YOUCAM_LIVE_ENABLED:'0'},stdio:['ignore','pipe','pipe']});
  try {
    await Promise.race([once(child.stdout,'data'),once(child,'error'),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Startup timeout')),5000))]);
    const origin='http://127.0.0.1:4177';
    const config=await (await fetch(origin+'/api/config')).json();assert.equal(config.live,false);assert.equal(config.catalog.length,3);
    const recorded=await(await fetch(origin+'/api/recorded')).json();assert.equal(recorded.mode,'recorded');assert.equal(recorded.scores.length,4);assert.match(recorded.receipt.limits,/No new request/);
    assert.equal((await(await fetch(origin+'/api/verification')).json()).reservedUnits,0);
    const post=(path,body,headers={})=>fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
    const fixture=await(await post('/api/fixture',{id:'moisture'})).json();assert.equal(fixture.mode,'fixture');assert.equal(fixture.scores[0].raw,42);
    const receiptInput={source:{mode:'recorded'},concern:'moisture',preferences:{budget:300,fragranceFree:true,lightweight:true}};
    const receipt=await(await post('/api/decision-receipt',receiptInput)).json();assert.equal(receipt.analysis.source.mode,'recorded');assert.equal(receipt.context.adjusted,65);assert.equal(receipt.comparison.eligible.length,0);
    assert.equal((await post('/api/decision-receipt',{...receiptInput,source:{mode:'live'}})).status,400);
    assert.equal((await(await fetch(origin+'/api/verification')).json()).reservedUnits,0);
    assert.equal((await post('/api/analyze',{})).status,409);
    assert.equal((await post('/api/fixture',{id:'__proto__'})).status,400);
    assert.equal((await post('/api/fixture',{id:'moisture'},{Origin:'https://attacker.invalid'})).status,403);
    assert.equal((await post('/api/decide',{budget:'500'})).status,400);
    const page=await fetch(origin);assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.match(await page.text(),/Simulated API response/);
    assert.equal((await fetch(origin+'/.env')).status,404);
    assert.equal((await post('/api/prepare',{})).status,403);
    assert.equal((await post('/api/prepare',{}, {Origin:origin})).status,502);
    const audit=await(await fetch(origin+'/api/verification')).json();assert.equal(audit.enabled,false);assert.equal(audit.prepared,false);assert.equal(audit.reservedUnits,0);
    const app=await(await fetch(origin+'/app.mjs')).text();assert.ok(!app.includes('Bearer '));assert.match(app,/No fixture fallback/);
  } finally {child.kill();await once(child,'exit');}
});
