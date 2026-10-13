// The package version must equal the bundled Lighthouse version (see README, "Versioning").
import { readFileSync } from 'node:fs';

const read = (url: URL): { version: string } => JSON.parse(readFileSync(url, 'utf8'));
const pkg = read(new URL('../package.json', import.meta.url));
const lighthouse = read(new URL(import.meta.resolve('lighthouse/package.json')));

if (pkg.version !== lighthouse.version) {
  console.error(
    `react-lighthouse-viewer@${pkg.version} must match the bundled lighthouse@${lighthouse.version}.`,
  );
  process.exit(1);
}
console.log(`OK: react-lighthouse-viewer@${pkg.version} bundles lighthouse@${lighthouse.version}.`);
