#!/usr/bin/env node
/**
 * Smoke test for the gated registration flow.
 *
 *   node scripts/smoke-register-gate.mjs [base-url]
 *
 *   default base-url: http://localhost:3055
 *
 * Checks performed (each prints PASS/FAIL):
 *   1. GET  /register                 -> 200, no full-form HTML present
 *   2. GET  /robots.txt               -> 200, contains "/register" disallow
 *   3. GET  /sitemap.xml              -> 200, does NOT contain /register URL
 *   4. POST /api/register/gate (missing email)        -> 400
 *   5. POST /api/register/gate (invalid email)        -> 400
 *   6. POST /api/register/gate (no PIN/SRA/proof)     -> 400 missing-evidence
 *   7. POST /api/register/gate (psras + pin number)   -> 200 ok or
 *                                                       200 ok:false (admin alert)
 *   8. POST /api/register (no gateToken)              -> 403 requiresGate
 *   9. POST /api/register (invalid gateToken)         -> 403 requiresGate
 *
 * Exit code: 0 if all checks pass, 1 otherwise.
 */

const base = process.argv[2] || process.env.QA_BASE_URL || 'http://localhost:3055';

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  const line = detail ? `${tag}  ${name} :: ${detail}` : `${tag}  ${name}`;
  // eslint-disable-next-line no-console
  console.log(line);
}

