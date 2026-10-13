// Runs Lighthouse against the demo sites and writes their reports, plus a summary index for the
// example site's card grid, to example/public/reports. The Pages workflow runs it on every deploy,
// so the demo always shows fresh reports from the bundled Lighthouse version. A site that fails is
// left out, so one unreachable site does not block the deploy.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const sites = [
  { slug: 'blen', url: 'https://www.blencorp.com/' },
  { slug: 'usa-gov', url: 'https://www.usa.gov/' },
  { slug: 'nasa', url: 'https://www.nasa.gov/' },
  { slug: 'va', url: 'https://www.va.gov/' },
  { slug: 'login-gov', url: 'https://login.gov/' },
  { slug: 'weather-gov', url: 'https://www.weather.gov/' },
];

type Report = {
  lighthouseVersion: string;
  fetchTime: string;
  finalDisplayedUrl: string;
  categories: Record<string, { title: string; score: number | null }>;
  audits: Record<string, { details?: { data?: string } }>;
  runtimeError?: { message: string };
};

const outDir = new URL('../example/public/reports/', import.meta.url);
const packageDir = new URL('../packages/react-lighthouse-viewer/', import.meta.url);
// Start empty, so reports from earlier runs or removed sites are not published.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const index = [];
for (const site of sites) {
  const file = new URL(`${site.slug}.json`, outDir);
  console.log(`Running Lighthouse for ${site.url}`);
  try {
    runLighthouse(site.url, file);
  } catch (error) {
    console.warn(`Skipping ${site.url}: Lighthouse failed. ${String(error)}`);
    rmSync(file, { force: true });
    continue;
  }
  const report: Report = JSON.parse(readFileSync(file, 'utf8'));
  if (report.runtimeError) {
    console.warn(`Skipping ${site.url}: ${report.runtimeError.message}`);
    rmSync(file, { force: true });
    continue;
  }
  index.push({
    slug: site.slug,
    thumbnail: writeThumbnail(site.slug, report),
    url: report.finalDisplayedUrl,
    lighthouseVersion: report.lighthouseVersion,
    fetchTime: report.fetchTime,
    scores: Object.entries(report.categories).map(([id, category]) => ({
      id,
      title: category.title,
      score: category.score,
    })),
  });
}

if (index.length === 0) {
  console.error('Lighthouse failed for every site.');
  process.exit(1);
}
writeFileSync(new URL('index.json', outDir), `${JSON.stringify(index, null, 2)}\n`);

// Saves the page screenshot from the run as a JPEG for the sample card.
function writeThumbnail(slug: string, report: Report) {
  const data = report.audits['final-screenshot']?.details?.data;
  const match = data?.match(/^data:image\/jpeg;base64,(.+)$/);
  if (!match?.[1]) return null;
  const name = `${slug}.jpg`;
  writeFileSync(new URL(name, outDir), Buffer.from(match[1], 'base64'));
  return name;
}

function runLighthouse(url: string, file: URL) {
  execFileSync(
    'pnpm',
    [
      'exec',
      'lighthouse',
      url,
      '--quiet',
      '--output=json',
      `--output-path=${fileURLToPath(file)}`,
      '--chrome-flags=--headless=new --no-sandbox',
    ],
    { cwd: packageDir, stdio: 'inherit' },
  );
}
