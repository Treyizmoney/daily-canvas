import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('React error boundary caught:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', color: '#ff6b6b', fontFamily: 'monospace', background: '#1a1a1a', height: '100vh' }}>
          <h2>Something went wrong</h2>
          <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>{this.state.error.message}</p>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
