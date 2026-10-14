import { renderToString } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { LighthouseViewer } from '../src/index.ts';
import { reportLatest } from './fixtures.ts';

test('server rendering outputs the empty container for a report', () => {
  expect(renderToString(<LighthouseViewer report={reportLatest} className="report" />)).toContain(
    '<div class="report"></div>',
  );
});

test('server rendering shows the loading state for url and src, and does not fetch', () => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  expect(renderToString(<LighthouseViewer url="https://www.site-d.gov" />)).toContain(
    'Running Lighthouse on https://www.site-d.gov.',
  );
  expect(renderToString(<LighthouseViewer src="/reports/site-d.json" />)).toContain(
    'Loading the Lighthouse report.',
  );
  expect(fetch).not.toHaveBeenCalled();
});
