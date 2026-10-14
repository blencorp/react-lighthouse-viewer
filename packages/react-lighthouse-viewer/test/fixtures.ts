import { isLighthouseReport, type LighthouseReport } from '../src/index.ts';
import lhLatest from './fixtures/lh-latest.json' with { type: 'json' };
import lh6 from './fixtures/lh-6.json' with { type: 'json' };

// JSON imports widen string literal types, so the fixtures go through the runtime check instead.
function asReport(json: unknown): LighthouseReport {
  if (!isLighthouseReport(json)) throw new Error('The fixture is not a Lighthouse report.');
  return json;
}

export const reportLatest = asReport(lhLatest);
export const report6 = asReport(lh6);

/** The URL that `runPageSpeed` passed to `fetch`. */
export function requestUrl(input: unknown): URL {
  if (!(input instanceof URL)) throw new Error('Expected fetch to get a URL.');
  return input;
}
