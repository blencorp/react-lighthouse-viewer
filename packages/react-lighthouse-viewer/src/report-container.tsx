import { renderReport } from 'lighthouse/dist/report/bundle.esm.js';
import { use, useCallback } from 'react';
import { isLighthouseReport } from './is-lighthouse-report.ts';
import type { LighthouseReport, RendererOptions, ViewerProps } from './types.ts';

// Every renderer option, each required. If a Lighthouse update adds an option, the object below
// stops compiling until the component passes the new option too.
type AllRendererOptions = { [Name in keyof Required<RendererOptions>]: RendererOptions[Name] };

type ReportContainerProps = Pick<ViewerProps, 'options'> & {
  load: () => LighthouseReport | Promise<LighthouseReport>;
};

/** Renders a resolved report into a `div` with the official Lighthouse report renderer. */
export function ReportContainer({ load, options = {} }: ReportContainerProps) {
  const report = load();
  const resolved = report instanceof Promise ? use(report) : report;

  // Option values are primitives and callbacks are compared by identity, so an inline
  // `options={{ ... }}` object does not render the report again on every render.
  const {
    disableDarkMode,
    disableFireworks,
    disableAutoDarkModeAndFireworks,
    omitTopbar,
    omitGlobalStyles,
    occupyEntireViewport,
    getStandaloneReportHTML,
    onPageAnchorRendered,
    onPrintOverride,
    onSaveFileOverride,
    onViewTrace,
  } = options;

  // React calls the cleanup and then this callback again when one of its dependencies changes.
  const renderInto = useCallback(
    (container: HTMLDivElement) => {
      const rendererOptions: AllRendererOptions = {
        disableDarkMode,
        disableFireworks,
        disableAutoDarkModeAndFireworks,
        omitTopbar,
        omitGlobalStyles,
        occupyEntireViewport,
        getStandaloneReportHTML,
        onPageAnchorRendered,
        onPrintOverride,
        onSaveFileOverride,
        onViewTrace,
      };
      container.replaceChildren(renderReport(resolved, rendererOptions));
      return () => container.replaceChildren();
    },
    [
      resolved,
      disableDarkMode,
      disableFireworks,
      disableAutoDarkModeAndFireworks,
      omitTopbar,
      omitGlobalStyles,
      occupyEntireViewport,
      getStandaloneReportHTML,
      onPageAnchorRendered,
      onPrintOverride,
      onSaveFileOverride,
      onViewTrace,
    ],
  );

  // Fail with a clear message, so an error boundary shows it instead of a renderer internal error.
  if (!isLighthouseReport(resolved)) {
    throw new TypeError(
      'LighthouseViewer: `report` is not a Lighthouse report. It needs `lighthouseVersion`, `categories`, `audits` and `configSettings`.',
    );
  }

  return <div ref={renderInto} />;
}
