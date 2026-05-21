import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const routePath = path.resolve(__dirname, '..', 'app', 'api', 'register', 'route.ts');
const source = fs.readFileSync(routePath, 'utf-8');

describe('register route — duplicate-rep guard (anti-impersonation)', () => {
  it('imports getRawReps so it can detect static reps with the same email', () => {
    expect(source).toMatch(/import\s*\{[^}]*getRawReps[^}]*\}\s*from\s*['"]@\/lib\/data['"]/);
  });

  it('checks the existing newrep:* KV record before writing', () => {
    expect(source).toMatch(/kv\.get\(\s*['"`]newrep:\$\{[^}]*\}['"`]/);
  });

  it('returns HTTP 409 when the email is already registered', () => {
    expect(source).toMatch(/status:\s*409/);
  });

  it('tells the user to log in to update their listing', () => {
    expect(source).toMatch(/log in/i);
    expect(source).toMatch(/already (registered|in our directory)/i);
  });

  it('rejects before persisting the newrep row', () => {
    // Persistence is delegated to lib/data.ts:saveRegistration (which writes
    // the `newrep:{email}` KV row internally). The guard must precede that
    // call so a duplicate cannot overwrite an existing rep listing.
    const guardIndex = source.search(/kv\.get\(\s*['"`]newrep:/);
    const persistIndex = source.search(/saveRegistration\(/);
    expect(guardIndex).toBeGreaterThan(0);
    expect(persistIndex).toBeGreaterThan(guardIndex);
  });

  it('rejects before sending the admin registration email', () => {
    // Notification has been split into sendRepAutoPublishAdminAlert /
    // sendRepHeldForReviewAlert (depending on the risk outcome). The guard
    // must precede whichever of the two would fire.
    const guardIndex = source.search(/kv\.get\(\s*['"`]newrep:/);
    const sendIndex = source.search(/sendRep(AutoPublishAdminAlert|HeldForReviewAlert)\(/);
    expect(guardIndex).toBeGreaterThan(0);
    expect(sendIndex).toBeGreaterThan(guardIndex);
  });

  it('also rejects when the email matches a static rep in data/*.json', () => {
    expect(source).toMatch(/getRawReps\(\)/);
    expect(source).toMatch(/r\.email\.toLowerCase\(\)\s*===\s*normalised\.email/);
  });
});
