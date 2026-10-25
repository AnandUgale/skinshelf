# SkinShelf

A before-you-buy receipt for a cosmetic skin scan. Read YouCam raw and adjusted scores, distinguish what the image does and does not establish, compare fictional cosmetics against your preferences, and save the reasoning with a visible INR 0 no-purchase option.

**Current state: one real end-to-end adapter sample verified; not registered or submitted.** On October 25, the provider-supplied 1200×1600 PNG ran through metadata registration, upload, one four-concern SD task and two polls to live UI. Free bonus units fell 40 → 31; no card, subscription or auto-refill. The test key was revoked afterward. No photo or credential is bundled. Fixture responses and products remain explicitly fictional. See [verification and limits](VERIFICATION.md).

## Run

Use Node 24 LTS (tested with 24.18.0); no dependencies, package installation or external network required for recorded/fixture mode.

Download this repository using **Code → Download ZIP**, extract it, and open a terminal in the extracted `skinshelf-main` directory. Or clone the repository. Then:

```powershell
node server.mjs
# Open http://127.0.0.1:4176
node --test
node evaluation.mjs
```

The app binds to 127.0.0.1 only. This is a desktop-browser test build, not a hosted live-analysis service. The published ZIP was downloaded through the browser, compared against all 24 reviewed source files, freshly extracted and passed all 40 tests. A separate extracted copy was checked in the browser. These checks used the development computer, not an independent judge's machine.

