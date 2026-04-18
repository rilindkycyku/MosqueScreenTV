import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
    this._timer = null;
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));

    // Auto-recovery: shorter delay on first errors, longer after repeated failures
    const delay = this.state.errorCount < 3 ? 8000 : 20000;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this.setState({ hasError: false });
    }, delay);
  }

  componentDidUpdate(prevProps) {
    // Allow parent to force a reset by changing the `resetKey` prop
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      if (this._timer) clearTimeout(this._timer);
      this.setState({ hasError: false });
    }
  }

  componentWillUnmount() {
    if (this._timer) clearTimeout(this._timer);
  }

  render() {
    if (this.state.hasError) {
      // If no fallback provided, render nothing (silent recovery)
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
