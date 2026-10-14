import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Pre-bundled up front: Vite reloads the browser when it finds a new dependency during a run,
  // and that reload fails the test file it interrupted.
  optimizeDeps: { include: ['react-dom/client', 'react-dom/server'] },
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
          environment: 'node',
        },
      },
    ],
  },
});
