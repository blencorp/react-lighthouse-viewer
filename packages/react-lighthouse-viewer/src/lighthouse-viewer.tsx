import { type ReactNode, Suspense } from 'react';
import { ErrorBoundary } from './error-boundary.tsx';
import {
  forgetReport,
  loadReportFile,
  normalizeUrl,
  reportKey,
  runPageSpeed,
} from './load-report.ts';
import { ReportContainer } from './report-container.tsx';
import type { LighthouseReport, LighthouseViewerProps } from './types.ts';
import { useIsClient } from './use-is-client.ts';

/**
 * Renders a Lighthouse report with the official Lighthouse report renderer.
 *
 * Pass exactly one source:
 * - `url`: a website to analyze with PageSpeed Insights.
 * - `src`: the URL of a saved Lighthouse JSON report.
 * - `report`: a report object, or a promise of one.
 *
 * @example <LighthouseViewer url="https://www.blencorp.com" apiKey={pageSpeedApiKey} />
 * @example <LighthouseViewer src="/reports/site.json" />
 * @example <LighthouseViewer report={report} />
 */
export function LighthouseViewer(props: LighthouseViewerProps) {
  const {
    url,
    apiKey,
    strategy,
    locale,
    src,
    report,
    fallback,
    errorFallback = defaultErrorFallback,
    options,
    ref,
    ...rootProps
  } = props;
  const isClient = useIsClient();

  // `fallback={null}` shows nothing, as with `<Suspense fallback={null}>`.
  const loading =
    fallback !== undefined ? (
      fallback
    ) : (
      <output className="lh-viewer-loading">
        {url !== undefined
          ? `Running Lighthouse on ${normalizeUrl(url)}. This can take about 30 seconds.`
          : 'Loading the Lighthouse report.'}
      </output>
    );
  const showError = (error: Error) =>
    typeof errorFallback === 'function' ? errorFallback(error) : errorFallback;

  // `url` and `src` load in the browser only. The server renders the loading state, and so does
  // the first client render, so hydration matches. The load runs inside the error boundary, so a
  // render while the error shows starts no request.
  let load: (() => LighthouseReport | Promise<LighthouseReport>) | undefined;
  let cacheKey: string | undefined;
  if (report !== undefined) {
    load = () => report;
  } else if (url !== undefined) {
    cacheKey = reportKey({ url, strategy, locale, apiKey });
    load = () => runPageSpeed(url, { apiKey, strategy, locale });
  } else if (src !== undefined) {
    cacheKey = reportKey({ src });
    load = () => loadReportFile(src);
  }

  let content: ReactNode;
  if (load === undefined) {
    // TypeScript prevents this; plain JavaScript callers can still get here.
    content = showError(new TypeError('LighthouseViewer: pass one of `url`, `src` or `report`.'));
  } else if (report === undefined && !isClient) {
    content = loading;
  } else {
    content = (
      <ErrorBoundary
        resetKey={report ?? cacheKey}
        // Once the error shows, a later attempt (a remount, or the same source again) loads anew.
        onError={cacheKey === undefined ? undefined : () => forgetReport(cacheKey)}
        fallback={showError}
      >
        <Suspense fallback={loading}>
          <ReportContainer load={load} options={options} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // The root element takes the div props and ref, and holds the loading state, the error, or the
  // report, so styles and labels apply in every state.
  return (
    <div {...rootProps} ref={ref}>
      {content}
    </div>
  );
}

function defaultErrorFallback(error: Error): ReactNode {
  return (
    <div role="alert" className="lh-viewer-error">
      Could not show the Lighthouse report. {error.message}
    </div>
  );
}
