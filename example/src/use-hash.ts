import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  addEventListener('hashchange', onChange);
  return () => removeEventListener('hashchange', onChange);
}

/**
 * The URL hash without `#`. The address bar is the source of truth for the selected sample, so
 * links, typed addresses and the back button all switch reports.
 */
export function useHash() {
  return useSyncExternalStore(
    subscribe,
    () => location.hash.slice(1),
    () => '',
  );
}
