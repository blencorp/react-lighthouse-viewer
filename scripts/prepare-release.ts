// Prepares the next release: bundles the given Lighthouse version (or keeps the current one),
// picks the next package version, and turns the changelog's "Unreleased" section into that
// version's entry. Used by the "Release pull request" workflow.
//
// The package's major.minor always equals the bundled Lighthouse's major.minor. The patch number
// is ours, so a component fix can ship without waiting for Lighthouse (see README, "Versioning").
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const packageDir = new URL('../packages/react-lighthouse-viewer/', import.meta.url);
const pkg: { version: string; devDependencies: { lighthouse: string } } = JSON.parse(
  readFileSync(new URL('package.json', packageDir), 'utf8'),
);
const bundled = pkg.devDependencies.lighthouse;
const lighthouse = process.argv[2] ?? bundled;
if (!/^\d+\.\d+\.\d+$/.test(lighthouse)) {
  console.error('Usage: node scripts/prepare-release.ts [lighthouse version]');
  process.exit(1);
}

const [major, minor, patch] = pkg.version.split('.').map(Number);
const [lhMajor, lhMinor] = lighthouse.split('.').map(Number);
const version =
  major === lhMajor && minor === lhMinor
    ? `${major}.${minor}.${(patch ?? 0) + 1}`
    : `${lhMajor}.${lhMinor}.0`;

const run = (command: string, args: string[]) =>
  execFileSync(command, args, { cwd: packageDir, stdio: 'inherit' });

const updatesLighthouse = lighthouse !== bundled;
const changelogUrl = new URL('../CHANGELOG.md', import.meta.url);
const changelog = readFileSync(changelogUrl, 'utf8');
if (!updatesLighthouse && !/## Unreleased\n\n- /.test(changelog)) {
  console.error('Nothing to release: Lighthouse is current and "## Unreleased" lists no changes.');
  process.exit(1);
}
if (updatesLighthouse) {
  run('pnpm', ['add', '--save-dev', '--save-exact', `lighthouse@${lighthouse}`]);
  run('pnpm', [
    'exec',
    'lighthouse',
    'https://example.com',
    '--quiet',
    '--output=json',
    '--output-path=test/fixtures/lh-latest.json',
    '--chrome-flags=--headless=new --no-sandbox',
  ]);
}
run('npm', ['pkg', 'set', `version=${version}`]);

const bundleLine = updatesLighthouse ? `- Bundle Lighthouse ${lighthouse}.\n` : '';
writeFileSync(
  changelogUrl,
  changelog.includes('## Unreleased\n\n')
    ? changelog.replace('## Unreleased\n\n', `## ${version}\n\n${bundleLine}`)
    : changelog.replace(/^## /m, `## ${version}\n\n${bundleLine}\n## `),
);

console.log(`Prepared ${version} with Lighthouse ${lighthouse}.`);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\nlighthouse=${lighthouse}\n`);
}
