import template from 'lighthouse/report/assets/standalone-template.html?raw';
import rendererScript from 'lighthouse/dist/report/standalone.js?raw';
import type { LighthouseReport } from './types.ts';

/**
 * The report as one HTML file that works offline, as `lighthouse --output=html` writes it: the
 * report JSON and the standalone renderer inlined in Lighthouse's own template.
 */
export function standaloneReportHtml(report: LighthouseReport): string {
  // The same escapes as Lighthouse's ReportGenerator, so that neither the JSON nor the script can
  // close its <script> element early.
  const json = JSON.stringify(report)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  const script = rendererScript.replace(/<\//g, '\\u003c/');
  // One pass, so that text inside the JSON or the script is never read as a placeholder. The
  // script itself contains `%%LIGHTHOUSE_JSON%%`.
  return template.replace(/%%LIGHTHOUSE_(JSON|JAVASCRIPT)%%/g, (_match, name) =>
    name === 'JSON' ? json : script,
  );
}
