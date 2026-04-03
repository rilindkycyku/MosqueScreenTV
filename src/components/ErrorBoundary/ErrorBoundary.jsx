import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for maintenance – since we're on TV, we could send this to an external service if needed
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Auto-recovery: If an error happens, wait 10 seconds and try to reset
    // This allows the component to attempt to re-mount silently
    setTimeout(() => {
        this.setState({ hasError: false });
    }, 10000);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