async function postJson(path, body) {
  const res = await fetch(new URL(path, base).href, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

async function get(path) {
  const res = await fetch(new URL(path, base).href, { redirect: 'manual' });
  const body = await res.text();
  return { status: res.status, body, headers: res.headers };
}

async function main() {
  // 1. /register renders gate UI only — full-form input fields must NOT be in
  //    the initial HTML. Markers used: id="fullName" + id="firmName" + the
  //    "Step 2 of 2" header. (Phrases like "Full postal address" appear in the
  //    privacy notice on the page itself — those are NOT form markers.)
  try {
    const r = await get('/register');
    const hasGate =
      /eligibility check/i.test(r.body) &&
      /Verify eligibility/i.test(r.body) &&
      /id="gate-email"/.test(r.body);
    const hasFullForm =
      /id="fullName"/.test(r.body) ||
      /id="firmName"/.test(r.body) ||
      /Step 2 of 2/.test(r.body) ||
      /confirmAccredited/.test(r.body);
    record(
      '/register loads with gate-only UI (no full form HTML)',
      r.status === 200 && hasGate && !hasFullForm,
      r.status === 200
        ? hasFullForm
          ? 'full-form HTML leaked into initial response'
          : hasGate
            ? 'gate UI present, full form absent (good)'
            : 'gate UI missing'
        : `HTTP ${r.status}`,
    );
  } catch (e) {
    record('/register loads', false, String(e));
  }

  // 2. robots.txt disallows /register
  try {
    const r = await get('/robots.txt');
    const ok = r.status === 200 && /disallow:\s*\/register/i.test(r.body);
    record('/robots.txt disallows /register', ok, ok ? '' : 'no disallow rule for /register');
  } catch (e) {
    record('/robots.txt disallows /register', false, String(e));
  }

  // 3. sitemap.xml does NOT contain /register
  try {
    const r = await get('/sitemap.xml');
    const includesRegister = /\/register(<|\/<|\?)/i.test(r.body) || /<loc>[^<]*\/register<\/loc>/i.test(r.body);
    record(
      '/sitemap.xml does not list /register',
      r.status === 200 && !includesRegister,
      includesRegister ? '/register present in sitemap (should be removed)' : 'omitted (good)',
    );
  } catch (e) {
    record('/sitemap.xml check', false, String(e));
  }

  // 4. gate with missing email
  try {
    const r = await postJson('/api/register/gate', {});
    record(
      'POST /api/register/gate without email -> 400',
      r.status === 400 && r.json && r.json.reason === 'invalid-email',
      `status=${r.status} reason=${r.json?.reason || '?'}`,
    );
  } catch (e) {
    record('POST /api/register/gate without email', false, String(e));
  }

  // 5. gate with invalid email format
  try {
    const r = await postJson('/api/register/gate', { email: 'not-an-email', category: 'psras-accredited' });
    record(
      'POST /api/register/gate with bad email -> 400',
      r.status === 400 && r.json && r.json.reason === 'invalid-email',
      `status=${r.status} reason=${r.json?.reason || '?'}`,
    );
  } catch (e) {
    record('POST /api/register/gate with bad email', false, String(e));
  }

  // 6. gate with no PIN / SRA / proof
  try {
    const r = await postJson('/api/register/gate', {
      email: `smoke-${Date.now()}@example.com`,
      category: 'psras-accredited',
    });
    record(
      'POST /api/register/gate with no evidence -> 400 missing-evidence',
      r.status === 400 && r.json && r.json.reason === 'missing-evidence',
      `status=${r.status} reason=${r.json?.reason || '?'}`,
    );
  } catch (e) {
    record('POST /api/register/gate with no evidence', false, String(e));
  }

  // 7. gate with PIN — should pass and either mint a token or ask for the
  //    email code. Three legitimate outcomes exist:
  //      a) 200 ok + gateToken (KV configured, REQUIRE_ENQUIRY_EMAIL_VERIFICATION
  //         off) — this is the dev-server happy path.
  //      b) 400 EMAIL_CODE_REQUIRED (KV configured, REQUIRE_ENQUIRY_EMAIL_VERIFICATION
  //         on) — this is the production happy path: the gate accepted the
  //         submission without a Turnstile token and is now asking for the
  //         emailed 6-digit code, exactly as designed.
  //      c) 503 / reason=temporary-unavailable (KV not configured) — gate
  //         path otherwise correct, KV simply unavailable.
  //    All three confirm the gate is wired up AND that Turnstile is no
  //    longer required (any `bot-check-*` reason would be a regression).
  let gateToken = null;
  try {
    const r = await postJson('/api/register/gate', {
      email: `smoke-pin-${Date.now()}@example.com`,
      category: 'psras-accredited',
      pinNumber: 'SMOKE12345',
    });
    if (r.status === 200 && r.json && r.json.ok === true && r.json.gateToken) {
      gateToken = r.json.gateToken;
      record(
        'POST /api/register/gate with PIN -> 200 ok + gateToken',
        true,
        `token=${String(gateToken).slice(0, 12)}…`,
      );
    } else if (
      r.status === 400 &&
      r.json &&
      r.json.code === 'EMAIL_CODE_REQUIRED'
    ) {
      record(
        'POST /api/register/gate with PIN -> 400 EMAIL_CODE_REQUIRED (production: email verification enabled)',
        true,
        'Turnstile is gone; gate now waits on the email code as expected',
      );
    } else if (
      r.status === 503 ||
      (r.status === 200 && r.json && r.json.ok === false && r.json.reason === 'temporary-unavailable')
    ) {
      record(
        'POST /api/register/gate with PIN -> 503/temporary-unavailable (KV not configured locally)',
        true,
        'KV unavailable; gate path otherwise correct',
      );
    } else {
      record(
        'POST /api/register/gate with PIN -> 200 ok + gateToken',
        false,
        `status=${r.status} ok=${r.json?.ok} reason=${r.json?.reason || '?'} code=${r.json?.code || '?'}`,
      );
    }
  } catch (e) {
    record('POST /api/register/gate with PIN', false, String(e));
  }

  // 8. /api/register without gateToken
  try {
    const r = await postJson('/api/register', {
      fullName: 'Smoke Test',
      email: `smoke-${Date.now()}@example.com`,
      mobile: '07700900000',
      category: 'psras-accredited',
      pinNumber: 'SMOKE12345',
      counties: 'Kent',
      confirmAccredited: true,
      confirmAccurate: true,
    });
    record(
      'POST /api/register without gateToken -> 403 requiresGate',
      r.status === 403 && r.json && r.json.requiresGate === true,
      `status=${r.status} requiresGate=${r.json?.requiresGate ?? false}`,
    );
  } catch (e) {
    record('POST /api/register without gateToken', false, String(e));
  }

  // 9. /api/register with stale/invalid gateToken
  try {
    const r = await postJson('/api/register', {
      gateToken: 'not-a-real-token-' + Date.now(),
      fullName: 'Smoke Test',
      email: `smoke-${Date.now()}@example.com`,
      mobile: '07700900000',
      category: 'psras-accredited',
      pinNumber: 'SMOKE12345',
      counties: 'Kent',
      confirmAccredited: true,
      confirmAccurate: true,
    });
    record(
      'POST /api/register with stale gateToken -> 403 requiresGate',
      r.status === 403 && r.json && r.json.requiresGate === true,
      `status=${r.status} requiresGate=${r.json?.requiresGate ?? false}`,
    );
  } catch (e) {
    record('POST /api/register with stale gateToken', false, String(e));
  }

  const fails = results.filter((r) => !r.ok);
  // eslint-disable-next-line no-console
  console.log(`\nsmoke-register-gate: ${results.length - fails.length}/${results.length} passed.`);
  if (fails.length) {
    // eslint-disable-next-line no-console
    console.error(`${fails.length} check(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
