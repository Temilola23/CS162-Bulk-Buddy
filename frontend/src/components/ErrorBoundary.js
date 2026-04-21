import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

/**
 * Renders a safe fallback when a React rendering error reaches the boundary.
 */
function ErrorFallback() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Something went wrong.</h1>
      <p>Please refresh the page and try again.</p>
    </div>
  );
}

/**
 * Wraps child routes in a reusable React error boundary.
 */
export default function ErrorBoundary({ children }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}
