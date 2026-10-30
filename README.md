# Câmpia Acum

Romanian local news reader and owner-only editorial dashboard. Hosted on Sites with an R2 binding named `BUCKET`.

Run `node scripts/build.mjs`, `node scripts/check.mjs`, and `node scripts/preview.mjs`. Preview is loopback-only and supplies a local admin identity; production never supplies a mock identity. Local content lives in ignored `.local-data/`.

`/admin` requires the dispatch-authenticated owner email, configured through the required server-only `ADMIN_EMAIL` secret. Mutations check server identity and same-origin requests. The public API omits provenance; the admin API retains it.

Sources, categories and articles are individual R2 JSON objects. Defaults are merged with overrides and deletion markers. RSS/Atom items are archived by URL hash; subsequent imports preserve edits and deletion markers. Identical titles are collapsed in the reader. RSS discovers articles. A DOM reader fetches the original public page and extracts its full article body, omitting ads, navigation and related links. Existing archives can be completed in four-item batches through the Admin dashboard; opening an incomplete article also fetches it on demand. Editorial edits and deleted articles are preserved. Failed extraction is recorded for admin review; missing text is never generated or presented as complete. Restricted-access pages are not bypassed.

Imports also run on initial access and every ten minutes when accessed; open pages refresh every ten minutes. Background cloud updates use `/api/background/run` with actions `sync`, repeated `enrich`, and `finish`, then read `/api/background/status`. The caller obtains the Site service credential from `get_site`, sends it in both `OAI-Sites-Authorization: Bearer` and `X-Background-Token`, and must match the server-only `SERVICE_AUTH_TOKEN` configured in Sites. The source exposes credential-free instructions at `/api/background/instructions`. Credentials never belong in schedule prompts or local source. A linked cloud schedule is registered in R2 only after native schedule creation succeeds. The Admin UI shows the last verified success and flags stale updates.

AI and direct Facebook group access remain unconfigured; Facebook sources are registered but disabled.

## GitHub repository

Source: https://github.com/skynexus91/Campia-Acum

Install with `npm ci`, build with `npm run build`, and check with `npm test` plus `node scripts/check-extract.mjs`. Use Node.js 22 or newer. The Worker deployment requires an R2 bucket bound as `BUCKET` and the `ADMIN_EMAIL` secret; without that setting admin access is denied. `SERVICE_AUTH_TOKEN` is required for background service calls and is configured only on the hosting platform. Neither articles stored in R2 nor runtime secrets are part of this repository. The linked hourly cloud schedule is hosting configuration, not a local cron job.
