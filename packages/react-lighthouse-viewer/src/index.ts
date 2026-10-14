import { version } from 'lighthouse/package.json';

export { isLighthouseReport } from './is-lighthouse-report.ts';
export { LighthouseViewer } from './lighthouse-viewer.tsx';
export type {
  LighthouseReport,
  LighthouseViewerProps,
  PageSpeedStrategy,
  RendererOptions,
  ReportSource,
  SrcSource,
  UrlSource,
  ViewerProps,
} from './types.ts';

/** The Lighthouse version whose report renderer this package bundles. */
export const lighthouseVersion: string = version;
