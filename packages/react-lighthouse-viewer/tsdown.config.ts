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
  outputOptions: {
    // React Server Components treat every export of a 'use client' file as client-only. So the
    // component and the renderer go in a 'use client' chunk, and `index.js` and the type guard stay
    // plain, so Server Components can call `isLighthouseReport` and read `lighthouseVersion`.
    manualChunks: (id) => {
      // Declaration modules go through this build too; leave them to the declaration output.
      if (/\.d\.ts$|\/src\/index\.ts$|\/lighthouse\/package\.json$/.test(id)) return undefined;
      return id.endsWith('/src/is-lighthouse-report.ts')
        ? 'is-lighthouse-report'
        : 'lighthouse-viewer';
    },
    chunkFileNames: '[name].js',
    banner: (chunk) => (chunk.name === 'lighthouse-viewer' ? "'use client';" : ''),
  },
});
