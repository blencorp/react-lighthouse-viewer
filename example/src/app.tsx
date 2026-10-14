import { use, useDeferredValue, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  LighthouseViewer,
  lighthouseVersion,
  type RendererOptions,
} from '@blen/react-lighthouse-viewer';
import { CodeTabs } from './code-block.tsx';
import { Install } from './install.tsx';
import { LighthouseLogo } from './lighthouse-logo.tsx';
import { addressView, fileView, hostOf, loadIndex, sampleView, type View } from './reports.ts';
import { SampleGrid } from './sample-grid.tsx';
import { snippets } from './snippets.ts';
import { Switch } from './switch.tsx';
import { useHash } from './use-hash.ts';

const indexPromise = loadIndex();

export function App() {
  const samples = use(indexPromise);
  // A hash that names no sample (a stale link, or a site that failed on the last deploy) shows the
  // first sample instead of an error.
  const rawHash = useHash();
  const hash = samples.some((sample) => sample.slug === rawHash) ? rawHash : '';
  // A website or file the user opened, and the hash it replaced. It shows until the hash changes,
  // so the back button and the sample links still work. The URL is not changed while Analyze
  // runs, because other updates in that time would read the new URL before the report is ready.
  const [custom, setCustom] = useState<{ view: View; at: string } | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [topbar, setTopbar] = useState(true);
  const [dragging, setDragging] = useState(false);
  // Controlled, so the address stays in the field after the form action runs (React resets
  // uncontrolled fields), and the user can retry.
  const [address, setAddress] = useState('');

  const titleOf = (slug: string) => {
    const sample = samples.find((item) => item.slug === slug);
    return sample ? hostOf(sample.url) : slug;
  };
  const first = samples[0];
  const customView = custom?.at === hash ? custom.view : null;
  const view =
    customView ??
    (hash
      ? sampleView(hash, titleOf(hash))
      : first
        ? sampleView(first.slug, titleOf(first.slug))
        : null);
  // While the next report loads, React keeps showing the current one.
  const shown = useDeferredValue(view);
  const loading = shown !== view;
  const activeSlug = customView ? undefined : hash || first?.slug;

  const selectSample = (slug: string) => {
    setCustom(null);
    location.hash = slug;
  };

  const showCustom = (next: View) => setCustom({ view: next, at: hash });

  const analyze = () => {
    const trimmed = address.trim();
    if (trimmed) showCustom(addressView(trimmed));
  };

  const openFile = (file: File | undefined) => {
    if (file) showCustom(fileView(file));
  };

  const options: RendererOptions = { disableDarkMode: !darkMode, omitTopbar: !topbar };

  return (
    <div
      className="page"
      onDragOver={(event) => {
        // Only files open a report. Dragged text, links and images keep their usual behavior.
        if (!event.dataTransfer.types.includes('Files')) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.types.includes('Files')) return;
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
            Pass a website URL or a saved report and get the full Lighthouse report, drawn by the
            official Lighthouse renderer. Typed, server rendering friendly, and no runtime
            dependencies.
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

      <section className="container section viewer" aria-label={shown?.title ?? 'Report'}>
        <div className="toolbar">
          <div className="toolbar-row">
            <div className="toolbar-title">
              {loading ? <output className="spinner" aria-label="Loading" /> : null}
              <span className="toolbar-name" title={shown?.title}>
                {shown?.title ?? 'Report'}
              </span>
            </div>
            <div className="toolbar-actions">
              <Switch checked={darkMode} onChange={setDarkMode} label="Auto dark mode" />
              <Switch checked={topbar} onChange={setTopbar} label="Top bar" />
            </div>
          </div>
          <div className="toolbar-row">
            <form className="url-form" action={analyze}>
              <input
                name="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
                pattern=".*\S.*"
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Analyze a website (www.example.gov) or paste a report .json URL"
                aria-label="Website or report URL"
              />
              <AnalyzeButton />
            </form>
            <label className="button">
              Open a file
              <input
                type="file"
                accept="application/json,.json"
                className="visually-hidden"
                onChange={(event) => {
                  openFile(event.currentTarget.files?.[0]);
                  // Chrome fires no change event for the same file again, so clear the choice.
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        </div>
        <div className="report-frame">
          {shown ? (
            <LighthouseViewer {...shown.source} options={options} />
          ) : (
            <p className="empty">
              There are no sample reports yet. Analyze a website or open your own report.
            </p>
          )}
        </div>
      </section>

      <footer className="footer container">
        <span>
          Made by <a href="https://blencorp.com">BLEN</a>. Apache-2.0.
        </span>
        <span>
          Lighthouse is a Google project. This site is not affiliated with Google. Files you open
          stay in your browser. Analyze sends the address to Google PageSpeed Insights.
        </span>
      </footer>

      {dragging && (
        // The overlay covers the page, so leaving it means the drag left the window.
        <div className="drop-overlay" aria-hidden="true" onDragLeave={() => setDragging(false)}>
          <div className="drop-box">Drop a Lighthouse JSON report</div>
        </div>
      )}
    </div>
  );
}

// A form action runs in a transition that stays pending until the new report renders.
function AnalyzeButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button button-primary" disabled={pending}>
      {pending ? <span className="spinner" aria-hidden="true" /> : null}
      {pending ? 'Analyzing…' : 'Analyze'}
    </button>
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
