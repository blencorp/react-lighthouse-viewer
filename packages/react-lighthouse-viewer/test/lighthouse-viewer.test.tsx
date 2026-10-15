import { createRef, StrictMode, useCallback, useDeferredValue, useState } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { type LighthouseReport, LighthouseViewer, lighthouseVersion } from '../src/index.ts';
import { report3, report6, report11, reportLatest, requestUrl } from './fixtures.ts';

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

  test.each([
    ['3', report3],
    ['6', report6],
    ['11', report11],
  ])('renders a Lighthouse %s report with its Performance audits', async (_version, report) => {
    const { container } = await render(<LighthouseViewer report={report} />);

    expect(container.querySelectorAll('article.lh-root')).toHaveLength(1);
    expect(gaugeTitles(container)).toContain('Performance');
    expect(container.querySelector('.lh-footer__version')?.textContent).toBe(
      report.lighthouseVersion,
    );
    expect(container.querySelectorAll('#performance .lh-audit').length).toBeGreaterThan(20);
  });

  test('renders the Performance audits of a current report', async () => {
    const { container } = await render(<LighthouseViewer report={reportLatest} />);
    expect(container.querySelectorAll('#performance .lh-audit').length).toBeGreaterThan(20);
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

  test('saves an old report as JSON without the group that the component adds', async () => {
    const saved = Promise.withResolvers<string>();
    const screen = await render(
      <LighthouseViewer
        report={report3}
        options={{ onSaveFileOverride: async (blob) => saved.resolve(await blob.text()) }}
      />,
    );
    await screen.getByRole('button', { name: 'Toggle report tools menu' }).click();
    await screen.getByRole('menuitem', { name: 'Save as JSON' }).click();

    expect(JSON.parse(await saved.promise)).toEqual(report3);
  });

  test('downloads the JSON file when there is no onSaveFileOverride', async () => {
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push(this.download);
    });
    const screen = await render(<LighthouseViewer report={report3} />);
    await screen.getByRole('button', { name: 'Toggle report tools menu' }).click();
    await screen.getByRole('menuitem', { name: 'Save as JSON' }).click();

    await expect.poll(() => downloads).toEqual([expect.stringMatching(/\.json$/)]);
  });

  test('saves the report as an HTML file that renders on its own', async () => {
    const saved = Promise.withResolvers<{ blob: Blob; filename: string }>();
    const screen = await render(
      <LighthouseViewer
        report={report6}
        options={{
          onSaveFileOverride: async (blob, filename) => saved.resolve({ blob, filename }),
        }}
      />,
    );
    await screen.getByRole('button', { name: 'Toggle report tools menu' }).click();
    await screen.getByRole('menuitem', { name: 'Save as HTML' }).click();

    const { blob, filename } = await saved.promise;
    expect(filename).toMatch(/\.html$/);
    expect(blob.type).toBe('text/html');
    const html = await blob.text();
    expect(html).toContain('__initLighthouseReport__();');

    // The file renders with Lighthouse's own standalone renderer, with the Performance audits of
    // this Lighthouse 6 report.
    const frame = document.createElement('iframe');
    frame.srcdoc = html;
    document.body.append(frame);
    try {
      await expect
        .poll(() => frame.contentDocument?.querySelectorAll('#performance .lh-audit').length ?? 0)
        .toBeGreaterThan(20);
      expect(frame.contentDocument?.querySelector('.lh-footer__version')?.textContent).toBe(
        report6.lighthouseVersion,
      );
    } finally {
      frame.remove();
    }
  });

  test('downloads the HTML file when there is no onSaveFileOverride', async () => {
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push(this.download);
    });
    const screen = await render(<LighthouseViewer report={reportLatest} />);
    await screen.getByRole('button', { name: 'Toggle report tools menu' }).click();
    await screen.getByRole('menuitem', { name: 'Save as HTML' }).click();

    await expect.poll(() => downloads).toEqual([expect.stringMatching(/\.html$/)]);
  });

  test("keeps the app's own getStandaloneReportHTML and passes JSON through", async () => {
    const files: { type: string; text: string }[] = [];
    const screen = await render(
      <LighthouseViewer
        report={reportLatest}
        options={{
          getStandaloneReportHTML: () => '<p>From the app</p>',
          onSaveFileOverride: async (blob) => {
            files.push({ type: blob.type, text: await blob.text() });
          },
        }}
      />,
    );
    const tools = screen.getByRole('button', { name: 'Toggle report tools menu' });
    await tools.click();
    await screen.getByRole('menuitem', { name: 'Save as HTML' }).click();
    await tools.click();
    await screen.getByRole('menuitem', { name: 'Save as JSON' }).click();

    await expect.poll(() => files.length).toBe(2);
    expect(files[0]).toEqual({ type: 'text/html', text: '<p>From the app</p>' });
    expect(files[1]?.type).toBe('application/json');
    expect(JSON.parse(files[1]?.text ?? '')).toMatchObject({
      lighthouseVersion: reportLatest.lighthouseVersion,
    });
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
    // Parsed JSON is untyped, as a file uploaded by a user would be.
    const notAReport = JSON.parse('{"name":"not a report"}');
    const screen = await render(<LighthouseViewer report={notAReport} />);

    const alert = screen.getByRole('alert');
    await expect.element(alert).toBeVisible();
    expect(alert.element().textContent).toContain(
      'LighthouseViewer: `report` is not a Lighthouse report.',
    );
    expect(screen.container.querySelector('article.lh-root')).toBeNull();
  });

  test('explains that a user flow report needs one step', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const flow = JSON.parse(JSON.stringify({ name: 'flow', steps: [{ lhr: reportLatest }] }));
    const screen = await render(<LighthouseViewer report={flow} />);

    const alert = screen.getByRole('alert');
    await expect.element(alert).toBeVisible();
    expect(alert.element().textContent).toContain(
      '`report` is a Lighthouse user flow report, which LighthouseViewer cannot show. Pass one step instead, for example `report={flow.steps[0].lhr}`.',
    );
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

  test('requests a src once in StrictMode', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json(reportLatest));
    const screen = await render(
      <StrictMode>
        <LighthouseViewer src="/reports/strict.json" />
      </StrictMode>,
    );
    await expect.poll(() => screen.container.querySelectorAll('article.lh-root').length).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('shows the error of a rejected report promise', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const screen = await render(
      <LighthouseViewer report={Promise.reject(new Error('The report store is offline.'))} />,
    );
    const alert = screen.getByRole('alert');
    await expect.element(alert).toBeVisible();
    expect(alert.element().textContent).toContain('The report store is offline.');
  });

  test('leaves the query string out of src error messages', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Forbidden', { status: 403 }));
    const screen = await render(
      <LighthouseViewer src="https://storage.example/report.json?signature=secret" />,
    );
    const alert = screen.getByRole('alert');
    await expect.element(alert).toBeVisible();
    expect(alert.element().textContent).toContain(
      'Could not load https://storage.example/report.json: HTTP 403.',
    );
    expect(alert.element().textContent).not.toContain('secret');
  });

  test('analyzes a website url with PageSpeed Insights', async () => {
    const { promise, resolve } = Promise.withResolvers<Response>();
    const fetch = vi.spyOn(globalThis, 'fetch').mockReturnValue(promise);
    const screen = await render(
      <LighthouseViewer url="www.site-b.gov" apiKey="test-key" strategy="desktop" locale="de" />,
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
    expect(request.searchParams.get('locale')).toBe('de');
    expect(request.searchParams.getAll('category')).toEqual([
      'PERFORMANCE',
      'ACCESSIBILITY',
      'BEST_PRACTICES',
      'SEO',
      'AGENTIC_BROWSING',
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
