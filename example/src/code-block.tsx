import { useState } from 'react';
import { CopyButton } from './copy-button.tsx';

type Token = {
  start: number;
  text: string;
  kind?: 'comment' | 'string' | 'keyword' | 'tag' | 'fn';
};
type Snippet = { label: string; filename: string; code: string };

// A small highlighter for the fixed snippets on this page. It is not a general TSX parser. A tag
// must not follow a word, so a type argument such as `useState<LighthouseReport>` stays plain.
const pattern =
  /(\/\/[^\n]*)|('[^'\n]*'|`[^`]*`)|\b(import|from|export|function|async|await|const|return|if|throw|new|type|void)\b|((?<![\w>])<\/?[A-Z][\w.]*|(?<![\w>])<\/?[a-z]+(?=[\s>])|<\/?>)|\b([a-zA-Z]\w*)(?=[(<])/g;
const kinds = ['comment', 'string', 'keyword', 'tag', 'fn'] as const;

function highlight(code: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of code.matchAll(pattern)) {
    if (match.index > last) tokens.push({ start: last, text: code.slice(last, match.index) });
    const group = match.slice(1).findIndex((value) => value !== undefined);
    tokens.push({ start: match.index, text: match[0], kind: kinds[group] });
    last = match.index + match[0].length;
  }
  tokens.push({ start: last, text: code.slice(last) });
  return tokens;
}

export function CodeTabs({ snippets }: { snippets: Snippet[] }) {
  const [active, setActive] = useState(0);
  const snippet = snippets[active] ?? snippets[0];
  if (!snippet) return null;

  return (
    <figure className="code">
      <figcaption className="code-header">
        <fieldset className="code-tabs" aria-label="Examples">
          {snippets.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={index === active}
              className="code-tab"
              onClick={() => setActive(index)}
            >
              {item.label}
            </button>
          ))}
        </fieldset>
        <span className="code-filename">{snippet.filename}</span>
        <CopyButton text={snippet.code} label={`Copy ${snippet.filename}`} />
      </figcaption>
      <pre aria-label={`${snippet.label} example`}>
        <code>
          {highlight(snippet.code).map((token) =>
            token.kind ? (
              <span key={token.start} className={`tok-${token.kind}`}>
                {token.text}
              </span>
            ) : (
              token.text
            ),
          )}
        </code>
      </pre>
    </figure>
  );
}
