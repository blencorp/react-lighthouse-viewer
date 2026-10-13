import { Suspense, use, useState, useTransition } from 'react';
import {
  LighthouseViewer,
  lighthouseVersion,
  type RendererOptions,
} from '@blen/react-lighthouse-viewer';
import { type LoadResult, loadFile, loadIndex, loadSample, type SampleSummary } from './reports.ts';

const indexPromise = loadIndex();
const initialSlug = decodeURIComponent(location.hash.slice(1));

export function App() {
  // An empty slug means "the first sample", which is known only after the index loads.
  const [selected, setSelected] = useState(initialSlug);
  const [result, setResult] = useState(() =>
    initialSlug ? loadSample(initialSlug) : loadFirstSample(),
  );
  const [followSystemTheme, setFollowSystemTheme] = useState(true);
  const [showTopbar, setShowTopbar] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  // A transition keeps the current report on screen while the next one loads.
  const show = (slug: string, next: Promise<LoadResult>) =>
    startTransition(() => {
      setSelected(slug);
      setResult(next);
      history.replaceState(null, '', slug && slug !== 'file' ? `#${slug}` : location.pathname);
    });

  const openFile = (file: File | undefined) => {
    if (file) show('file', loadFile(file));
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
          <span className="muted">Lighthouse {lighthouseVersion}</span>
        </div>
        <nav className="links">
          <a href="https://github.com/blencorp/react-lighthouse-viewer">GitHub</a>
          <a href="https://www.npmjs.com/package/@blen/react-lighthouse-viewer">npm</a>
        </nav>
      </header>

      <section className="samples" aria-labelledby="samples-title">
        <div className="samples-heading">
          <h2 id="samples-title">Sample reports</h2>
          {isPending && <span className="muted">Loading…</span>}
        </div>
        <Suspense fallback={<p className="muted">Loading samples…</p>}>
          <SampleGrid selected={selected} onSelect={(slug) => show(slug, loadSample(slug))} />
        </Suspense>
      </section>

      <div className="controls">
        <label className="button">
          Open your own JSON report…
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => openFile(event.target.files?.[0])}
          />
        </label>
        <span className="muted">or drop it anywhere on the page. It stays in your browser.</span>
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
      </div>

      <main>
        <Suspense fallback={<p className="message">Loading report…</p>}>
          <Report result={result} options={options} />
        </Suspense>
      </main>
    </div>
  );
}

async function loadFirstSample(): Promise<LoadResult> {
  const [first] = await indexPromise;
  return first
    ? loadSample(first.slug)
    : { error: 'There are no sample reports yet. Open your own report to view it.' };
}

function SampleGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (slug: string) => void;
}) {
  const samples = use(indexPromise);
  const active = selected || samples[0]?.slug;

  return (
    <ul className="grid">
      {samples.map((sample) => (
        <li key={sample.slug}>
          <SampleCard
            sample={sample}
            active={active === sample.slug}
            onSelect={() => onSelect(sample.slug)}
          />
        </li>
      ))}
      {samples.length === 0 && (
        <li className="muted">
          Run <code>pnpm reports</code> to generate the website samples.
        </li>
      )}
    </ul>
  );
}

function SampleCard({
  sample,
  active,
  onSelect,
}: {
  sample: SampleSummary;
  active: boolean;
  onSelect: () => void;
}) {
  const host = new URL(sample.url).hostname.replace(/^www\./, '');
  const scores = sample.scores.filter((s) => coreCategories.has(s.id) && s.score !== null);
  const date = new Date(sample.fetchTime).toLocaleDateString(undefined, { dateStyle: 'medium' });

  return (
    <button type="button" className="card" aria-pressed={active} onClick={onSelect}>
      <span className="card-title">{host}</span>
      <span className="scores">
        {scores.map((s) => {
          const score = Math.round((s.score ?? 0) * 100);
          return (
            <span key={s.id} className="score" data-rating={rating(score)} title={s.title}>
              <span className="score-value">{score}</span>
              <span className="score-label">{shortTitles[s.id]}</span>
            </span>
          );
        })}
      </span>
      <span className="card-meta">
        Lighthouse {sample.lighthouseVersion} · {date}
      </span>
    </button>
  );
}

const coreCategories = new Set(['performance', 'accessibility', 'best-practices', 'seo']);
const shortTitles: Record<string, string> = {
  performance: 'Perf',
  accessibility: 'A11y',
  'best-practices': 'BP',
  seo: 'SEO',
};

// The same score ranges as the Lighthouse report.
function rating(score: number) {
  if (score >= 90) return 'pass';
  if (score >= 50) return 'average';
  return 'fail';
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
