import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fixtures, catalog } from './fixtures.mjs';
import { normalizeResult, decide } from './domain.mjs';
import { analyzeSample, IntegrationError } from './youcam.mjs';
import { createLiveSession } from './live-session.mjs';
import { createBrowserSession } from './browser-session.mjs';
import { recordedSample } from './recorded-sample.mjs';
import { buildDecisionReceipt } from './decision-receipt.mjs';
const root = new URL('./public/', import.meta.url);
const port = Number(process.env.PORT || 4176);
const unitBudget = Number(process.env.YOUCAM_FREE_UNIT_BUDGET || 0);
const session=createLiveSession(unitBudget);
const browserSession=createBrowserSession(process.env.YOUCAM_BROWSER_SETUP==='1');
const live = process.env.YOUCAM_LIVE_ENABLED === '1' && !!process.env.YOUCAM_API_KEY && process.env.YOUCAM_SAMPLE_AUTHORIZED === '1' && process.env.YOUCAM_ZERO_SPEND_CONFIRMED === '1' && !!process.env.YOUCAM_SAMPLE_PATH && session.available;
let lastLiveAnalysis=null;
const files = {'/':['index.html','text/html'], '/app.mjs':['app.mjs','text/javascript'], '/style.css':['style.css','text/css'], '/operator.html':['operator.html','text/html'], '/operator.mjs':['operator.mjs','text/javascript']};
const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"};
export const server = http.createServer(async (req,res)=>{
  const send=(status,body,type='application/json')=>{res.writeHead(status,{...headers,'Content-Type':type});res.end(type==='application/json'?JSON.stringify(body):body);};
  try {
    if (req.headers.host !== `127.0.0.1:${port}` && req.headers.host !== `localhost:${port}`) return send(403,{error:'Use the local address.'});
    if (req.headers.origin && ![`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(req.headers.origin)) return send(403,{error:'Unexpected request origin.'});
    const path = new URL(req.url,'http://localhost').pathname;
    if (req.method==='GET' && files[path]) { const [name,type]=files[path]; return send(200,await readFile(new URL(name,root)),type); }
    if (req.method==='GET' && path==='/api/config') return send(200,{live:(live&&session.available)||browserSession.available,fixtures:Object.entries(fixtures).map(([id,f])=>({id,label:f.label})),catalog});
    if (req.method==='GET' && path==='/api/verification') return send(200,browserSession.status);
    if (req.method==='GET' && path==='/api/recorded') return send(200,{...recordedSample,source:{mode:'recorded'}});
    if (req.method!=='POST') return send(404,{error:'Not found'});
    if (!['/api/fixture','/api/decide','/api/analyze','/api/prepare','/api/decision-receipt'].includes(path)) return send(404,{error:'Not found'});
    if (path==='/api/prepare' && ![`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(req.headers.origin)) return send(403,{error:'Local operator origin required.'});
    if (req.headers['content-type'] !== 'application/json') return send(415,{error:'Expected JSON.'});
    let text='';
    for await (const chunk of req) {text+=chunk; if(Buffer.byteLength(text)>(path==='/api/prepare'?14*1024*1024:2048)) return send(413,{error:'Request too large.'});}
    let input;
    try { input=JSON.parse(text); } catch {return send(400,{error:'Invalid JSON.'});}
    if (!input || typeof input !== 'object' || Array.isArray(input)) return send(400,{error:'Expected an object.'});
    if (path==='/api/prepare') {
      browserSession.prepare(input);
      input.key='';input.sample='';text='';
      return send(200,{prepared:true,attemptLimit:1,unitCap:9});
    }
    if (path==='/api/fixture') {
      if (!Object.hasOwn(fixtures,input.id)) return send(400,{error:'Unknown scenario.'});
      return send(200,{mode:'fixture',source:{mode:'fixture',id:input.id},...normalizeResult({status:200,data:fixtures[input.id].data})});
    }
    if (path==='/api/decide') return send(200,decide(catalog,input));
    if (path==='/api/decision-receipt') return send(200,buildDecisionReceipt(input,lastLiveAnalysis));
    lastLiveAnalysis=null;
    if (browserSession.available) {
      lastLiveAnalysis=await browserSession.run(analyzeSample);
      return send(200,{mode:'live',source:{mode:'live'},...lastLiveAnalysis});
    }
    if (!live) return send(409,{error:'Live mode requires verified free units, account access and an authorized sample.',code:'access'});
    const analysis=await session.run(async()=>{
      const bytes=await readFile(process.env.YOUCAM_SAMPLE_PATH);
      return analyzeSample({bytes,key:process.env.YOUCAM_API_KEY,authorized:true});
    });
    lastLiveAnalysis=analysis;
    return send(200,{mode:'live',source:{mode:'live'},...analysis});
  } catch(error) {
    if(error instanceof IntegrationError) return send(502,{error:error.message,code:error.code});
    return send(400,{error:'Unable to complete this request. Check inputs or local configuration.'});
  }
});
if (process.argv[1] === fileURLToPath(import.meta.url)) server.listen(port,'127.0.0.1',()=>console.log(`SkinShelf: http://127.0.0.1:${port} · ${live?'live sample enabled':'fixture mode; live API unverified'}`));
