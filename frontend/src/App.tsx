import { useState } from 'react'
import UploadZone from './components/UploadZone'
import FileInfoCard from './components/FileInfoCard'
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

  const isBusy = status === 'uploading' || status === 'analyzing'

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
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  function analyzeButtonLabel() {
    if (status === 'uploading') return `Uploading… ${uploadProgress}%`
    if (status === 'analyzing') return 'Analyzing…'
    return 'Analyze'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">
            Social Media Content Analyzer
          </h1>
          <p className="mt-2 text-slate-500">
            Upload a screenshot or PDF of a social media post to get an
            engagement score and suggestions.
          </p>
        </header>

        <main className="space-y-4">
          {file ? (
            <FileInfoCard file={file} onRemove={handleRemove} disabled={isBusy} />
          ) : (
            <UploadZone onFileSelect={handleFileSelect} />
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={!file || isBusy}
            onClick={handleAnalyze}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 hover:enabled:bg-emerald-700"
          >
            {analyzeButtonLabel()}
          </button>

          {result && <ResultsDashboard result={result} />}
        </main>
      </div>
    </div>
  )
}

export default App
