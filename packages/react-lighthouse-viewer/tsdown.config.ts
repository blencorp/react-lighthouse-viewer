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
      // `?raw` imports load a file as a string, as Vite does in the tests. The standalone HTML file
      // needs Lighthouse's template and standalone renderer as text.
      name: 'raw-text',
      resolveId: {
        filter: { id: /\?raw$/ },
        async handler(source, importer) {
          const resolved = await this.resolve(source.slice(0, -'?raw'.length), importer);
          return resolved && `${resolved.id}?raw`;
        },
      },
      load: {
        filter: { id: /\?raw$/ },
        handler: (id) =>
          `export default ${JSON.stringify(readFileSync(id.slice(0, -'?raw'.length), 'utf8'))};`,
      },
    },
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
      // The HTML file's code loads only when the user saves, so it stays a chunk of its own.
      if (/\/src\/standalone-html\.ts$|\?raw$/.test(id)) return 'standalone-html';
      return id.endsWith('/src/is-lighthouse-report.ts')
        ? 'is-lighthouse-report'
        : 'lighthouse-viewer';
    },
    chunkFileNames: '[name].js',
    banner: (chunk) => (chunk.name === 'lighthouse-viewer' ? "'use client';" : ''),
  },
});
