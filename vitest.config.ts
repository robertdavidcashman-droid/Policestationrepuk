import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.ts'],
    // Mirror the production environment posture: `LEGACY_REPS_PUBLIC=1` is
    // currently set on Vercel so the static-seed directory remains visible
    // while the new strict publication gate is being rolled out. Without it,
    // `getAllReps()` filters everything out and tests like
    // `data-get-raw-reps.test.ts > getAllReps returns merged directory reps`
    // will fail in CI even though production renders correctly. Set this
    // before module-level constants in `lib/data.ts` are read.
    env: {
      LEGACY_REPS_PUBLIC: '1',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
