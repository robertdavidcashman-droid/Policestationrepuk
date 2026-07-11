import { validateSafeTestEnv } from '../lib/pipeline-env';

const result = validateSafeTestEnv();
if (result.ok) {
  console.log('validate-test-env: OK — safe local gate configuration');
  process.exit(0);
}

console.error('validate-test-env: FAILED');
for (const err of result.errors) {
  console.error(`  - ${err}`);
}
process.exit(1);