Watch the public [2:20 demonstration](https://www.youtube.com/watch?v=ZaAmN24-icE). It shows actual browser captures at approximately 1 fps, with pauses edited, English captions and no audio. It reviews a completed API sample; it does not perform another inference.

## Review the completed sample without a key

Choose **Review completed API sample**. The banner and provenance identify a saved October 25 response; no image upload, new inference, API key or provider request occurs. Its four values were copied from the observed normalized UI of the successful adapter transaction, not an independently captured raw provider payload. Expand Recorded sample provenance for the workflow and 9-free-unit accounting. No source image, signed URL, account or task identifier is included.

The engineering selector explicitly replaces the current result with invented fixtures. Switching between recorded and fixture modes resets their provenance; the selector returns to a placeholder when displaying recorded/live data so any fixture can be selected again. Neither recorded review nor fixtures establish ongoing live access for judges.

## Build and export a decision receipt

1. Review the completed sample or select an explicitly invented fixture.
2. Explore a concern and choose a budget/preferences.
3. Click **Build my decision receipt**. The server resolves the source from its own recorded/fixture registry or its last successful live result; it does not trust client-supplied scores or a client claim of live provenance.
4. Read both scores, their roles, the exclusions and the limits. **Download receipt JSON** saves that snapshot without another analysis or external transmission.

Changing source, concern or preferences invalidates the old receipt/export. Missing scores remain missing. Changing concern changes the explanation and saved values, while shopping eligibility remains determined only by budget/preferences. This is a score-literacy hypothesis, not evidence of better consumer decisions or product efficacy. A live receipt uses only normalized scores cached in this local server process; a fresh attempt clears that cache. It does not retain the image, key, account identifier or provider task URLs. The cached-live receipt extension has unit tests, but has not caused a second real API request.

## What works locally

- Two complete, invented four-concern responses and one partial response.
- Exact raw/adjusted values; raw scores are higher-is-better model outputs, not severity or percentages of disease. Adjusted scores are presentation values, not confidence.
- The user chooses which concern to explore. Different concerns are never ranked against one another; no clinical threshold or product-effectiveness mapping is invented. Missing raw values disable that context and are never inferred from adjusted scores.
- Deterministic hard filtering by budget, fragrance-free and lightweight preferences, with reasons for each exclusion and a price-only baseline.
- The shelf is intentionally independent of skin score: current evidence cannot justify a cosmetic efficacy ranking. The API supplies the concern-specific score context and provenance saved in the decision receipt, while user preferences determine product eligibility.
- Missing data stays missing; no hidden fixture fallback after live errors.
- Recorded sample review, exact observed values and honest receipt, without consuming units. Recorded data is never labelled a new live request.
- Exportable before-you-buy receipt with server-canonical provenance, score context, preferences, exclusion reasons and ₹0 option; stale exports are cleared when inputs change.

## Live mode gate

For an explicitly authorized operator test through the internal browser, start with `YOUCAM_BROWSER_SETUP=1`, then open `http://127.0.0.1:4176/operator.html`. Enter the short-lived key in the password field and choose the exact authorized PNG. This local setup requires same-origin JSON and permission/free-access attestations. It holds one key/sample in process memory, allows one attempt capped at 9 free units, clears form fields, and drops key references/zeros the image buffer after the attempt. No browser storage, file persistence, credential echo or logs are used. `/api/verification` exposes only nonsecret stage names and reservation state. Restarting requires a fresh explicit access/balance check; it is not an automatic retry mechanism. Operator setup is disabled by default.

Do not enable until the human completes applicable account/terms/security steps and confirms no-card, no-charge access, sufficient **free** units, and permission for the exact sample image. Keep credentials out of chat, fixtures, source and screenshots. Do not upload personal photos without specific authorization.

The operator may configure these local environment variables through their trusted secret workflow; never put a key in a committed file:

| Variable | Requirement |
| --- | --- |
| YOUCAM_LIVE_ENABLED | 1 only after the access gate |
| YOUCAM_API_KEY | server-side account key, never sent to the browser |
| YOUCAM_SAMPLE_PATH | absolute path to an authorized PNG, outside public/ |
| YOUCAM_SAMPLE_AUTHORIZED | 1 only with documented upload/use permission |
| YOUCAM_ZERO_SPEND_CONFIRMED | 1 only after operational free/no-card access is checked |
| YOUCAM_FREE_UNIT_BUDGET | 9 for one explicitly authorized attempt; never exceed the freshly verified free balance |

The adapter uses the official makeupar server, metadata registration, presigned PUT, four SD concerns (moisture/oiliness/texture/redness), JSON task creation and bounded polling. PNG header/dimension checks are preliminary, not face validation. The provider must reject invalid/no-face input; this has not been tested live. Allowlisted upload host comes from the documented example; if the real provider uses another host, stop and verify it instead of broadening the allowlist blindly.

Successful 1–4 concern SD analysis costs 9 units according to the October 25 official pricing/docs. Attempts are conservatively reserved against the configured unit budget, capped at ten per server process. No purchases or automatic task-creation retries occur. A failed/pending run pauses further live requests for operator review; inspect task/account status before restarting. Pending remote tasks may still finish and consume units. The app exposes no arbitrary file upload or external URL field.

Scores are normalized from the documented `data.results.output` array. One real four-concern sample and 9-unit deduction are verified. Other images, live provider failure cases, image redistribution rights and judge-period availability remain unverified. No clinical accuracy, consumer benefit, rank or prize is claimed.

## Sources and provenance

- [Official skin-analysis reference](https://docs.perfectcorp.com/reference/ai_skin_analysis)
- [India free-account pricing](https://yce.makeupar.com/ai-api/api-pricing)
- [Competition rules](https://youcam-api-skin-ai-ecommerce.devpost.com/rules)

Original code created locally on October 25, 2026, after the dedicated Pro research and ordinary Pro scope critique. Development was delegated by the human; the human did not author or personally test this code. Later receipt/demo preparation used the authorized agent-led fallback after the Pro session failed; it was not Pro-reviewed. No other competition's project code was reused. Product illustrations are original CSS shapes; fixtures are invented test values, not copied analyses. Original source is published under MIT; provider services remain subject to their own terms.

Published source: [AnandUgale/skinshelf](https://github.com/AnandUgale/skinshelf). Public demo: [YouTube](https://www.youtube.com/watch?v=ZaAmN24-icE). No competition submission or award is claimed by publishing these artifacts.
