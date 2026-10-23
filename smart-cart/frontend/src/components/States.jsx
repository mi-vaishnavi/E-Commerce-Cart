export function Spinner({ label = 'Loading' }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" aria-hidden="true" />
      {label}
    </span>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="card mx-auto max-w-md p-8 text-center">
      <h2 className="text-lg font-semibold">We couldn't load this</h2>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {onRetry && <button type="button" className="btn-primary mt-5" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="mx-auto max-w-sm py-10 text-center">
      <div className="text-4xl" aria-hidden="true">🛒</div>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{text}</p>
      {action}
    </div>
  );
}

export function ProductSkeletons() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="card animate-pulse overflow-hidden">
          <div className="h-40 bg-raised" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-raised" />
            <div className="h-3 w-full rounded bg-raised" />
            <div className="h-9 w-full rounded bg-raised" />
          </div>
        </div>
      ))}
    </div>
  );
}
