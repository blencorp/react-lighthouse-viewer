declare module 'lighthouse/dist/report/bundle.esm.js' {
  import type { LighthouseReport, RendererOptions } from './types.ts';

  export function renderReport(lhr: LighthouseReport, options?: RendererOptions): HTMLElement;
}
