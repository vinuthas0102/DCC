import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

function isChunkLoadError(error: Error): boolean {
  return (
    error.message?.includes('Failed to fetch dynamically imported module') ||
    error.message?.includes('Importing a module script failed') ||
    error.name === 'ChunkLoadError' ||
    /Loading chunk \d+ failed/.test(error.message ?? '')
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isChunkError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      isChunkError: isChunkLoadError(error),
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    if (isChunkLoadError(error)) {
      // Auto-reload once to pick up fresh chunk hashes after a new deploy.
      // Guard against infinite reload loops by checking sessionStorage.
      const key = 'chunk_reload_attempted';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    sessionStorage.removeItem('chunk_reload_attempted');
    this.setState({ hasError: false, isChunkError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    sessionStorage.removeItem('chunk_reload_attempted');
    window.location.reload();
  };

  public render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    if (this.state.isChunkError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-4 mx-auto">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Update available</h2>
            <p className="text-sm text-gray-500 mb-6">
              The app was updated in the background. Reload to get the latest version.
            </p>
            <Button onClick={this.handleReload} variant="primary" className="w-full">
              Reload now
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Something went wrong
          </h1>

          <p className="text-gray-600 text-center mb-6">
            We encountered an unexpected error. This has been logged and we'll look into it.
          </p>

          {this.state.error && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-1">Error Details:</p>
              <p className="text-sm text-gray-600 font-mono break-words">
                {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={this.handleReset} variant="secondary" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={this.handleReload} variant="primary" className="flex-1">
              Reload Page
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-6">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                Stack Trace (Development Only)
              </summary>
              <pre className="mt-2 text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-64">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
