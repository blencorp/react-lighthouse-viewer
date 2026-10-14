import { expectTypeOf, test } from 'vitest';
import type { LighthouseViewerProps } from '../src/index.ts';
import { reportLatest } from './fixtures.ts';

// These checks run in `pnpm typecheck`.
test('LighthouseViewer takes exactly one source', () => {
  expectTypeOf({ url: 'https://www.blencorp.com', apiKey: 'k' }).toExtend<LighthouseViewerProps>();
  expectTypeOf({ src: '/report.json' }).toExtend<LighthouseViewerProps>();
  expectTypeOf({ report: reportLatest }).toExtend<LighthouseViewerProps>();

  // A source is required, only one source is allowed, `apiKey` goes only with `url`, and
  // `strategy` is mobile or desktop.
  expectTypeOf({}).not.toExtend<LighthouseViewerProps>();
  expectTypeOf({ src: '/report.json', report: reportLatest }).not.toExtend<LighthouseViewerProps>();
  expectTypeOf({ src: '/report.json', apiKey: 'k' }).not.toExtend<LighthouseViewerProps>();
  expectTypeOf({
    url: 'https://www.blencorp.com',
    strategy: 'tablet' as const,
  }).not.toExtend<LighthouseViewerProps>();
});

test('LighthouseViewer accepts undefined for optional props', () => {
  // Consumers with `exactOptionalPropertyTypes` pass values such as `process.env.KEY`.
  expectTypeOf({
    url: 'https://www.blencorp.com',
    apiKey: undefined,
    strategy: undefined,
    options: undefined,
    fallback: undefined,
    errorFallback: undefined,
  }).toExtend<LighthouseViewerProps>();
});

test('LighthouseViewer renders its own children', () => {
  expectTypeOf<LighthouseViewerProps>().not.toHaveProperty('children');
  expectTypeOf<LighthouseViewerProps>().not.toHaveProperty('dangerouslySetInnerHTML');
});
