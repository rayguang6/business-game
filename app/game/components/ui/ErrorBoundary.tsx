'use client';

import React, { Component, ReactNode } from 'react';
import { ConfigErrorPage } from './ConfigErrorPage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const errorMessage = error?.message || 'An unexpected error occurred';
      
      // Determine error type
      const errorType: 'database' | 'code' | 'unknown' = 
        errorMessage.includes('not found') || 
        errorMessage.includes('not configured') || 
        errorMessage.includes('missing') ||
        errorMessage.includes('admin panel') ||
        errorMessage.includes('database') ||
        errorMessage.includes('config')
          ? 'database'
          : errorMessage.includes('Cannot read') || 
            errorMessage.includes('null') ||
            errorMessage.includes('undefined') ||
            errorMessage.includes('property')
          ? 'code'
          : 'unknown';

      return (
        <ConfigErrorPage
          title="Game Error"
          message={
            errorType === 'database'
              ? "The game configuration is missing or incomplete. Please configure this industry in the admin panel."
              : errorType === 'code'
              ? "A programming error occurred. Please report this issue."
              : "An unexpected error occurred while running the game."
          }
          errorType={errorType}
          error={error}
          onRetry={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}
        />
      );
    }

    return this.props.children;
  }
}

