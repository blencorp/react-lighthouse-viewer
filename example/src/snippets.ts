export const packageManagers = [
  { name: 'npm', command: 'npm i @blen/react-lighthouse-viewer' },
  { name: 'pnpm', command: 'pnpm add @blen/react-lighthouse-viewer' },
  { name: 'yarn', command: 'yarn add @blen/react-lighthouse-viewer' },
  { name: 'bun', command: 'bun add @blen/react-lighthouse-viewer' },
];

const fromWebsite = `import { LighthouseViewer } from '@blen/react-lighthouse-viewer';

// PageSpeed Insights runs Lighthouse on the site. See docs/pagespeed-api-key.md.
export function App() {
  return (
    <LighthouseViewer
      url="https://www.blencorp.com"
      apiKey={import.meta.env.VITE_PAGESPEED_API_KEY}
    />
  );
}`;

const fromFile = `import { LighthouseViewer } from '@blen/react-lighthouse-viewer';

// A report saved with: lighthouse <url> --output=json
export function App() {
  return <LighthouseViewer src="/reports/site.json" />;
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
  { label: 'Website', filename: 'app.tsx', code: fromWebsite },
  { label: 'Report file', filename: 'app.tsx', code: fromFile },
  { label: 'Report object', filename: 'upload.tsx', code: fromObject },
];
