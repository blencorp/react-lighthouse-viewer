import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import type Renderer from 'lighthouse/report/types/report-renderer.js';
import type Result from 'lighthouse/types/lhr/lhr.js';

/**
 * A Lighthouse result (LHR): the JSON that `lighthouse --output=json` writes, or the
 * `lighthouseResult` of a PageSpeed Insights response. Reports from Lighthouse 3 and later render;
 * the renderer upgrades older formats.
 */
export type LighthouseReport = Result;

/** Options for the Lighthouse report renderer. */
export type RendererOptions = Renderer.Options;

/** The device that PageSpeed Insights emulates when it runs Lighthouse. */
export type PageSpeedStrategy = 'mobile' | 'desktop';

/** Analyze a live website. PageSpeed Insights runs Lighthouse on it and returns the report. */
export type UrlSource = {
  /**
   * The website to analyze, for example `"https://www.blencorp.com"`. Without a protocol,
   * `https://` is added. The page must be public, because Google's servers load it.
   */
  url: string;
  /**
   * A PageSpeed Insights API key. Without one, requests share a small public quota that is often
   * used up. In the browser the key is visible, so restrict it to the PageSpeed Insights API and to
   * your site's domain. See
   * https://github.com/blencorp/react-lighthouse-viewer/blob/main/docs/pagespeed-api-key.md
   */
  apiKey?: string | undefined;
  /**
   * The device to emulate.
   * @default "mobile"
   */
  strategy?: PageSpeedStrategy | undefined;
  /**
   * The language of the report, for example `"de"` or `"pt-BR"`. PageSpeed Insights translates
   * the report text and formats numbers for this locale.
   * @default "en-US"
   */
  locale?: string | undefined;
  src?: undefined;
  report?: undefined;
};

/** Show a saved Lighthouse JSON report from a URL. */
export type SrcSource = {
  /**
   * The URL of a Lighthouse JSON report, for example `"/reports/site.json"`. A URL on another
   * origin must allow cross-origin requests (CORS).
   */
  src: string;
  url?: undefined;
  apiKey?: undefined;
  strategy?: undefined;
  locale?: undefined;
  report?: undefined;
};

/** Show a report that the app already has. */
export type ReportSource = {
  /**
   * A Lighthouse report, or a promise of one. Create a promise outside render (in an event
   * handler, a router loader, or a Server Component), so it stays the same between renders.
   */
  report: LighthouseReport | Promise<LighthouseReport>;
  url?: undefined;
  apiKey?: undefined;
  strategy?: undefined;
  locale?: undefined;
  src?: undefined;
};

/** Props that every source shares. */
export type ViewerProps = {
  /** Options for the Lighthouse report renderer, such as `disableDarkMode` or `omitTopbar`. */
  options?: RendererOptions | undefined;
  /**
   * Shown while the report loads (`url`, `src`, or a `report` promise).
   * @default a short status message
   */
  fallback?: ReactNode | undefined;
  /**
   * Shown when the report cannot load or render. A function receives the error.
   * @default a short alert with the error message
   */
  errorFallback?: ReactNode | ((error: Error) => ReactNode) | undefined;
  /** Ref to the root element, which holds the loading state, the error, or the report. */
  ref?: Ref<HTMLDivElement>;
  // Other div props go to the root element. It renders its own children.
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'dangerouslySetInnerHTML'>;

/** Pass exactly one of `url`, `src` or `report`. */
export type LighthouseViewerProps = (UrlSource | SrcSource | ReportSource) & ViewerProps;
