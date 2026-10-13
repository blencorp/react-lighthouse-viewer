import { Suspense, use, useDeferredValue, useState } from 'react';
import {
  fetchLighthouseReport,
  LighthouseViewer,
  lighthouseVersion,
  type RendererOptions,
} from '@blen/react-lighthouse-viewer';
import { CodeTabs } from './code-block.tsx';
import { ErrorBoundary } from './error-boundary.tsx';
import { Install } from './install.tsx';
import { LighthouseLogo } from './lighthouse-logo.tsx';
import {
  hostOf,
  loadFile,
  loadIndex,
  noSamplesView,
  type ReportView,
  sampleView,
} from './reports.ts';
import { SampleGrid } from './sample-grid.tsx';
import { snippets } from './snippets.ts';
import { Switch } from './switch.tsx';
import { useHash } from './use-hash.ts';

const indexPromise = loadIndex();

export function App() {
  const samples = use(indexPromise);
  const hash = useHash();
  // A report the user opened from a URL or a file. It shows while the URL has no hash.
  const [custom, setCustom] = useState<ReportView | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [topbar, setTopbar] = useState(true);
  const [dragging, setDragging] = useState(false);

  const first = samples[0];
  const view = hash
    ? sampleView(hash)
    : (custom ?? (first ? sampleView(first.slug) : noSamplesView()));
  // While the next report loads, React keeps showing the current one.
  const shown = useDeferredValue(view);
  const loading = shown !== view;

  const sample = samples.find((item) => item.slug === shown.key);
  const title = sample ? hostOf(sample.url) : shown.name;
  const activeSlug = hash || (custom ? undefined : first?.slug);

  const selectSample = (slug: string) => {
    setCustom(null);
    location.hash = slug;
  };

  const showCustom = (next: ReportView) => {
    // Clear the hash without a history entry, so the custom report is what the page shows.
    history.replaceState(null, '', location.pathname + location.search);
    setCustom(next);
  };

  const openUrl = (formData: FormData) => {
    const value = formData.get('url');
    const url = typeof value === 'string' ? value.trim() : '';
    if (url) showCustom({ key: `url:${url}`, name: url, report: fetchLighthouseReport(url) });
  };

  const openFile = (file: File | undefined) => {
    if (file)
      showCustom({
        key: `file:${file.name}:${file.lastModified}`,
        name: file.name,
        report: loadFile(file),
      });
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
          <p className="eyebrow">
            <LighthouseLogo />
            Powered by the official Lighthouse {lighthouseVersion} renderer
          </p>
          <h1>Lighthouse reports, inside your React app.</h1>
          <p className="lede">
            Render any Lighthouse JSON report with the official Lighthouse renderer. Typed, server
            rendering friendly, and no runtime dependencies.
          </p>
          <Install />
        </div>
        <CodeTabs snippets={snippets} />
      </section>

      <section className="container section" aria-labelledby="samples-title">
        <div className="section-heading">
          <h2 id="samples-title">Sample reports</h2>
          <p>Fresh Lighthouse runs. Pick a site to open its full report.</p>
        </div>
        <SampleGrid samples={samples} active={activeSlug} onSelect={selectSample} />
      </section>

      <section className="container section viewer" aria-label="Report">
        <div className="toolbar">
          <div className="toolbar-row">
            <div className="toolbar-title">
              {loading ? <span className="spinner" aria-label="Loading" /> : null}
              <span className="toolbar-name" title={title}>
                {title}
              </span>
            </div>
            <div className="toolbar-actions">
              <Switch checked={darkMode} onChange={setDarkMode} label="Auto dark mode" />
              <Switch checked={topbar} onChange={setTopbar} label="Top bar" />
            </div>
          </div>
          <div className="toolbar-row">
            <form className="url-form" action={openUrl}>
              <input
                type="url"
                name="url"
                required
                placeholder="Paste a report URL, for example https://example.com/report.json"
                aria-label="Report URL"
              />
              <button type="submit" className="button button-primary">
                Load
              </button>
            </form>
            <label className="button">
              Open a file
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
            <ErrorBoundary key={shown.key} FallbackComponent={ReportError}>
              <LighthouseViewer report={shown.report} options={options} aria-label={title} />
            </ErrorBoundary>
          </Suspense>
        </div>
      </section>

      <footer className="footer container">
        <span>
          Made by <a href="https://blencorp.com">BLEN</a>. Apache-2.0.
        </span>
        <span>
          Lighthouse is a Google project. This site is not affiliated with Google. Reports stay in
          your browser.
        </span>
      </footer>

      {dragging && (
        <div className="drop-overlay" aria-hidden="true">
          <div className="drop-box">Drop a Lighthouse JSON report</div>
        </div>
      )}
    </div>
  );
}

function ReportError({ error }: { error: Error }) {
  return (
    <p className="message error" role="alert">
      {error.message}
    </p>
  );
}

// Our own mark, kept different from the official Lighthouse logo, which is a Google trademark.
function LighthouseMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.6 6.4 3.5 4.6v4.2l5.1-1.6ZM15.4 6.4l5.1-1.8v4.2l-5.1-1.6Z"
        fill="#fff"
        opacity=".55"
      />
      <path d="M9.2 5 12 2.6 14.8 5Z" fill="#fff" />
      <rect x="9.6" y="5.6" width="4.8" height="3" rx=".6" fill="#fff" />
      <path d="M9.9 9.4h4.2l1.3 10.4H8.6Z" fill="#fff" />
      <path d="M9.45 12.9h5.1l.3 2.3H9.15Z" fill="var(--accent)" />
      <rect x="6.5" y="19.8" width="11" height="1.8" rx=".9" fill="#fff" />
    </svg>
  );
}
