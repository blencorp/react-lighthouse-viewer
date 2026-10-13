import { useState } from 'react';
import { CopyButton } from './copy-button.tsx';
import { packageManagers } from './snippets.ts';

export function Install() {
  const [active, setActive] = useState(0);
  const manager = packageManagers[active] ?? packageManagers[0];
  if (!manager) return null;

  return (
    <div className="install-block">
      <div className="segmented" role="tablist" aria-label="Package manager">
        {packageManagers.map((item, index) => (
          <button
            key={item.name}
            type="button"
            role="tab"
            aria-selected={index === active}
            onClick={() => setActive(index)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="install">
        <code>{manager.command}</code>
        <CopyButton text={manager.command} label="Copy the install command" />
      </div>
    </div>
  );
}
