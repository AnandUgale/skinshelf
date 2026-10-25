# Verification and limitations

## Real integration evidence

One authorized provider-supplied sample ran through the SkinShelf server adapter on October 25, 2026, operated by the delegated coding agent through ChatGPT's internal browser:

1. File metadata registration.
2. Successful presigned PNG upload, without the bearer key on that upload.
3. Exactly one four-concern SD/JSON skin-analysis task.
4. Two status polls, then validated success and live UI.

The sample was the provider's full Sample 1 PNG, 1200×1600; the image is not included. Free bonus units fell 40 → 31: 9 units consumed. No card, subscription or auto-refill. Temporary credentials were revoked after testing; no key is included or intended for sharing.

| Concern | Displayed raw | Adjusted |
| --- | ---: | ---: |
| Moisture | 37.05 | 65 |
| Oiliness | 44.69 | 65 |
| Texture | 64.01 | 74 |
| Redness | 98.3 | 97 |

`recorded-sample.mjs` preserves the observed normalized UI values. This is not an independently captured raw provider payload. The recorded-result banner identifies its date and states that no new inference occurs. The source image, signed URLs, provider IDs and account information are excluded. No license to redistribute the input photo is inferred.

## Reproducible local checks

Run `node --test` and `node evaluation.mjs`. Latest local run: 40 tests pass using Node 24.18.0. Coverage includes response validation, missing fields, mocked provider errors/timeouts, one-use budget reservations, upload-host validation, local origin isolation, recorded/fixture modes, canonical receipt sources, rejection of forged live evidence, preservation of score roles and preference-driven shopping constraints. The cached-live receipt branch is unit-tested; no additional real analysis was run for that extension.

Twelve synthetic shopping scenarios previously produced zero hard-constraint violations, twelve deterministic results and twelve ₹0 keep options; the price-only baseline missed a selected preference in six cases. These are engineering checks, not user or clinical outcomes. Browser checks covered the real sample, recorded-score parity, selected concern, mode changes, missing data, zero-budget behavior, receipt download and stale-export invalidation.

## What is not established

- Clinical accuracy, treatment guidance, ingredient advice or product effectiveness.
- That scores are calibrated across different concerns, or that a UI score is confidence or a percentage measurement.
- Real-user comprehension, shopping benefit or consumer impact.
- Robustness across real photos: only one actual adapter sample was authorized. Provider failure cases are mocked.
- New live inference in a key-free demonstration. Recorded and fixture modes work without an API account; live operation requires separate authorized, free access and sample rights.
- Organizer acceptance, competition eligibility, a submission, rank or prize.

## Official references

- [Skin-analysis API](https://docs.perfectcorp.com/reference/ai_skin_analysis): workflow, score roles and successful-task units.
- [API terms](https://www.perfectcorp.com/perfectbeauty/youcam/terms-of-service-api): service/credential and content conditions remain applicable.
- [Hackathon rules](https://youcam-api-skin-ai-ecommerce.devpost.com/rules): required integration, functionality, test access and submission artifacts. A runnable test build is a proposed access route, not an assertion of organizer acceptance.
