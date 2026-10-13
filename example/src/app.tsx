import { Suspense, useState, useTransition } from 'react';
import {
  type LighthouseReport,
  LighthouseViewer,
  lighthouseVersion,
  type RendererOptions,
} from '@blen/react-lighthouse-viewer';
import { CodeBlock } from './code-block.tsx';
import { CopyButton } from './copy-button.tsx';
import { ErrorBoundary } from './error-boundary.tsx';
import { loadFile, loadIndex, loadSample } from './reports.ts';
import { SampleGrid } from './sample-grid.tsx';
import { Switch } from './switch.tsx';

const install = 'npm i @blen/react-lighthouse-viewer';

const usage = `import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  isLighthouseReport,
  LighthouseViewer,
} from '@blen/react-lighthouse-viewer';

async function loadReport(url: string) {
  const json: unknown = await fetch(url).then((res) => res.json());
  if (!isLighthouseReport(json)) {
    throw new Error('Not a Lighthouse report');
  }
  return json;
}

// Create the promise outside render.
const report = loadReport('/report.json');

export function App() {
  return (
    <ErrorBoundary fallback={<p>Could not load the report.</p>}>
      <Suspense fallback={<p>Loading…</p>}>
        <LighthouseViewer report={report} />
      </Suspense>
    </ErrorBoundary>
  );
}`;

const indexPromise = loadIndex();
const initialSlug = decodeURIComponent(location.hash.slice(1));

export function App() {
  // An empty slug means "the first sample", which is known only after the index loads.
  const [selected, setSelected] = useState(initialSlug);
  const [title, setTitle] = useState('');
  // The report is a promise in state. The viewer suspends while it loads.
  const [report, setReport] = useState(() =>
    initialSlug ? loadSample(initialSlug) : loadFirstSample(),
  );
  const [darkMode, setDarkMode] = useState(true);
  const [topbar, setTopbar] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  // A transition keeps the current report on screen while the next one loads.
  const show = (slug: string, name: string, next: Promise<LighthouseReport>) =>
    startTransition(() => {
      setSelected(slug);
      setTitle(name);
      setReport(next);
      history.replaceState(null, '', slug.startsWith('file:') ? location.pathname : `#${slug}`);
    });

  const openFile = (file: File | undefined) => {
    if (file) show(`file:${file.name}`, file.name, loadFile(file));
  };

  const options: RendererOptions = { disableDarkMode: !darkMode, omitTopbar: !topbar };

  return (
    <div
      className="page"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.relatedTarget) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        openFile(event.dataTransfer.files[0]);
      }}
    >
      <header className="nav container">
        <span className="brand">
          <LighthouseMark />
          react-lighthouse-viewer
        </span>
        <nav className="nav-links">
          <a href="https://github.com/blencorp/react-lighthouse-viewer#readme">Docs</a>
          <a href="https://www.npmjs.com/package/@blen/react-lighthouse-viewer">npm</a>
          <a className="button" href="https://github.com/blencorp/react-lighthouse-viewer">
            GitHub
          </a>
        </nav>
      </header>

      <section className="hero container">
        <div className="hero-text">
          <p className="eyebrow">Lighthouse {lighthouseVersion} renderer · React 19</p>
          <h1>Lighthouse reports, inside your React app.</h1>
          <p className="lede">
            Render any Lighthouse JSON report with the official Lighthouse renderer. Typed, server
            rendering friendly, and no runtime dependencies.
          </p>
          <div className="install">
            <code>{install}</code>
            <CopyButton text={install} label="Copy the install command" />
          </div>
        </div>
        <CodeBlock code={usage} filename="app.tsx" />
      </section>

      <section className="container section" aria-labelledby="samples-title">
        <div className="section-heading">
          <h2 id="samples-title">Sample reports</h2>
          <p>Fresh Lighthouse runs. Pick a site to open its full report.</p>
        </div>
        <Suspense fallback={<div className="grid-skeleton" />}>
          <SampleGrid
            samples={indexPromise}
            selected={selected}
            onSelect={(slug, host) => show(slug, host, loadSample(slug))}
          />
        </Suspense>
      </section>

      <section className="container section viewer" aria-label="Report">
        <div className="toolbar">
          <div className="toolbar-title">
            {isPending ? <span className="spinner" aria-label="Loading" /> : null}
            <span>{title || 'Report'}</span>
          </div>
          <div className="toolbar-actions">
            <Switch checked={darkMode} onChange={setDarkMode} label="Auto dark mode" />
            <Switch checked={topbar} onChange={setTopbar} label="Top bar" />
            <label className="button button-primary">
              Open JSON report
              <input
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(event) => openFile(event.target.files?.[0])}
              />
            </label>
          </div>
        </div>
        <div className="report-frame">
          <Suspense fallback={<p className="message">Loading report…</p>}>
            {/* A new report gets a new boundary, so an earlier error does not stick. */}
            <ErrorBoundary key={selected} FallbackComponent={ReportError}>
              <LighthouseViewer report={report} options={options} />
            </ErrorBoundary>
          </Suspense>
        </div>
      </section>

      <footer className="footer container">
        <span>
          Made by <a href="https://blencorp.com">BLEN</a>. Apache-2.0.
        </span>
        <span>Lighthouse is a Google project. Reports stay in your browser.</span>
      </footer>

      {dragging && (
        <div className="drop-overlay" aria-hidden="true">
          <div className="drop-box">Drop a Lighthouse JSON report</div>
        </div>
      )}
    </div>
  );
}

async function loadFirstSample(): Promise<LighthouseReport> {
  const [first] = await indexPromise;
  if (!first) throw new Error('There are no sample reports yet. Open your own report to view it.');
  return loadSample(first.slug);
}

function ReportError({ error }: { error: Error }) {
  return (
    <p className="message error" role="alert">
      {error.message}
    </p>
  );
}

function LighthouseMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 9 6h6l-3-4Z" fill="currentColor" />
      <path d="M9 7h6l1.6 15H7.4L9 7Z" fill="currentColor" opacity=".9" />
      <path d="M8.6 11h6.8l.3 3H8.3l.3-3Z" fill="var(--page-bg)" />
    </svg>
  );
}
