// Makes the example site's sample reports in example/public/reports: one Lighthouse report and one
// screenshot for each demo site, plus a summary index for the card grid. The Pages workflow runs it
// on every deploy and every week. A site that fails is left out, so one unreachable site does not
// block the deploy.
//
// The reports come from PageSpeed Insights, the same service the `url` prop and the example's
// Analyze box use, so a sample card and a new analysis of the same site measure the same way.
// Lighthouse run on a CI machine scores Performance much lower, because those machines are slow
// and shared. Set PAGESPEED_API_KEY to a key that may call the API from a server.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

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
  categories: Record<string, { score: number | null }>;
  runtimeError?: { message: string };
};

const outDir = new URL('../example/public/reports/', import.meta.url);
// Start empty, so reports from earlier runs or removed sites are not published.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const index = [];
try {
  for (const site of sites) {
    console.log(`Analyzing ${site.url}`);
    let report: Report;
    try {
      report = await runPageSpeed(site.url);
    } catch (error) {
      console.warn(`Skipping ${site.url}: ${String(error)}`);
      continue;
    }
    writeFileSync(new URL(`${site.slug}.json`, outDir), JSON.stringify(report));
    index.push({
      slug: site.slug,
      thumbnail: await screenshot(site.slug, site.url),
      url: report.finalDisplayedUrl,
      lighthouseVersion: report.lighthouseVersion,
      fetchTime: report.fetchTime,
      scores: Object.entries(report.categories).map(([id, category]) => ({
        id,
        score: category.score,
      })),
    });
  }
} finally {
  await browser.close();
}

if (index.length === 0) {
  console.error('PageSpeed Insights failed for every site.');
  process.exit(1);
}
writeFileSync(new URL('index.json', outDir), `${JSON.stringify(index, null, 2)}\n`);

async function runPageSpeed(url: string): Promise<Report> {
  const request = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  request.searchParams.set('url', url);
  request.searchParams.set('strategy', 'MOBILE');
  // The same categories as the component's `url` source.
  for (const category of [
    'PERFORMANCE',
    'ACCESSIBILITY',
    'BEST_PRACTICES',
    'SEO',
    'AGENTIC_BROWSING',
  ]) {
    request.searchParams.append('category', category);
  }
  const key = process.env['PAGESPEED_API_KEY'];
  if (key) request.searchParams.set('key', key);

  // A run takes 10 to 30 seconds. A hung request would otherwise hold the Pages job.
  const response = await fetch(request, { signal: AbortSignal.timeout(120_000) });
  const body: { lighthouseResult?: Report; error?: { message?: string } } = await response.json();
  if (!response.ok || !body.lighthouseResult) {
    throw new Error(`HTTP ${response.status}: ${body.error?.message ?? 'no Lighthouse result'}`);
  }
  if (body.lighthouseResult.runtimeError) {
    throw new Error(body.lighthouseResult.runtimeError.message);
  }
  return body.lighthouseResult;
}

// A desktop screenshot of the top of the page for the sample card. Lighthouse's own screenshot is
// a small, compressed phone view, which looks blurry on the card.
async function screenshot(slug: string, url: string) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    // 768 by 480 pixels: sharp on a high-density screen at the card's size, and small to load.
    deviceScaleFactor: 0.6,
  });
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
    // Let fonts, hero images and entry animations settle.
    await page.waitForTimeout(2_000);
    const name = `${slug}.jpg`;
    await page.screenshot({
      path: fileURLToPath(new URL(name, outDir)),
      type: 'jpeg',
      quality: 80,
    });
    return name;
  } catch (error) {
    console.warn(`No screenshot for ${url}: ${String(error)}`);
    return null;
  } finally {
    await page.close();
  }
}
