import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary, title, message }) {
  return (
    <div className='flex items-center justify-center h-full bg-background'>
      <div className='max-w-md p-6 bg-card border border-border rounded-lg'>
        <h2 className='text-xl font-semibold text-destructive mb-4'>
          {title || "Something went wrong"}
        </h2>
        <p className='text-muted-foreground mb-4'>
          {message ||
            "An error occurred while rendering this component. Please try again."}
        </p>
        {error && (
          <details className='mb-4'>
            <summary className='cursor-pointer text-sm text-muted-foreground hover:text-foreground'>
              Error details
            </summary>
            <pre className='mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40'>
              {error.toString()}
              {error.stack && `\n${error.stack}`}
            </pre>
          </details>
        )}
        <button
          onClick={resetErrorBoundary}
          className='px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors'
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default function ErrorBoundary({ children, title, message, onReset }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={(props) => (
        <ErrorFallback {...props} title={title} message={message} />
      )}
      onReset={onReset}
      onError={(error, errorInfo) => {
        console.error("Error caught by boundary:", error, errorInfo);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
