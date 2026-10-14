import { useState } from 'react';

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    // The clipboard can refuse without permission, and it does not exist outside a secure context
    // (for example the dev server opened by a LAN address).
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button type="button" className="copy-button" onClick={copy} aria-label={label}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
