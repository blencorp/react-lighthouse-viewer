import { renderToString } from 'react-dom/server';
import { expect, test } from 'vitest';
import { LighthouseViewer } from '../src/index.ts';
import { reportLatest } from './fixtures.ts';

test('server rendering outputs the empty container', () => {
  expect(renderToString(<LighthouseViewer report={reportLatest} className="report" />)).toBe(
    '<div class="report"></div>',
  );
});
