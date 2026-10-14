import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` during server rendering and hydration, `true` after. The component loads `url` and `src`
 * only in the browser, so the server HTML and the first client render match.
 */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
