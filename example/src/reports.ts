import { type LighthouseReport, lighthouseVersion } from 'react-lighthouse-viewer';

export type LoadResult = { name: string; report: LighthouseReport } | { error: string };

// The samples are the package's test fixtures. The latest sample is regenerated with each
// Lighthouse release.
export const samples = [
  {
    id: 'latest',
    label: `Sample: Lighthouse ${lighthouseVersion} report`,
    load: () => import('../../packages/react-lighthouse-viewer/test/fixtures/lh-latest.json'),
  },
  {
    id: 'lighthouse-6',
    label: 'Sample: Lighthouse 6 report',
    load: () => import('../../packages/react-lighthouse-viewer/test/fixtures/lh-6.json'),
  },
] as const;

export async function loadSample(id: string): Promise<LoadResult> {
  const sample = samples.find((s) => s.id === id);
  if (!sample) return { error: `There is no sample named ${id}.` };
  const { default: report }: { default: unknown } = await sample.load();
  return isReport(report)
    ? { name: sample.label, report }
    : { error: `${sample.label} is not a Lighthouse report.` };
}

export async function loadFile(file: File): Promise<LoadResult> {
  try {
    const report: unknown = JSON.parse(await file.text());
    if (!isReport(report)) {
      return { error: `${file.name} is not a Lighthouse JSON report.` };
    }
    return { name: file.name, report };
  } catch {
    return { error: `${file.name} is not valid JSON.` };
  }
}

function isReport(value: unknown): value is LighthouseReport {
  return (
    typeof value === 'object' &&
    value !== null &&
    'lighthouseVersion' in value &&
    'categories' in value &&
    'audits' in value
  );
}
