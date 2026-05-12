import Sentry from '../sentry'

interface ErrorFallbackProps {
  error: unknown
  resetErrorBoundary?: (...args: unknown[]) => void
  componentStack?: string
  eventId?: string
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md rounded-lg bg-slate-800 p-8 text-center shadow-xl">
        <div className="mb-4 text-6xl">⚠️</div>
        <h1 className="mb-2 text-2xl font-bold text-white">Something went wrong</h1>
        <p className="mb-6 text-slate-400">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => resetErrorBoundary?.()}
            className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Try again
          </button>
          <button
            onClick={() => Sentry.showReportDialog()}
            className="rounded-lg bg-slate-700 px-6 py-2 font-medium text-slate-300 transition-colors hover:bg-slate-600"
          >
            Report this issue
          </button>
        </div>
      </div>
    </div>
  )
}
