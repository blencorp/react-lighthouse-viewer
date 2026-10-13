// Updates the bundled Lighthouse to the given version: the devDependency, the package version,
// the latest sample report and the changelog. Used by the "Lighthouse sync" workflow.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: node scripts/sync-lighthouse.ts <lighthouse version>');
  process.exit(1);
}

const packageDir = new URL('../packages/react-lighthouse-viewer/', import.meta.url);
const run = (command: string, args: string[]) =>
  execFileSync(command, args, { cwd: packageDir, stdio: 'inherit' });

run('pnpm', ['add', '--save-dev', '--save-exact', `lighthouse@${version}`]);
run('npm', ['pkg', 'set', `version=${version}`]);
run('pnpm', [
  'exec',
  'lighthouse',
  'https://example.com',
  '--quiet',
  '--output=json',
  '--output-path=test/fixtures/lh-latest.json',
  '--chrome-flags=--headless=new --no-sandbox',
]);

const changelogUrl = new URL('../CHANGELOG.md', import.meta.url);
const changelog = readFileSync(changelogUrl, 'utf8');
const entry = `## ${version}\n\n- Bundle Lighthouse ${version}.\n\n`;
writeFileSync(changelogUrl, changelog.replace(/^## /m, `${entry}## `));
