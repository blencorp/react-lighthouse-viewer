import { CopyButton } from './copy-button.tsx';

type Token = { text: string; kind?: 'comment' | 'string' | 'keyword' | 'tag' | 'fn' };

// A small highlighter for the fixed snippets on this page. It is not a general TSX parser.
const pattern =
  /(\/\/[^\n]*)|('[^'\n]*'|`[^`]*`)|\b(import|from|export|function|async|await|const|return|if|throw|new|type)\b|(<\/?[A-Z][\w.]*|<\/?[a-z]+(?=[\s>]))|\b([a-zA-Z]\w*)(?=\()/g;
const kinds = ['comment', 'string', 'keyword', 'tag', 'fn'] as const;

function highlight(code: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of code.matchAll(pattern)) {
    if (match.index > last) tokens.push({ text: code.slice(last, match.index) });
    const group = match.slice(1).findIndex((value) => value !== undefined);
    tokens.push({ text: match[0], kind: kinds[group] });
    last = match.index + match[0].length;
  }
  tokens.push({ text: code.slice(last) });
  return tokens;
}

export function CodeBlock({ code, filename }: { code: string; filename: string }) {
  return (
    <figure className="code">
      <figcaption className="code-header">
        <span className="code-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="code-filename">{filename}</span>
        <CopyButton text={code} label={`Copy ${filename}`} />
      </figcaption>
      <pre>
        <code>
          {highlight(code).map((token, index) =>
            token.kind ? (
              // The tokens never change order, so the index is a stable key.
              // oxlint-disable-next-line react/no-array-index-key
              <span key={index} className={`tok-${token.kind}`}>
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
