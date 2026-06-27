'use client';
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error: ', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[50vh] flex items-center justify-center p-4">
          <div className="vintage-panel p-8 text-center max-w-md w-full relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/60 shadow-sm transform -rotate-1" />
            <h2 className="font-display font-black text-2xl text-vintage-crimson mb-2 tracking-tight">System Error</h2>
            <p className="font-mono text-sm text-vintage-ink/70 mb-6">
              The interface encountered an unexpected anomaly. 
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="vintage-btn w-full py-3 flex justify-center"
            >
              Retry Connection
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
