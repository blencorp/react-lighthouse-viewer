const install = 'npm install @blen/react-lighthouse-viewer';

const usage = `import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { isLighthouseReport, LighthouseViewer } from '@blen/react-lighthouse-viewer';

async function loadReport(url: string) {
  const json: unknown = await fetch(url).then((response) => response.json());
  if (!isLighthouseReport(json)) throw new Error(\`\${url} is not a Lighthouse report.\`);
  return json;
}

// Create the promise outside render: at module level, in an event handler,
// in a router loader, or in a Server Component that passes it down.
const report = loadReport('/report.json');

export function App() {
  return (
    <ErrorBoundary fallback={<p>Could not load the report.</p>}>
      <Suspense fallback={<p>Loading report…</p>}>
        <LighthouseViewer report={report} />
      </Suspense>
    </ErrorBoundary>
  );
}`;

export function UsagePanel() {
  return (
    <details className="usage">
      <summary>Use it in your app</summary>
      <pre>
        <code>{install}</code>
      </pre>
      <pre>
        <code>{usage}</code>
      </pre>
      <p className="muted">
        <code>report</code> also takes a report object. Any error boundary works. This page uses the
        same pattern: see{' '}
        <a href="https://github.com/blencorp/react-lighthouse-viewer/tree/main/example/src">
          example/src
        </a>
        .
      </p>
    </details>
  );
}
