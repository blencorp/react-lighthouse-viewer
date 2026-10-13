export const packageManagers = [
  { name: 'npm', command: 'npm i @blen/react-lighthouse-viewer' },
  { name: 'pnpm', command: 'pnpm add @blen/react-lighthouse-viewer' },
  { name: 'yarn', command: 'yarn add @blen/react-lighthouse-viewer' },
  { name: 'bun', command: 'bun add @blen/react-lighthouse-viewer' },
];

const fromUrl = `import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  fetchLighthouseReport,
  LighthouseViewer,
} from '@blen/react-lighthouse-viewer';

// Start loading outside render. Any URL that serves a
// Lighthouse JSON report works (with CORS).
const report = fetchLighthouseReport('/reports/site.json');

export function App() {
  return (
    <ErrorBoundary fallback={<p>Could not load the report.</p>}>
      <Suspense fallback={<p>Loading…</p>}>
        <LighthouseViewer report={report} />
      </Suspense>
    </ErrorBoundary>
  );
}`;

const fromObject = `import { useState } from 'react';
import {
  isLighthouseReport,
  LighthouseViewer,
  type LighthouseReport,
} from '@blen/react-lighthouse-viewer';

// A report you already have: uploaded, imported, or from your API.
export function Upload() {
  const [report, setReport] = useState<LighthouseReport>();

  async function open(file: File) {
    const json: unknown = JSON.parse(await file.text());
    if (isLighthouseReport(json)) setReport(json);
  }

  return (
    <>
      <input
        type="file"
        accept=".json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void open(file);
        }}
      />
      {report && <LighthouseViewer report={report} />}
    </>
  );
}`;

export const snippets = [
  { label: 'From a URL', filename: 'app.tsx', code: fromUrl },
  { label: 'From an object', filename: 'upload.tsx', code: fromObject },
];
