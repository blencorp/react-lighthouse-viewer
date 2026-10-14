import { createRef, StrictMode, useCallback, useDeferredValue, useState } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { type LighthouseReport, LighthouseViewer, lighthouseVersion } from '../src/index.ts';
import { reportLatest, report6, requestUrl } from './fixtures.ts';

// Switches from a saved report to a website through useDeferredValue, like the example site.
function DeferredSwitcher() {
  const [source, setSource] = useState<{ src: string } | { url: string }>({
    src: '/reports/site-f.json',
  });
  const shown = useDeferredValue(source);
  return (
    <>
      <button type="button" onClick={() => setSource({ url: 'https://www.site-g.gov' })}>
        analyze
      </button>
      <LighthouseViewer {...shown} />
    </>
  );
}

const gaugeTitles = (container: HTMLElement) =>
  [...container.querySelectorAll('.lh-scores-header .lh-gauge__label')].map(
    (label) => label.textContent,
  );

describe('LighthouseViewer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders a report from the bundled Lighthouse version', async () => {
    const { container } = await render(<LighthouseViewer report={reportLatest} />);

    expect(container.querySelectorAll('article.lh-root')).toHaveLength(1);
    expect(gaugeTitles(container)).toEqual(
      expect.arrayContaining(['Performance', 'Accessibility', 'Best Practices', 'SEO']),
    );
    expect(container.querySelector('.lh-topbar__url')?.textContent).toContain('example.com');
  });

  test('renders a Lighthouse 6 report through the renderer upgrade', async () => {
    const { container } = await render(<LighthouseViewer report={report6} />);

    expect(container.querySelectorAll('article.lh-root')).toHaveLength(1);
    expect(gaugeTitles(container)).toContain('Performance');
    expect(container.querySelector('.lh-footer__version')?.textContent).toBe(
      report6.lighthouseVersion,
    );
  });

  test('renders one report in StrictMode and clears it on unmount', async () => {
    const screen = await render(
      <StrictMode>
        <LighthouseViewer report={reportLatest} data-testid="viewer" />
      </StrictMode>,
    );
    const viewer = screen.getByTestId('viewer').element();
    expect(viewer.querySelectorAll('article.lh-root')).toHaveLength(1);

    await screen.unmount();
    expect(viewer.querySelectorAll('article.lh-root')).toHaveLength(0);
  });

  test('replaces the report when the report prop changes', async () => {
    const screen = await render(<LighthouseViewer report={reportLatest} />);
    await screen.rerender(<LighthouseViewer report={report6} />);

    const roots = screen.container.querySelectorAll('article.lh-root');
    expect(roots).toHaveLength(1);
    expect(roots[0]?.querySelector('.lh-footer__version')?.textContent).toBe(
      report6.lighthouseVersion,
    );
  });

  test('passes ref and div props to the container', async () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = await render(
      <LighthouseViewer report={reportLatest} ref={ref} className="my-report" id="report" />,
    );

    expect(ref.current).toBe(container.querySelector('#report'));
    expect(ref.current?.className).toBe('my-report');
  });

  test('puts div props on the root element in the loading and error states too', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { promise, resolve } = Promise.withResolvers<Response>();
    vi.spyOn(globalThis, 'fetch').mockReturnValue(promise);
    const screen = await render(
      <LighthouseViewer src="/reports/site-h.json" className="frame" aria-label="Report" />,
    );
    const root = screen.container.querySelector('.frame');
    expect(root?.getAttribute('aria-label')).toBe('Report');
    expect(root?.querySelector('.lh-viewer-loading')).not.toBeNull();

    resolve(new Response('Not found', { status: 404 }));
    await expect.element(screen.getByRole('alert')).toBeVisible();
    expect(screen.container.querySelector('.frame [role=alert]')).not.toBeNull();
  });

  test('passes options to the renderer', async () => {
    const { container } = await render(
      <LighthouseViewer report={reportLatest} options={{ omitTopbar: true }} />,
    );

    expect(container.querySelector('.lh-root')).not.toBeNull();
    expect(container.querySelector('.lh-topbar')).toBeNull();
  });

  test('does not render again for equal option values and stable callbacks', async () => {
    const calls: number[] = [];
    function App() {
      const [count, setCount] = useState(0);
      const onViewTrace = useCallback(() => calls.push(1), []);
      return (
        <>
          <button type="button" onClick={() => setCount(count + 1)}>
            rerender {count}
          </button>
          <LighthouseViewer
            report={reportLatest}
            options={{ disableFireworks: true, onViewTrace }}
          />
        </>
      );
    }
    const screen = await render(<App />);
    const firstRoot = screen.container.querySelector('article.lh-root');

    await screen.getByRole('button', { name: /rerender/ }).click();
    await expect.element(screen.getByRole('button', { name: 'rerender 1' })).toBeVisible();
    expect(screen.container.querySelector('article.lh-root')).toBe(firstRoot);

    // The fixture uses simulated throttling, so the renderer offers the unthrottled trace link.
    screen.container.querySelector<HTMLElement>('a[data-action="view-unthrottled-trace"]')?.click();
    expect(calls).toEqual([1]);
  });

  test('renders again when a callback changes', async () => {
    const screen = await render(
      <LighthouseViewer report={reportLatest} options={{ onViewTrace() {} }} />,
    );
    const firstRoot = screen.container.querySelector('article.lh-root');

    await screen.rerender(
      <LighthouseViewer report={reportLatest} options={{ onViewTrace() {} }} />,
    );
    expect(screen.container.querySelectorAll('article.lh-root')).toHaveLength(1);
    expect(screen.container.querySelector('article.lh-root')).not.toBe(firstRoot);
  });

  test('renders again when an option value changes', async () => {
    const screen = await render(<LighthouseViewer report={reportLatest} />);
    const firstRoot = screen.container.querySelector('article.lh-root');

    await screen.rerender(
      <LighthouseViewer report={reportLatest} options={{ omitTopbar: true }} />,
    );
    expect(screen.container.querySelector('article.lh-root')).not.toBe(firstRoot);
    expect(screen.container.querySelector('.lh-topbar')).toBeNull();
  });

  test('shows the fallback while a report promise loads, then the report', async () => {
    const { promise, resolve } = Promise.withResolvers<LighthouseReport>();
    const screen = await render(
      <LighthouseViewer report={promise} fallback={<p>Loading report</p>} />,
    );
    await expect.element(screen.getByText('Loading report')).toBeVisible();

    resolve(reportLatest);
    await expect.poll(() => screen.container.querySelectorAll('article.lh-root').length).toBe(1);
  });

  test('shows a built-in error for a value that is not a report', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Parsed JSON is untyped, as a user flow report uploaded by a user would be.
    const notAReport = JSON.parse('{"name":"flow","steps":[]}');
    const screen = await render(<LighthouseViewer report={notAReport} />);

    const alert = screen.getByRole('alert');
    await expect.element(alert).toBeVisible();
    expect(alert.element().textContent).toContain(
      'LighthouseViewer: `report` is not a Lighthouse report.',
    );
    expect(screen.container.querySelector('article.lh-root')).toBeNull();
  });

  test('shows the renderer error when a report passes the shape check but cannot render', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // It has the top-level fields that `isLighthouseReport` checks, but nothing the renderer needs.
    const unrenderable = JSON.parse(
      JSON.stringify({ lighthouseVersion, categories: {}, audits: {}, configSettings: {} }),
    );
    const screen = await render(<LighthouseViewer report={unrenderable} />);

    const alert = screen.getByRole('alert');
    await expect.element(alert).toBeVisible();
    expect(alert.element().textContent).toContain('Could not determine final displayed URL');
  });

  test('shows nothing while loading when fallback is null', async () => {
    const { promise } = Promise.withResolvers<LighthouseReport>();
    const screen = await render(<LighthouseViewer report={promise} fallback={null} />);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.container.querySelector('.lh-viewer-loading')).toBeNull();
    expect(screen.container.textContent).toBe('');
  });

  test('uses errorFallback, and recovers when the source changes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const notAReport = JSON.parse('{}');
    const screen = await render(
      <LighthouseViewer
        report={notAReport}
        errorFallback={(error) => <p>Custom error: {error.name}</p>}
      />,
    );
    await expect.element(screen.getByText('Custom error: TypeError')).toBeVisible();

    await screen.rerender(<LighthouseViewer report={reportLatest} />);
    await expect.poll(() => screen.container.querySelectorAll('article.lh-root').length).toBe(1);
  });

  test('loads a saved report from src', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(reportLatest)));
    const screen = await render(<LighthouseViewer src="/reports/site-a.json" />);

    await expect.poll(() => screen.container.querySelectorAll('article.lh-root').length).toBe(1);
    expect(fetch).toHaveBeenCalledWith('/reports/site-a.json');
  });

  test('shows the loading state, then a readable error for a missing src', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { promise, resolve } = Promise.withResolvers<Response>();
    vi.spyOn(globalThis, 'fetch').mockReturnValue(promise);
    const screen = await render(<LighthouseViewer src="/reports/missing.json" />);
    await expect.element(screen.getByText('Loading the Lighthouse report.')).toBeVisible();

    resolve(new Response('Not found', { status: 404 }));
    const alert = screen.getByRole('alert');
    await expect.element(alert).toBeVisible();
    expect(alert.element().textContent).toContain(
      'Could not load /reports/missing.json: HTTP 404.',
    );
  });

  test('loads a relative src again on a different page', async () => {
    const start = location.href;
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json(reportLatest));
    try {
      history.pushState(null, '', '/team-a/');
      const first = await render(<LighthouseViewer src="relative-report.json" />);
      await expect.poll(() => first.container.querySelectorAll('article.lh-root').length).toBe(1);
      await first.unmount();

      history.pushState(null, '', '/team-b/');
      const second = await render(<LighthouseViewer src="relative-report.json" />);
      await expect.poll(() => second.container.querySelectorAll('article.lh-root').length).toBe(1);
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      history.replaceState(null, '', start);
    }
  });

  test('analyzes a website url with PageSpeed Insights', async () => {
    const { promise, resolve } = Promise.withResolvers<Response>();
    const fetch = vi.spyOn(globalThis, 'fetch').mockReturnValue(promise);
    const screen = await render(
      <LighthouseViewer url="www.site-b.gov" apiKey="test-key" strategy="desktop" />,
    );
    await expect
      .element(screen.getByText(/Running Lighthouse on https:\/\/www\.site-b\.gov/))
      .toBeVisible();

    resolve(new Response(JSON.stringify({ lighthouseResult: reportLatest })));
    await expect.poll(() => screen.container.querySelectorAll('article.lh-root').length).toBe(1);

    const request = requestUrl(fetch.mock.calls[0]?.[0]);
    expect(request.origin + request.pathname).toBe(
      'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
    );
    expect(request.searchParams.get('url')).toBe('https://www.site-b.gov');
    expect(request.searchParams.get('key')).toBe('test-key');
    expect(request.searchParams.get('strategy')).toBe('DESKTOP');
    expect(request.searchParams.getAll('category')).toEqual([
      'PERFORMANCE',
      'ACCESSIBILITY',
      'BEST_PRACTICES',
      'SEO',
    ]);
  });

  test('shows a failed request once, without requesting again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () =>
        Response.json({ error: { code: 429, message: 'Quota exceeded' } }, { status: 429 }),
      );
    const screen = await render(<LighthouseViewer url="https://www.site-e.gov" />);

    const alert = screen.getByRole('alert');
    await expect.element(alert).toBeVisible();
    expect(alert.element().textContent).toContain('PageSpeed Insights quota exceeded');
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('does not request again when the parent renders while the error shows', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () =>
        Response.json({ error: { code: 429, message: 'Quota exceeded' } }, { status: 429 }),
      );
    const screen = await render(<LighthouseViewer url="https://www.site-h.gov" />);
    await expect.element(screen.getByRole('alert')).toBeVisible();

    await screen.rerender(<LighthouseViewer url="https://www.site-h.gov" className="report" />);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('loads again with a new apiKey after an error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) =>
        requestUrl(input).searchParams.has('key')
          ? Response.json({ lighthouseResult: reportLatest })
          : Response.json({ error: { code: 429, message: 'Quota exceeded' } }, { status: 429 }),
      );
    const screen = await render(<LighthouseViewer url="https://www.site-i.gov" />);
    await expect.element(screen.getByRole('alert')).toBeVisible();

    await screen.rerender(<LighthouseViewer url="https://www.site-i.gov" apiKey="test-key" />);
    await expect.poll(() => screen.container.querySelectorAll('article.lh-root').length).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('shows an error without requesting again when a deferred source fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) =>
        (typeof input === 'string' ? input : '').includes('site-f')
          ? Response.json(reportLatest)
          : Response.json({ error: { code: 429, message: 'Quota exceeded' } }, { status: 429 }),
      );
    const screen = await render(<DeferredSwitcher />);
    await expect.poll(() => screen.container.querySelectorAll('article.lh-root').length).toBe(1);

    await screen.getByRole('button', { name: 'analyze' }).click();
    await expect.element(screen.getByRole('alert')).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('reuses one request for the same source', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(reportLatest)));
    const screen = await render(
      <>
        <LighthouseViewer src="/reports/site-c.json" />
        <LighthouseViewer src="/reports/site-c.json" />
      </>,
    );

    await expect.poll(() => screen.container.querySelectorAll('article.lh-root').length).toBe(2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('explains a missing source to plain JavaScript callers', async () => {
    // Plain JavaScript can pass no source; parsed JSON models that untyped call.
    const props = JSON.parse('{}');
    const screen = await render(<LighthouseViewer {...props} />);
    const alert = screen.getByRole('alert');
    await expect.element(alert).toBeVisible();
    expect(alert.element().textContent).toContain('pass one of `url`, `src` or `report`');
  });

  test('exports the bundled Lighthouse version', () => {
    expect(lighthouseVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(lighthouseVersion).toBe(reportLatest.lighthouseVersion);
  });

  test('does not log errors while rendering', async () => {
    const error = vi.spyOn(console, 'error');
    await render(<LighthouseViewer report={reportLatest} />);
    expect(error).not.toHaveBeenCalled();
  });
});
