import { act, type ReactNode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';
import { LighthouseViewer } from '../src/index.ts';
import { reportLatest } from './fixtures.ts';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

// Renders on the "server", hydrates the HTML in the browser, and returns hydration errors.
async function hydrate(element: ReactNode) {
  const container = document.createElement('div');
  container.innerHTML = renderToString(element);
  document.body.append(container);
  const errors: unknown[] = [];
  await act(async () => {
    hydrateRoot(container, element, {
      onRecoverableError: (error) => errors.push(error),
    });
  });
  return { container, errors };
}

test('hydrates a report object without errors', async () => {
  const { container, errors } = await hydrate(<LighthouseViewer report={reportLatest} />);
  await expect.poll(() => container.querySelectorAll('article.lh-root').length).toBe(1);
  expect(errors).toEqual([]);
});

test('hydrates a src without errors, then loads it in the browser', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json(reportLatest));
  const { container, errors } = await hydrate(<LighthouseViewer src="/reports/hydrate.json" />);
  await expect.poll(() => container.querySelectorAll('article.lh-root').length).toBe(1);
  expect(errors).toEqual([]);
});

test('hydrates a url without errors, then runs PageSpeed in the browser', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    Response.json({ lighthouseResult: reportLatest }),
  );
  const { container, errors } = await hydrate(<LighthouseViewer url="https://www.hydrate.gov" />);
  await expect.poll(() => container.querySelectorAll('article.lh-root').length).toBe(1);
  expect(errors).toEqual([]);
});
