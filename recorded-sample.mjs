// Observed normalized UI values from one authorized adapter run on 2026-10-25.
// This is a saved demonstration, not a raw provider payload or a new inference.
export const recordedSample = {
  mode:'recorded',
  complete:true,
  scores:[
    {type:'moisture',raw:37.048348784446716,ui:65},
    {type:'oiliness',raw:44.694087982177734,ui:65},
    {type:'texture',raw:64.00617361068726,ui:74},
    {type:'redness',raw:98.29679870605469,ui:97}
  ],
  receipt:{
    observed:'2026-10-25',
    source:'Provider-supplied Sample 1; observed normalized UI from the authorized local adapter run.',
    workflow:'Metadata registration → PNG upload → one four-concern SD/JSON task → two status polls → success.',
    accounting:'9 free units used; verified bonus balance 40 → 31. No card, subscription or auto-refill.',
    limits:'One sample only. No new request, private photo, diagnosis or product-efficacy inference. Test key revoked. Independent raw provider payload not bundled.'
  }
};
