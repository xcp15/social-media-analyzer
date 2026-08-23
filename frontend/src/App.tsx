import { useEffect, useRef, useState } from 'react'
import UploadZone from './components/UploadZone'
import FileInfoCard from './components/FileInfoCard'
import LoadingState from './components/LoadingState'
import ResultsDashboard from './components/ResultsDashboard'
import { validateFile } from './lib/file'
import { analyzeFile, type AnalyzeResponse } from './lib/api'

type Status = 'idle' | 'uploading' | 'analyzing' | 'error'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const isBusy = status === 'uploading' || status === 'analyzing'

  useEffect(() => {
    if (result) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  function resetAll() {
    setFile(null)
    setError(null)
    setResult(null)
    setStatus('idle')
    setUploadProgress(0)
  }

  function handleFileSelect(selected: File) {
    const validationError = validateFile(selected)
    if (validationError) {
      setError(validationError)
      setFile(null)
      return
    }
    setError(null)
    setFile(selected)
    setResult(null)
    setStatus('idle')
  }

  function handleRemove() {
    if (isBusy) return
    setFile(null)
    setError(null)
    setResult(null)
    setStatus('idle')
  }

  async function handleAnalyze() {
    if (!file) return
    setStatus('uploading')
    setUploadProgress(0)
    setError(null)
    setResult(null)
    try {
      const response = await analyzeFile(file, (percent) => {
        setUploadProgress(percent)
        if (percent >= 100) setStatus('analyzing')
      })
      setResult(response)
      setStatus('idle')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't analyze this file. Please try again or upload another document.",
      )
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1100px] px-5 py-12 sm:py-14">
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900">
            <svg viewBox="0 0 64 64" className="h-6 w-6">
              <path
                d="M12 36 L24 38 L34 22 L44 28 L52 16"
                stroke="#34d399"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="52" cy="16" r="4" fill="#34d399" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Social Media Content Analyzer
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-slate-500">
            Upload a screenshot or PDF of a social media post and get an
            AI-powered breakdown of engagement and actionable improvements.
          </p>
        </header>

        <main className="mx-auto max-w-2xl space-y-5">
          {file ? (
            <FileInfoCard file={file} onRemove={handleRemove} disabled={isBusy} />
          ) : (
            <UploadZone onFileSelect={handleFileSelect} />
          )}

          <div aria-live="polite">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>

          {!result && (
            <button
              type="button"
              disabled={!file || isBusy}
              onClick={handleAnalyze}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition-colors hover:enabled:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:enabled:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {isBusy && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {status === 'analyzing' ? 'Analyzing...' : 'Analyze Post'}
            </button>
          )}

          {isBusy && <LoadingState stage={status === 'uploading' ? 'uploading' : 'analyzing'} uploadProgress={uploadProgress} />}
        </main>

        {result && (
          <div ref={resultsRef} className="mx-auto mt-10 max-w-3xl scroll-mt-8">
            <ResultsDashboard result={result} sourceMimeType={file?.type} onReset={resetAll} />
          </div>
        )}

        <footer className="mt-16 text-center">
          <p className="text-sm font-medium text-slate-500">Social Media Content Analyzer</p>
          <p className="mt-0.5 text-xs text-slate-400">AI-powered content analysis</p>
        </footer>
      </div>
    </div>
  )
}

export default App
