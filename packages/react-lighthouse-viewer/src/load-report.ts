import { isLighthouseReport, isObject } from './is-lighthouse-report.ts';
import type { LighthouseReport, PageSpeedStrategy } from './types.ts';

const pageSpeedEndpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const keyGuide =
  'https://github.com/blencorp/react-lighthouse-viewer/blob/main/docs/pagespeed-api-key.md';
const pageSpeedCategories = ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO'];

// React's `use` needs the same promise on every render, so each source keeps one promise. A failed
// promise stays cached until its error is on screen: React retries a render after an error, and a
// new promise at that point would start a new request every time. `forgetReport` then clears it,
// so the next attempt loads again.
const cache = new Map<string, Promise<LighthouseReport>>();

function cached(key: string, load: () => Promise<LighthouseReport>) {
  let promise = cache.get(key);
  if (!promise) {
    promise = load();
    cache.set(key, promise);
  }
  return promise;
}

/** The cache key of a `src` or `url` source. */
export function reportKey(
  source:
    | { src: string }
    | { url: string; strategy?: PageSpeedStrategy | undefined; apiKey?: string | undefined },
) {
  // The API key is part of the cache key: a request without one can fail on the shared quota, and
  // a key passed after that must load again. A relative `src` such as `report.json` points to a
  // different file on each page, so the key uses the resolved URL. The server has no page URL, but
  // there the key only resets the error boundary, so it does not need to match the browser's.
  if ('src' in source) {
    return `src:${typeof document === 'undefined' ? source.src : new URL(source.src, document.baseURI).href}`;
  }
  return `psi:${source.strategy ?? 'mobile'}:${source.apiKey || ''}:${normalizeUrl(source.url)}`;
}

/** Clears a cached source, so the next render loads it again. */
export function forgetReport(key: string) {
  cache.delete(key);
}

/** Loads a saved Lighthouse JSON report. */
export function loadReportFile(src: string): Promise<LighthouseReport> {
  return cached(reportKey({ src }), async () => {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Could not load ${src}: HTTP ${response.status}.`);
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new Error(`${src} did not return JSON.`);
    }
    if (!isLighthouseReport(json)) throw new Error(`${src} is not a Lighthouse report.`);
    return json;
  });
}

/** Adds `https://` when the URL has no protocol, as people often type `www.example.com`. */
export function normalizeUrl(url: string) {
  const trimmed = url.trim();
  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Runs Lighthouse on a website through the PageSpeed Insights API. */
export function runPageSpeed(
  url: string,
  {
    apiKey,
    strategy = 'mobile',
  }: { apiKey?: string | undefined; strategy?: PageSpeedStrategy | undefined },
): Promise<LighthouseReport> {
  const target = normalizeUrl(url);
  return cached(reportKey({ url, strategy, apiKey }), async () => {
    const request = new URL(pageSpeedEndpoint);
    request.searchParams.set('url', target);
    request.searchParams.set('strategy', strategy.toUpperCase());
    for (const category of pageSpeedCategories) request.searchParams.append('category', category);
    if (apiKey) request.searchParams.set('key', apiKey);

    let response: Response;
    try {
      response = await fetch(request);
    } catch {
      // Google sends some refusals (for example a used-up quota) without CORS headers, and the
      // browser reports those as a network error.
      throw new Error(
        `Could not reach PageSpeed Insights. Check the network${apiKey ? '' : ', or pass an `apiKey`'} (see ${keyGuide}).`,
      );
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new Error(pageSpeedError(response.status, body, Boolean(apiKey)));

    const report = isObject(body) ? body['lighthouseResult'] : undefined;
    if (!isLighthouseReport(report)) {
      throw new Error('PageSpeed Insights did not return a Lighthouse report.');
    }
    return report;
  });
}

function pageSpeedError(status: number, body: unknown, hasKey: boolean) {
  const error = isObject(body) && isObject(body['error']) ? body['error'] : undefined;
  const message = typeof error?.['message'] === 'string' ? error['message'] : `HTTP ${status}`;
  if (status === 429 && !hasKey) {
    return `PageSpeed Insights quota exceeded. Pass an \`apiKey\` to use your own quota (see ${keyGuide}).`;
  }
  return `PageSpeed Insights could not analyze the page: ${message}`;
}
