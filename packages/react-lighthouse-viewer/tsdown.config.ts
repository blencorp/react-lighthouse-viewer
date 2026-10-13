import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  dts: true,
  // Only the Lighthouse renderer (and its types) may be bundled; React stays a peer.
  deps: { onlyBundle: ['lighthouse', 'devtools-protocol'] },
  plugins: [
    {
      // Lighthouse's report types use one Chrome DevTools Protocol type. This loads a small
      // stand-in so the 600 KB protocol typings stay out of the published declarations.
      name: 'devtools-protocol-types-shim',
      load: {
        filter: { id: /devtools-protocol[\\/]types[\\/]protocol\.d\.ts$/ },
        handler: () =>
          readFileSync(new URL('src/shims/devtools-protocol.d.ts', import.meta.url), 'utf8'),
      },
    },
  ],
  // Next.js and other RSC frameworks need this to treat the component as client-only.
  banner: "'use client';",
});
