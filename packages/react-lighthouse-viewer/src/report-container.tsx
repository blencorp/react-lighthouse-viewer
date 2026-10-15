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
      const prepared = withInsightsGroup(resolved);
      // Without a `getStandaloneReportHTML` of the app's own, the component makes the HTML file.
      // Save as HTML is in the top bar, and the renderer throws if the option is set without it.
      const builtInHtml = getStandaloneReportHTML === undefined && !omitTopbar;
      const rendererOptions: AllRendererOptions = {
        disableDarkMode,
        disableFireworks,
        disableAutoDarkModeAndFireworks,
        omitTopbar,
        omitGlobalStyles,
        occupyEntireViewport,
        // The menu shows Save as HTML only when this is set. The real file comes from
        // `saveFile`, because the renderer asks for the HTML synchronously.
        getStandaloneReportHTML: builtInHtml ? () => '' : getStandaloneReportHTML,
        onPageAnchorRendered,
        onPrintOverride,
        // The renderer saves files only from the top bar.
        onSaveFileOverride: omitTopbar
          ? onSaveFileOverride
          : (blob, filename) =>
              saveFile(blob, filename, { resolved, prepared, builtInHtml, onSaveFileOverride }),
        onViewTrace,
      };
      container.replaceChildren(renderReport(prepared, rendererOptions));
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

// The renderer passes each file that the user saves (JSON or HTML) to `onSaveFileOverride`, which
// can wait. So the standalone renderer (about 190 kB) loads only when the user saves as HTML.
async function saveFile(
  blob: Blob,
  filename: string,
  {
    resolved,
    prepared,
    builtInHtml,
    onSaveFileOverride,
  }: {
    resolved: LighthouseReport;
    prepared: LighthouseReport;
    builtInHtml: boolean;
    onSaveFileOverride: RendererOptions['onSaveFileOverride'];
  },
) {
  let file = blob;
  // The renderer saves the report that it rendered. The JSON file keeps the report as the app
  // passed it, without the added insights group.
  if (blob.type === 'application/json' && prepared !== resolved) {
    file = new Blob([JSON.stringify(resolved, null, 2)], { type: blob.type });
  }
  if (blob.type === 'text/html' && builtInHtml) {
    const { standaloneReportHtml } = await import('./standalone-html.ts');
    file = new Blob([standaloneReportHtml(prepared)], { type: 'text/html' });
  }
  if (onSaveFileOverride) return onSaveFileOverride(file, filename);
  // The same download as the renderer's own.
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(file);
  // Firefox downloads only from a link that is in the document.
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 500);
}
