// The package's major.minor must equal the bundled Lighthouse's major.minor (see README,
// "Versioning"). The patch number is ours, for component fixes.
import { readFileSync } from 'node:fs';

const read = (url: URL): { version: string } => JSON.parse(readFileSync(url, 'utf8'));
const pkg = read(new URL('../package.json', import.meta.url));
const lighthouse = read(new URL(import.meta.resolve('lighthouse/package.json')));
const majorMinor = (version: string) => version.split('.').slice(0, 2).join('.');

if (majorMinor(pkg.version) !== majorMinor(lighthouse.version)) {
  console.error(
    `@blen/react-lighthouse-viewer@${pkg.version} must have the major.minor of the bundled lighthouse@${lighthouse.version}.`,
  );
  process.exit(1);
}
console.log(
  `OK: @blen/react-lighthouse-viewer@${pkg.version} bundles lighthouse@${lighthouse.version}.`,
);
