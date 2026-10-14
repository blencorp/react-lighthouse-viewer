import { renderToString } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { LighthouseViewer } from '../src/index.ts';
import { reportLatest } from './fixtures.ts';

test('server rendering outputs the root element and an empty report container', () => {
  const html = renderToString(<LighthouseViewer report={reportLatest} className="report" />);
  expect(html).toMatch(/^<div class="report">.*<div><\/div>.*<\/div>$/);
});

test('server rendering shows the loading state for url and src, and does not fetch', () => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  expect(renderToString(<LighthouseViewer url="https://www.site-d.gov" className="report" />)).toBe(
    '<div class="report"><output class="lh-viewer-loading">Running Lighthouse on https://www.site-d.gov. This can take about 30 seconds.</output></div>',
  );
  expect(renderToString(<LighthouseViewer src="/reports/site-d.json" />)).toContain(
    'Loading the Lighthouse report.',
  );
  expect(fetch).not.toHaveBeenCalled();
});
