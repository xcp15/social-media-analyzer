interface LoadingStateProps {
  stage: 'uploading' | 'analyzing'
  uploadProgress: number
}

export default function LoadingState({ stage, uploadProgress }: LoadingStateProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <svg className="h-5 w-5 shrink-0 animate-spin text-emerald-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="font-medium text-slate-800">
          {stage === 'uploading' ? `Uploading… ${uploadProgress}%` : 'Analyzing your content…'}
        </p>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        {stage === 'uploading' ? (
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        ) : (
          <div className="h-full w-1/3 animate-pulse rounded-full bg-emerald-500" />
        )}
      </div>
    </div>
  )
}
