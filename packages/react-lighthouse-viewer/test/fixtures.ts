import type { LighthouseReport } from '../src/index.ts';
import lhLatest from './fixtures/lh-latest.json' with { type: 'json' };
import lh6 from './fixtures/lh-6.json' with { type: 'json' };

// JSON imports widen string literal types, so the fixtures need a cast.
export const reportLatest = lhLatest as unknown as LighthouseReport;
export const report6 = lh6 as unknown as LighthouseReport;
