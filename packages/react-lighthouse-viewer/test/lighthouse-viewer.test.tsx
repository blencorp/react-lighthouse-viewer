import { createRef, StrictMode, useCallback, useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { LighthouseViewer, lighthouseVersion } from '../src/index.ts';
import { reportLatest, report6 } from './fixtures.ts';

const gaugeTitles = (container: HTMLElement) =>
  [...container.querySelectorAll('.lh-scores-header .lh-gauge__label')].map(
    (label) => label.textContent,
  );

describe('LighthouseViewer', () => {
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
    expect(viewer.childElementCount).toBe(0);
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
