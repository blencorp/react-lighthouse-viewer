import { isLighthouseReport, type LighthouseReport } from '../src/index.ts';
import lhLatest from './fixtures/lh-latest.json' with { type: 'json' };
import lh11 from './fixtures/lh-11.json' with { type: 'json' };
import lh3 from './fixtures/lh-3.json' with { type: 'json' };
import lh6 from './fixtures/lh-6.json' with { type: 'json' };

// JSON imports widen string literal types, so the fixtures go through the runtime check instead.
function asReport(json: unknown): LighthouseReport {
  if (!isLighthouseReport(json)) throw new Error('The fixture is not a Lighthouse report.');
  return json;
}

export const reportLatest = asReport(lhLatest);
export const report6 = asReport(lh6);
// The official Lighthouse test reports for 3.0.0 and 11.7.0 (report/test-assets in the Lighthouse
// repo), minified. In the 11.7.0 report, the tested site's Firebase API key in its request URLs is
// replaced by REDACTED, so secret scanners do not flag the repo.
export const report3 = asReport(lh3);
export const report11 = asReport(lh11);

/** The URL that `runPageSpeed` passed to `fetch`. */
export function requestUrl(input: unknown): URL {
  if (!(input instanceof URL)) throw new Error('Expected fetch to get a URL.');
  return input;
}
