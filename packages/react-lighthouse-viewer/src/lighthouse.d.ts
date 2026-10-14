declare module 'lighthouse/dist/report/bundle.esm.js' {
  import type Renderer from 'lighthouse/report/types/report-renderer.js';
  import type Result from 'lighthouse/types/lhr/lhr.js';

  // The renderer reads each option with a plain truthiness check, so an undefined value is the
  // same as a missing one.
  export function renderReport(
    lhr: Result,
    options?: { [Name in keyof Renderer.Options]?: Renderer.Options[Name] | undefined },
  ): HTMLElement;
}
