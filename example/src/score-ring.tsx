const radius = 15;
const circumference = 2 * Math.PI * radius;

// The same score ranges as the Lighthouse report.
function rating(score: number) {
  if (score >= 90) return 'pass';
  if (score >= 50) return 'average';
  return 'fail';
}

export function ScoreRing({ score, label }: { score: number; label: string }) {
  return (
    <span className="ring" data-rating={rating(score)} title={`${label}: ${score}`}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle className="ring-track" cx="18" cy="18" r={radius} />
        <circle
          className="ring-value"
          cx="18"
          cy="18"
          r={radius}
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
        />
      </svg>
      <span className="ring-score">{score}</span>
      <span className="ring-label">{label}</span>
    </span>
  );
}
