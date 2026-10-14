// Packs the package, installs the tarball with the given package manager in a new project, and
// imports it. CI runs this for npm, pnpm, yarn and bun.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const managers: Record<string, string[]> = {
  npm: ['install', '--no-audit', '--no-fund'],
  pnpm: ['add'],
  yarn: ['add'],
  bun: ['add'],
};

const manager = process.argv[2] ?? '';
const addCommand = managers[manager];
if (!addCommand) {
  console.error(`Usage: node scripts/check-install.ts <${Object.keys(managers).join('|')}>`);
  process.exit(1);
}

const packageDir = fileURLToPath(new URL('../packages/react-lighthouse-viewer/', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), `check-install-${manager}-`));
const run = (command: string, args: string[], cwd: string) =>
  execFileSync(command, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString();

run('pnpm', ['pack', '--pack-destination', dir], packageDir);
const tarball = readdirSync(dir).find((file) => file.endsWith('.tgz'));
if (!tarball) throw new Error('pnpm pack did not write a tarball.');

writeFileSync(
  join(dir, 'package.json'),
  '{ "name": "check-install", "private": true, "type": "module" }',
);
writeFileSync(
  join(dir, 'check.js'),
  `const m = await import('@blen/react-lighthouse-viewer');
if (typeof m.LighthouseViewer !== 'function' || typeof m.isLighthouseReport !== 'function') {
  throw new Error('Missing exports: ' + Object.keys(m).join(', '));
}
console.log('${manager}: imports @blen/react-lighthouse-viewer, bundles Lighthouse ' + m.lighthouseVersion);
`,
);
run(manager, [...addCommand, 'react@19', 'react-dom@19', `./${tarball}`], dir);
process.stdout.write(run(manager === 'bun' ? 'bun' : 'node', ['check.js'], dir));
