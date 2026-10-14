import { hostOf, reportsUrl, type SampleSummary } from './reports.ts';
import { ScoreRing } from './score-ring.tsx';

const coreCategories: Record<string, string> = {
  performance: 'Perf',
  accessibility: 'A11y',
  'best-practices': 'Best',
  seo: 'SEO',
};

export function SampleGrid({
  samples,
  active,
  onSelect,
}: {
  samples: SampleSummary[];
  active: string | undefined;
  onSelect: (slug: string) => void;
}) {
  if (samples.length === 0) {
    return (
      <p className="empty">
        Run <code>pnpm reports</code> to generate the sample reports.
      </p>
    );
  }

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
  const host = hostOf(sample.url);
  const date = new Date(sample.fetchTime).toLocaleDateString(undefined, { dateStyle: 'medium' });

  return (
    <button type="button" className="card" aria-pressed={active} onClick={onSelect}>
      <span className="card-shot">
        {sample.thumbnail && <img src={`${reportsUrl}${sample.thumbnail}`} alt="" loading="lazy" />}
      </span>
      <span className="card-body">
        <span className="card-title">{host}</span>
        <span className="card-scores">
          {sample.scores
            .filter((s) => s.id in coreCategories && s.score !== null)
            .map((s) => (
              <ScoreRing
                key={s.id}
                score={Math.round((s.score ?? 0) * 100)}
                label={coreCategories[s.id] ?? s.title}
              />
            ))}
        </span>
        <span className="card-meta">
          Lighthouse {sample.lighthouseVersion} · {date}
        </span>
      </span>
    </button>
  );
}
