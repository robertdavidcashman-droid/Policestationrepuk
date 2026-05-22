# Post-deploy smoke test — `/register` (Turnstile rip-out)

This is the manual + scripted checklist to run **after** the registration-form
Turnstile change is deployed to production.

- Production URL: https://policestationrepuk.org/register
- Vercel project: `policestationrepuk-new`
- Expected outcome of this change:
  1. The Cloudflare Turnstile widget no longer renders on `/register`.
  2. The eligibility-check (Stage 1) submit no longer waits for a Turnstile token,
     and Stage 2 of the form opens as soon as the server returns a gate token.
  3. No requests to `https://challenges.cloudflare.com/...` are made by `/register`.
  4. `/Contact`, the secure rep-verification page, and the "Report this profile"
     button still load Turnstile (those forms are unchanged).

---

## 1. Quick visual check (60 seconds, no submit)

1. Open https://policestationrepuk.org/register in a fresh **incognito** window.
2. Confirm the "Step 1 of 2 — eligibility check" panel is visible on the right.
3. Confirm there is **no** Cloudflare "I'm a human" widget anywhere on the page.
   - You should not see "Bot-protection check (Cloudflare)".
   - You should not see a Cloudflare logo or a checkbox / iframe near the
     eligibility form.
4. Open DevTools → Network → filter on `challenges`.
   - Reload the page. There should be **0** requests matching
     `challenges.cloudflare.com`.
5. Open DevTools → Console. There should be no red errors.
6. Open DevTools → Elements and search for `data-cf-turnstile`. There should be
   **0** matches.

If any of (3)–(6) fail, **stop** and treat the deploy as broken — see
"Rollback" below.

---

## 2. Scripted API smoke (no production data created)

Both scripts are safe against production. The first only hits
`/api/register/gate` (mints short-lived KV tokens that expire on their own and
never become a public listing). The second walks the UI but **does** submit a
real registration at the end — only run it if you are willing to either let it
land in the admin queue or remove the row afterwards.

### 2a. Gate-only API smoke (fully safe)

```bash
node scripts/smoke-register-gate.mjs https://policestationrepuk.org
```

Expected output (last line):

```
smoke-register-gate: 9/9 passed.
```

What it checks:
- `/register` renders with the gate-only HTML and no full-form leaked into the SSR.
- `robots.txt` disallows `/register` (so the page is not indexed).
- `sitemap.xml` does not list `/register`.
- `/api/register/gate` returns the right structured error codes for the four
  bad-input cases.
- `/api/register/gate` mints a token for a valid PSRAS submission.
- `/api/register` returns 403 + `requiresGate=true` for both no-token and
  fake-token requests.

### 2b. Full UI smoke with screenshots (creates one production record)

⚠️ This script fills in the full Stage 2 form and POSTs `/api/register`. It
will land a registration row with the email
`psrtest+<timestamp>@example.com`. Either expect to see it in the admin queue
(it is risk-flagged because the SRA is a real one but the firm details are
synthetic) or delete it from KV / `repreview:` after the run.

```bash
node scripts/smoke-register-screenshots.mjs https://policestationrepuk.org
```

Expected output (last line):

```
smoke-register-screenshots: 7/7 passed.
```

Artefacts saved to `screenshots/register-smoke/`:

| File | What it shows |
| --- | --- |
| `01-stage1-gate-empty.png` | Initial /register page — no Turnstile widget |
| `02-stage1-gate-filled.png` | Email + Solicitor + SRA filled, submit enabled |
| `03-stage2-form-unlocked.png` | Stage 2 full form opens after gate submit |
| `04-stage2-form-filled.png` | Stage 2 with name / mobile / Kent filled |
| `05-stage4-after-submit.png` | Outcome panel after `/api/register` returns 200 |
| `manifest.json` | Recorded `turnstileHits=[]`, `consoleErrors=[]`, results |

The most important manifest fields:

```json
{
  "turnstileHits": [],
  "consoleErrors": [],
  "results": [{ "name": "no requests to challenges.cloudflare.com (Turnstile is gone)", "ok": true }, ...]
}
```

If `turnstileHits` is non-empty, the rip-out has regressed.

---

## 3. Manual end-to-end with a real inbox (recommended once)

Use the SRA test number `190283` and any inbox you own.

1. Open https://policestationrepuk.org/register in a fresh incognito window.
2. Enter your real email.
3. Pick "Solicitor".
4. Enter SRA `190283`.
5. If the page shows the "Verify your email address" panel:
   - Click "Send verification code".
   - Wait for the email (subject: PoliceStationRepUK verification code).
   - Paste the 6-digit code.
   - Confirm: with the code entered, the submit button is enabled and
     does **not** require any extra Turnstile interaction.
6. Click "Verify eligibility & continue".
7. Confirm Stage 2 ("Step 2 of 2 — full profile") opens within ~1 second.
8. Either:
   - Fill in the full form and submit (creates a real registration — admin
     team will need to delete it), or
   - Stop here. Just reaching Stage 2 confirms the bug is fixed.

If Stage 2 does **not** open after step 6 — capture the DevTools Network entry
for `POST /api/register/gate` (status + response JSON) and the Console errors,
then see "Rollback" below.

---

## 4. Negative checks — make sure other forms still have Turnstile

These were intentionally **not** changed by this rip-out and should still load
the Cloudflare widget. If any of them lost their widget, that is a regression.

1. https://policestationrepuk.org/Contact — Contact form: Turnstile widget
   should appear above the "Send message" button.
   *(Note: the contact form may not have Turnstile — verify against the
   pre-deploy state. This is included for completeness.)*
2. Any rep page with the "Report this profile" button — clicking it should
   show a Turnstile challenge before send.
3. The secure rep-verification page (admin-issued one-shot link) — Turnstile
   should appear before the verify button.

---

## 5. Rollback

If any check above fails:

1. Open Vercel → `policestationrepuk-new` → Deployments.
2. Find the previous green deployment (the one before this Turnstile rip-out).
3. Click "..." → "Promote to Production".
4. The site will roll back within ~30s. Confirm by reloading
   https://policestationrepuk.org/register and looking for the Turnstile
   widget reappearing.
5. File an issue with: the failing check id, the DevTools Network entry, the
   `manifest.json` (if step 2b ran), and any console errors.

---

## 6. What was changed in this deploy (one-liner per file)

- `app/register/RegisterForm.tsx` — removed Turnstile widget, state, guards, diagnostics rows.
- `app/api/register/gate/route.ts` — dropped `verifyTurnstile` and the four `TURNSTILE_*` error responses.
- `app/api/register/send-code/route.ts` — dropped `verifyTurnstile`.
- `app/register/page.tsx` — stopped passing `turnstileSiteKey` into `<RegisterForm>`.
- `next.config.ts` — comment-only update; CSP unchanged (other forms still need it).
- `scripts/smoke-register-gate.mjs` — dropped legacy `bot-check-failed` branch.
- `__tests__/register-gate-route.test.ts`, `__tests__/register-send-code-route.test.ts`,
  `__tests__/csp-turnstile-allowed.test.ts`, `tests/e2e/register-flow.spec.ts` — updated
  tests to match the new contract; added regression tests that assert no Turnstile
  network requests fire from `/register`.
- `scripts/smoke-register-screenshots.mjs` — **new** Playwright smoke script
  (used in section 2b).

`lib/turnstile.ts` and `components/TurnstileWidget.tsx` are intentionally **kept** —
the secure rep-verification flow and "Report this profile" button still use them.
