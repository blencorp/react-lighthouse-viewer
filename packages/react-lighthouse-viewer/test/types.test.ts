import { expectTypeOf, test } from 'vitest';
import type { LighthouseViewerProps } from '../src/index.ts';
import { reportLatest } from './fixtures.ts';

// These checks run in `pnpm typecheck`. Each `@ts-expect-error` line must fail to compile.
test('LighthouseViewer takes exactly one source', () => {
  expectTypeOf({ url: 'https://www.blencorp.com', apiKey: 'k' }).toExtend<LighthouseViewerProps>();
  expectTypeOf({ src: '/report.json' }).toExtend<LighthouseViewerProps>();
  expectTypeOf({ report: reportLatest }).toExtend<LighthouseViewerProps>();

  // @ts-expect-error a source is required
  const none: LighthouseViewerProps = {};
  // @ts-expect-error only one source
  const two: LighthouseViewerProps = { src: '/report.json', report: reportLatest };
  // @ts-expect-error apiKey only goes with url
  const keyWithSrc: LighthouseViewerProps = { src: '/report.json', apiKey: 'k' };
  // @ts-expect-error strategy is mobile or desktop
  const tablet: LighthouseViewerProps = { url: 'https://www.blencorp.com', strategy: 'tablet' };
  void [none, two, keyWithSrc, tablet];
});
