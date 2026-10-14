import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback: (error: Error) => ReactNode;
  /** A new value clears the error, for example when the report source changes. */
  resetKey: unknown;
  /** Called after the error is on screen. */
  onError?: (() => void) | undefined;
};

type State = { error: Error | null; resetKey: unknown };

// React has no hook for error boundaries, so this stays a small class component.
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return Object.is(props.resetKey, state.resetKey)
      ? null
      : { error: null, resetKey: props.resetKey };
  }

  override componentDidCatch() {
    this.props.onError?.();
  }

  override render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}
