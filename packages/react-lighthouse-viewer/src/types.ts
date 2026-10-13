import type { ComponentPropsWithoutRef, Ref } from 'react';
import type Renderer from 'lighthouse/report/types/report-renderer.js';
import type Result from 'lighthouse/types/lhr/lhr.js';

/**
 * A Lighthouse result (LHR), the JSON that `lighthouse --output=json` writes.
 * Reports from Lighthouse 6 and later render; the renderer upgrades older formats.
 */
export type LighthouseReport = Result;

/** Options for the Lighthouse report renderer. */
export type RendererOptions = Renderer.Options;

export type LighthouseViewerProps = {
  /** The Lighthouse result to render. */
  report: LighthouseReport;
  /** Options passed to the Lighthouse report renderer. */
  options?: RendererOptions;
  /** Ref to the container element that holds the rendered report. */
  ref?: Ref<HTMLDivElement>;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;
