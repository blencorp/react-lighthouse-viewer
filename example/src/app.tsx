import { Suspense, use, useState, useTransition } from 'react';
import {
  LighthouseViewer,
  lighthouseVersion,
  type RendererOptions,
} from '@blen/react-lighthouse-viewer';
import { type LoadResult, loadFile, loadSample, samples } from './reports.ts';

export function App() {
  const [result, setResult] = useState(() => loadSample('latest'));
  const [selected, setSelected] = useState<string>('latest');
  const [followSystemTheme, setFollowSystemTheme] = useState(true);
  const [showTopbar, setShowTopbar] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  // A transition keeps the current report on screen while the next one loads.
  const show = (next: Promise<LoadResult>, value: string) =>
    startTransition(() => {
      setSelected(value);
      setResult(next);
    });

  const openFile = (file: File | undefined) => {
    if (file) show(loadFile(file), 'file');
  };

  const options: RendererOptions = {
    disableDarkMode: !followSystemTheme,
    omitTopbar: !showTopbar,
  };

  return (
    <div
      className="app"
      data-dragging={dragging || undefined}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        openFile(event.dataTransfer.files[0]);
      }}
    >
      <header className="header">
        <div className="title">
          <h1>@blen/react-lighthouse-viewer</h1>
          <span className="version">Lighthouse {lighthouseVersion}</span>
        </div>
        <nav className="links">
          <a href="https://github.com/blencorp/react-lighthouse-viewer">GitHub</a>
          <a href="https://www.npmjs.com/package/@blen/react-lighthouse-viewer">npm</a>
        </nav>
        <div className="controls">
          <select
            aria-label="Report"
            value={selected}
            onChange={(event) => show(loadSample(event.target.value), event.target.value)}
          >
            {samples.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.label}
              </option>
            ))}
            {selected === 'file' && <option value="file">Your report</option>}
          </select>
          <label className="button">
            Open a JSON report…
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => openFile(event.target.files?.[0])}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={followSystemTheme}
              onChange={(event) => setFollowSystemTheme(event.target.checked)}
            />
            Follow system dark mode
          </label>
          <label>
            <input
              type="checkbox"
              checked={showTopbar}
              onChange={(event) => setShowTopbar(event.target.checked)}
            />
            Show top bar
          </label>
          {isPending && <span className="status">Loading…</span>}
        </div>
        <p className="hint">
          Drop a Lighthouse JSON report anywhere on the page. It stays in your browser.
        </p>
      </header>

      <main>
        <Suspense fallback={<p className="message">Loading report…</p>}>
          <Report result={result} options={options} />
        </Suspense>
      </main>
    </div>
  );
}

function Report({ result, options }: { result: Promise<LoadResult>; options: RendererOptions }) {
  const loaded = use(result);
  if ('error' in loaded) {
    return (
      <p className="message error" role="alert">
        {loaded.error}
      </p>
    );
  }
  return <LighthouseViewer report={loaded.report} options={options} aria-label={loaded.name} />;
}
