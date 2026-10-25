import { createLiveSession } from './live-session.mjs';
import { validatePng, IntegrationError } from './youcam.mjs';

// Operator-only, one-use memory. Never serialize the key or sample.
export function createBrowserSession(enabled) {
  const budget = createLiveSession(9);
  let secret = null, used = false;
  const stages = [];
  return {
    get available() { return !!secret && budget.available; },
    get status() { return {enabled, prepared:!!secret, used, reservedUnits:budget.reservedUnits, stages:[...stages]}; },
    prepare(input) {
      if (!enabled || used || secret) throw new IntegrationError('access','Browser setup is unavailable or already used.');
      if (input.authorized !== true || input.freeOnly !== true) throw new IntegrationError('authorization','Confirm sample permission and verified free, no-card access.');
      if (typeof input.key !== 'string' || input.key.length < 16 || input.key.length > 512 || /\s/.test(input.key)) throw new IntegrationError('access','Check the key in the operator setup.');
      if (typeof input.sample !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.sample)) throw new IntegrationError('image','Choose the authorized PNG sample.');
      const bytes=Buffer.from(input.sample,'base64');
      validatePng(bytes);
      secret={key:input.key,bytes};
    },
    async run(analyze) {
      if (!secret) throw new IntegrationError('access','No prepared one-use sample.');
      return budget.run(async()=>{
        used=true;
        const active=secret; secret=null;
        try {
          return await analyze({...active,authorized:true,onStage:stage=>{
            if (['file_registered','upload_complete','task_created','poll','success'].includes(stage)) stages.push(stage);
          }});
        } finally { active.key=''; active.bytes.fill(0); }
      });
    }
  };
}
