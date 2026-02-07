import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        execArgv: ['--max-old-space-size=4096'],
      },
    },
  },
});
