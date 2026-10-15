import { renderReport } from 'lighthouse/dist/report/bundle.esm.js';
import { use, useCallback } from 'react';
import { flowResultHint, isFlowResult, isLighthouseReport } from './is-lighthouse-report.ts';
import type { LighthouseReport, RendererOptions, ViewerProps } from './types.ts';

// Every renderer option, each required. If a Lighthouse update adds an option, the object below
// stops compiling until the component passes the new option too.
type AllRendererOptions = { [Name in keyof Required<RendererOptions>]: RendererOptions[Name] };

type ReportContainerProps = Pick<ViewerProps, 'options'> & {
  load: () => LighthouseReport | Promise<LighthouseReport>;
};

/** Loads the report (suspending until a promise resolves) and renders it with the official Lighthouse report renderer. */
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
    (container: HTMLDivElement | null) => {
      // React calls the ref with null when an earlier call threw before it returned its cleanup.
      // Returning here lets the error boundary show the renderer's own error.
      if (container === null) return undefined;
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
      container.replaceChildren(renderReport(withInsightsGroup(resolved), rendererOptions));
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
  if (isFlowResult(resolved)) throw new TypeError(`LighthouseViewer: \`report\` ${flowResultHint}`);
  if (!isLighthouseReport(resolved)) {
    throw new TypeError(
      'LighthouseViewer: `report` is not a Lighthouse report. It needs `lighthouseVersion`, `categories`, `audits` and `configSettings`.',
    );
  }

  return <div ref={renderInto} />;
}

// The renderer lists the Performance audits only when the report has both an `insights` and a
// `diagnostics` group. Lighthouse added `insights` in 12.6, and the renderer's upgrade of older
// reports does not add it, so their Performance section would show no audits. An empty group is
// enough, because the renderer shows a group only when it holds an audit.
function withInsightsGroup(report: LighthouseReport): LighthouseReport {
  if (!report.categories['performance'] || report.categoryGroups?.['insights']) return report;
  return { ...report, categoryGroups: { ...report.categoryGroups, insights: { title: '' } } };
}
