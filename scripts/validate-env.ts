import { validateAutomationEnv } from '../lib/pipeline-env';

const result = validateAutomationEnv();
if (result.ok) {
  console.log('validate-env: OK — all automation prerequisites present');
  process.exit(0);
}

console.error('validate-env: FAILED');
for (const err of result.errors) {
  console.error(`  - ${err}`);
}
process.exit(1);
