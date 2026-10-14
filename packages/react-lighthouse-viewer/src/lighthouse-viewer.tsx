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
import type { LighthouseViewerProps } from './types.ts';
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
    src,
    report,
    fallback,
    errorFallback = defaultErrorFallback,
    ...viewerProps
  } = props;
  const isClient = useIsClient();

  const loading = fallback ?? (
    <output className="lh-viewer-loading">
      {url !== undefined
        ? `Running Lighthouse on ${normalizeUrl(url)}. This can take about 30 seconds.`
        : 'Loading the Lighthouse report.'}
    </output>
  );
  const cacheKey =
    url !== undefined
      ? reportKey({ url, strategy })
      : src !== undefined
        ? reportKey({ src })
        : undefined;
  const resetKey = report ?? cacheKey;

  // `url` and `src` load in the browser only. The server renders the loading state, and so does
  // the first client render, so hydration matches.
  let source = report;
  if (source === undefined) {
    if (!isClient) return loading;
    if (url !== undefined) source = runPageSpeed(url, { apiKey, strategy });
    else if (src !== undefined) source = loadReportFile(src);
    else {
      // TypeScript prevents this; plain JavaScript callers can still get here.
      const error = new TypeError('LighthouseViewer: pass one of `url`, `src` or `report`.');
      return typeof errorFallback === 'function' ? errorFallback(error) : errorFallback;
    }
  }

  return (
    <ErrorBoundary
      resetKey={resetKey}
      // Once the error shows, a later attempt (a remount, or the same source again) loads anew.
      onError={cacheKey === undefined ? undefined : () => forgetReport(cacheKey)}
      fallback={(error) =>
        typeof errorFallback === 'function' ? errorFallback(error) : errorFallback
      }
    >
      <Suspense fallback={loading}>
        <ReportContainer report={source} {...viewerProps} />
      </Suspense>
    </ErrorBoundary>
  );
}

function defaultErrorFallback(error: Error): ReactNode {
  return (
    <div role="alert" className="lh-viewer-error">
      Could not show the Lighthouse report. {error.message}
    </div>
  );
}
