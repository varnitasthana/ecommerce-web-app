import { Component } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-secondary)' }}>
          <div className="card text-center" style={{ maxWidth: '480px', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.75rem', color: 'var(--text-primary)' }}>Something went wrong</h1>
            <p className="muted" style={{ marginBottom: '2rem' }}>We encountered an unexpected error. Please try again or go back to the home page.</p>
            <pre style={{ textAlign: 'left', background: 'var(--bg-light)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', overflow: 'auto', maxHeight: '200px', marginBottom: '2rem' }}>
              {this.state.error?.toString()}
            </pre>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button onClick={this.handleRetry} size="lg">Try Again</Button>
              <Button to="/" variant="secondary" size="lg">Go Home</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
