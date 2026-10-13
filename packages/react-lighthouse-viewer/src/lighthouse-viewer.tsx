import { renderReport } from 'lighthouse/dist/report/bundle.esm.js';
import { useCallback, useImperativeHandle, useRef } from 'react';
import type { LighthouseViewerProps } from './types.ts';

/** Renders a Lighthouse report with the official Lighthouse report renderer. */
export function LighthouseViewer({ report, options = {}, ref, ...props }: LighthouseViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => containerRef.current!, []);

  const {
    getStandaloneReportHTML,
    onPageAnchorRendered,
    onPrintOverride,
    onSaveFileOverride,
    onViewTrace,
    ...values
  } = options;
  // Compare option values, not the options object, so an inline `options={{ ... }}` does not
  // render the report again on every render.
  const valuesKey = JSON.stringify(values);

  // React calls the cleanup and then this callback again when one of its dependencies changes.
  const renderInto = useCallback(
    (container: HTMLDivElement) => {
      containerRef.current = container;
      const rendered = renderReport(report, {
        ...JSON.parse(valuesKey),
        getStandaloneReportHTML,
        onPageAnchorRendered,
        onPrintOverride,
        onSaveFileOverride,
        onViewTrace,
      });
      container.replaceChildren(rendered);
      return () => container.replaceChildren();
    },
    [
      report,
      valuesKey,
      getStandaloneReportHTML,
      onPageAnchorRendered,
      onPrintOverride,
      onSaveFileOverride,
      onViewTrace,
    ],
  );

  return <div {...props} ref={renderInto} />;
}
