import { Component, type ComponentType, type ReactNode } from 'react';

type Props = { children: ReactNode; FallbackComponent: ComponentType<{ error: Error }> };

// React has no hook for error boundaries, so this stays a small class component.
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  override state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override render() {
    const { error } = this.state;
    const { FallbackComponent, children } = this.props;
    return error ? <FallbackComponent error={error} /> : children;
  }
}
