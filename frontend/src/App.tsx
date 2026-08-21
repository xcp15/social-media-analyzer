import { useState } from 'react'
import UploadZone from './components/UploadZone'
import FileInfoCard from './components/FileInfoCard'
import { validateFile } from './lib/file'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileSelect(selected: File) {
    const validationError = validateFile(selected)
    if (validationError) {
      setError(validationError)
      setFile(null)
      return
    }
    setError(null)
    setFile(selected)
  }

  function handleRemove() {
    setFile(null)
    setError(null)
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
            <FileInfoCard file={file} onRemove={handleRemove} />
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
            disabled={!file}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 hover:enabled:bg-emerald-700"
          >
            Analyze
          </button>
        </main>
      </div>
    </div>
  )
}

export default App
