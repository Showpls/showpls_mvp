import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Minimal logging to help diagnose silent crashes
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full mx-auto mb-4 bg-red-500/20"></div>
            <p className="text-text-muted">Something went wrong while rendering this page.</p>
            <div className="text-xs text-text-muted mt-2">
              {(this.state.error && this.state.error.message) || ''}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
