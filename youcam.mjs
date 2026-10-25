import { normalizeResult, concerns } from './domain.mjs';
const base = 'https://yce-api-01.makeupar.com';
export class IntegrationError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
export function validatePng(bytes) {
  const magic = Buffer.from([137,80,78,71,13,10,26,10]);
  if (!Buffer.isBuffer(bytes) || bytes.length < 33 || bytes.length > 10 * 1024 * 1024 || !bytes.subarray(0,8).equals(magic) || bytes.toString('ascii',12,16) !== 'IHDR') throw new IntegrationError('image', 'Use an authorized PNG sample under 10 MB.');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (Math.min(width,height) < 480 || Math.max(width,height) > 2560) throw new IntegrationError('image', 'SD sample must be 480–2560 pixels on both sides.');
  return { width, height };
}
export function uploadTarget(request) {
  let url;
  try { url = new URL(request?.url); } catch { throw new IntegrationError('contract', 'Provider upload destination was missing.'); }
  if (url.protocol !== 'https:' || url.hostname !== 'yce-us.s3-accelerate.amazonaws.com' || url.port || url.username || url.password || request.method !== 'PUT') throw new IntegrationError('contract', 'Unverified provider upload destination. Check the official flow.');
  return url.href;
}
export async function analyzeSample({ bytes, key, authorized, transport = fetch, wait = ms => new Promise(r=>setTimeout(r,ms)), maxPolls = 12, onStage = ()=>{} }) {
  if (!authorized) throw new IntegrationError('authorization', 'Sample upload permission has not been established.');
  if (!key) throw new IntegrationError('access', 'Live API key is not configured.');
  validatePng(bytes);
  const deadline = AbortSignal.timeout(60000);
  async function call(url, options) {
    let response;
    try { response = await transport(url, { ...options, redirect: 'error', signal: AbortSignal.any([deadline, AbortSignal.timeout(15000)]) }); }
    catch { throw new IntegrationError('network', 'Provider connection failed or timed out. No simulated result was substituted.'); }
    if (!response.ok) {
      const code = response.status === 401 || response.status === 403 ? 'access' : response.status === 429 ? 'rate' : response.status === 402 ? 'units' : 'provider';
      const message = {access:'Check API access with the account owner.',rate:'Provider rate limit reached. Wait before trying again.',units:'No usable units. Do not purchase under the zero-spend budget.',provider:'Provider request failed. No result was substituted.'}[code];
      throw new IntegrationError(code,message);
    }
    return response;
  }
  async function api(path, body) {
    const response = await call(base + path, { method: body ? 'POST' : 'GET', headers: {Authorization:`Bearer ${key}`, 'Content-Type':'application/json'}, ...(body ? { body: JSON.stringify(body) } : {}) });
    let json;
    try { json = await response.json(); } catch { throw new IntegrationError('contract', 'Provider returned invalid JSON.'); }
    if (json?.status !== 200 || !json.data) throw new IntegrationError('contract','Provider response did not match the documented contract.');
    return json;
  }
  const file = await api('/s2s/v2.0/file', { files: [{content_type:'image/png',file_name:'authorized-sample.png',file_size:bytes.length}] });
  const entry = file.data.files?.[0];
  if (typeof entry?.file_id !== 'string' || !entry.file_id) throw new IntegrationError('contract','Provider file identifier was missing.');
  onStage('file_registered');
  const target = uploadTarget(entry.requests?.[0]);
  await call(target, { method:'PUT', headers: {'Content-Type':'image/png','Content-Length':String(bytes.length)}, body:bytes });
  onStage('upload_complete');
  const created = await api('/s2s/v2.0/task/skin-analysis', {src_file_id:entry.file_id,dst_actions:concerns,format:'json'});
  const id = created.data.task_id;
  if (typeof id !== 'string' || !id) throw new IntegrationError('contract','Provider task identifier was missing.');
  onStage('task_created');
  for (let count=0; count<maxPolls; count++) {
    const result = await api('/s2s/v2.0/task/skin-analysis/' + encodeURIComponent(id));
    onStage('poll');
    const state = result.data.task_status;
    if (state === 'success') {
      try { const normalized=normalizeResult(result);onStage('success');return normalized; } catch { throw new IntegrationError('contract','Analysis scores did not match the documented format.'); }
    }
    if (state === 'error') throw new IntegrationError('analysis','Provider could not analyze the sample. No scores were inferred.');
    if (state !== 'running') throw new IntegrationError('contract','Unexpected provider task state.');
    if (count + 1 < maxPolls) await wait(2000);
  }
  throw new IntegrationError('timeout','Analysis is still pending. Do not start a duplicate billable task.');
}
