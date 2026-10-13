import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['test/**/*.test.tsx'],
          exclude: ['test/**/*.ssr.test.tsx'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'ssr',
          include: ['test/**/*.ssr.test.tsx', 'test/**/*.test.ts'],
          typecheck: { enabled: true, include: ['test/**/*.test.ts'] },
          environment: 'node',
        },
      },
    ],
  },
});
