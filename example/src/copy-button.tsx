import { useState } from 'react';

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    // The clipboard can refuse, for example without permission or outside a secure context.
    const done = await navigator.clipboard.writeText(text).then(
      () => true,
      () => false,
    );
    if (!done) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button type="button" className="copy-button" onClick={copy} aria-label={label}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
