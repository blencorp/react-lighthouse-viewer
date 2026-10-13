import { version } from 'lighthouse/package.json';

export { LighthouseViewer } from './lighthouse-viewer.tsx';
export type { LighthouseReport, LighthouseViewerProps, RendererOptions } from './types.ts';

/** The Lighthouse version whose report renderer this package bundles. */
export const lighthouseVersion: string = version;
