import { useEffect, useRef, useState } from 'react';
import { validateFile } from './lib/file';
import { analyzeFile, type AnalyzeResponse } from './lib/api';

type Status = 'idle' | 'uploading' | 'analyzing' | 'error';

// ─── UploadZone (fully dark) ──────────────────────────────────────
function UploadZone({ onFileSelect }: { onFileSelect: (file: File) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) onFileSelect(files[0]);
  };
  const handleClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = '';
  };

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
        isDragging
          ? 'border-blue-400 bg-blue-500/15'
          : 'border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800/80'
      } p-8 text-center backdrop-blur-sm`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden" onChange={handleFileChange} />
      <div className="flex flex-col items-center gap-2">
        <svg className={`h-10 w-10 transition-colors ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 21h10.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21z" />
        </svg>
        <p className="text-sm font-medium text-slate-200">{isDragging ? 'Drop your file here' : 'Drag & drop your file, or click to browse'}</p>
        <p className="text-xs text-slate-400">Supports PNG, JPG, PDF (max 5MB)</p>
      </div>
    </div>
  );
}

// ─── FileInfoCard (fully dark) ────────────────────────────────────
function FileInfoCard({ file, onRemove, disabled }: { file: File; onRemove: () => void; disabled?: boolean }) {
  const fileSize = (file.size / 1024).toFixed(1) + ' KB';
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-800/60 p-4 backdrop-blur-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-slate-200">{file.name}</p>
        <p className="text-xs text-slate-400">{fileSize}</p>
      </div>
      <button type="button" onClick={onRemove} disabled={disabled} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── LoadingState ──────────────────────────────────────────────────
function LoadingState({ stage, uploadProgress }: { stage: 'uploading' | 'analyzing'; uploadProgress: number }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <svg className="h-6 w-6 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-200">{stage === 'uploading' ? 'Uploading...' : 'Analyzing...'}</p>
          {stage === 'uploading' && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          {stage === 'analyzing' && <p className="text-xs text-slate-400">Our AI is reviewing your content...</p>}
        </div>
      </div>
    </div>
  );
}

// ─── ResultsDashboard (full dark theme) ──────────────────────────
function ResultsDashboard({ result, sourceMimeType, onReset }: { result: AnalyzeResponse; sourceMimeType?: string; onReset: () => void }) {
  const { extractedText, analysis } = result;
  const [copied, setCopied] = useState(false);
  const usedOcr = sourceMimeType ? sourceMimeType !== 'application/pdf' : false;
  const score = analysis.score || 0;
  const breakdown = analysis.scoreBreakdown || {};
  const strengths = analysis.strengths || [];
  const weaknesses = analysis.weaknesses || [];
  const suggestions = analysis.suggestions || [];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignored */ }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">Analysis Results</h2>
        <p className="mt-1 text-sm text-slate-400">Here's how your content performs based on the extracted post content.</p>
      </div>

      {/* Score Card */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 shadow-xl shadow-blue-900/10 backdrop-blur-sm">
        <div className="flex flex-col items-center sm:flex-row sm:justify-between">
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 shrink-0">
              <svg className="h-24 w-24 -rotate-90 transform">
                <circle cx="48" cy="48" r="40" stroke="#1e293b" strokeWidth="8" fill="none" />
                <circle cx="48" cy="48" r="40" stroke="url(#scoreGrad)" strokeWidth="8" fill="none" strokeDasharray={`${(score / 100) * 251} 251`} strokeLinecap="round" />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">{score}%</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Engagement Score</p>
              <p className="text-sm text-slate-300">{score >= 80 ? 'Excellent – your content is highly engaging!' : score >= 50 ? 'Good – some areas can be improved.' : 'Needs attention – consider the suggestions below.'}</p>
            </div>
          </div>
          {sourceMimeType && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-700/50 px-3 py-1 text-xs text-slate-300 backdrop-blur sm:mt-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {usedOcr ? 'OCR extracted' : 'PDF text extracted'}
            </span>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 shadow-xl shadow-blue-900/10 backdrop-blur-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Score Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium text-white">{value}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div>
        <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400 uppercase">Content Evaluation</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </span>
              <h3 className="font-semibold text-slate-200">Strengths</h3>
            </div>
            {strengths.length === 0 ? <p className="text-sm text-slate-400">None noted.</p> : (
              <ul className="space-y-2">
                {strengths.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-200">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </span>
              <h3 className="font-semibold text-slate-200">Weaknesses</h3>
            </div>
            {weaknesses.length === 0 ? <p className="text-sm text-slate-400">None noted.</p> : (
              <ul className="space-y-2">
                {weaknesses.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-200">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </span>
          <h3 className="font-semibold text-slate-200">Recommended Improvements</h3>
        </div>
        {suggestions.length > 0 ? (
          <ol className="space-y-2.5">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 font-mono text-xs font-semibold text-sky-400">{String(i + 1).padStart(2, '0')}</span>
                <span className="leading-relaxed text-slate-300">{suggestion}</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-slate-400">None noted.</p>}
      </div>

      {/* Extracted Content */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">Extracted Content</h3>
          <button type="button" onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-600/50 hover:text-white">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375M9.75 3v3.375c0 .621-.504 1.125-1.125 1.125H5.25" />
            </svg>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="subtle-scrollbar max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
          {extractedText}
        </div>
        {usedOcr && <p className="mt-2 text-xs text-slate-500">OCR may occasionally misinterpret characters in low-quality images.</p>}
      </div>

      <div className="flex justify-center pt-2">
        <button type="button" onClick={onReset} className="rounded-xl border border-slate-600 bg-slate-700/50 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-600/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          Analyze Another Post
        </button>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────
function App() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const isBusy = status === 'uploading' || status === 'analyzing';

  useEffect(() => {
    if (result) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [result]);

  function resetAll() {
    setFile(null);
    setError(null);
    setResult(null);
    setStatus('idle');
    setUploadProgress(0);
  }

  function handleFileSelect(selected: File) {
    const validationError = validateFile(selected);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
    setResult(null);
    setStatus('idle');
  }

  function handleRemove() {
    if (isBusy) return;
    setFile(null);
    setError(null);
    setResult(null);
    setStatus('idle');
  }

  async function handleAnalyze() {
    if (!file) return;
    setStatus('uploading');
    setUploadProgress(0);
    setError(null);
    setResult(null);
    try {
      const response = await analyzeFile(file, (percent) => {
        setUploadProgress(percent);
        if (percent >= 100) setStatus('analyzing');
      });
      setResult(response);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't analyze this file. Please try again or upload another document.");
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[20%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[700px] h-[700px] rounded-full bg-indigo-600/20 blur-[140px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1100px] px-5 py-8 sm:py-12">
        {/* ─── HERO ─── */}
        <section className="relative mb-12 px-0 py-10 sm:py-14 lg:py-18">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                AI‑Powered Insights
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="bg-gradient-to-r from-blue-200 via-white to-indigo-200 bg-clip-text text-transparent">Social Media</span>
                <br className="sm:hidden" />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">Content Analyzer</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base text-slate-300/80 sm:text-lg lg:mx-0">
                Upload a screenshot or PDF of any social media post and get an instant, AI‑driven breakdown of engagement metrics, sentiment, and actionable improvement tips — all in one place.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3.5 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Engagement Score
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3.5 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Sentiment Analysis
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3.5 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Actionable Tips
                </span>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm aspect-square">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-2xl" />
                <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative w-full h-full drop-shadow-2xl">
                  <circle cx="200" cy="200" r="160" stroke="#2a3a6a" strokeWidth="2" strokeDasharray="8 8" opacity="0.5" />
                  <circle cx="200" cy="200" r="120" fill="url(#heroGrad)" opacity="0.3" />
                  <circle cx="200" cy="200" r="80" fill="url(#heroGrad2)" opacity="0.5" />
                  <g stroke="#b0c4ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M140 180 L180 180 L190 160 L210 200 L230 170 L260 190" />
                    <circle cx="140" cy="180" r="8" fill="#34d399" stroke="none" />
                    <circle cx="260" cy="190" r="8" fill="#60a5fa" stroke="none" />
                    <rect x="150" y="220" width="100" height="30" rx="6" fill="#1e293b" stroke="none" opacity="0.6" />
                    <rect x="160" y="230" width="80" height="10" rx="4" fill="#4b5563" stroke="none" opacity="0.4" />
                  </g>
                  <circle cx="120" cy="120" r="6" fill="#60a5fa" opacity="0.7" />
                  <circle cx="280" cy="140" r="6" fill="#a78bfa" opacity="0.7" />
                  <circle cx="140" cy="280" r="6" fill="#34d399" opacity="0.7" />
                  <circle cx="260" cy="270" r="6" fill="#f472b6" opacity="0.7" />
                  <defs>
                    <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="heroGrad2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* ─── UPLOAD & ANALYSIS ─── */}
        <main className="mx-auto max-w-2xl space-y-5">
          {file ? (
            <FileInfoCard file={file} onRemove={handleRemove} disabled={isBusy} />
          ) : (
            <UploadZone onFileSelect={handleFileSelect} />
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 backdrop-blur-sm px-4 py-3.5 text-sm text-red-300 shadow-lg shadow-red-500/5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {!result && (
            <button
              type="button"
              disabled={!file || isBusy}
              onClick={handleAnalyze}
              className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-medium text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:shadow-blue-600/40 hover:scale-[1.01] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
            >
              {isBusy && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              <span>{status === 'analyzing' ? 'Analyzing...' : status === 'uploading' ? 'Uploading...' : 'Analyze Post'}</span>
              {!isBusy && (
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              )}
            </button>
          )}

          {isBusy && <LoadingState stage={status === 'uploading' ? 'uploading' : 'analyzing'} uploadProgress={uploadProgress} />}
        </main>

        {/* ─── RESULTS ─── */}
        {result && (
          <div ref={resultsRef} className="mx-auto mt-10 max-w-3xl scroll-mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ResultsDashboard result={result} sourceMimeType={file?.type} onReset={resetAll} />
          </div>
        )}

        {/* ─── FOOTER ─── */}
        <footer className="mt-16 border-t border-white/5 pt-8 text-center">
          <p className="text-sm font-medium text-slate-400">Social Media Content Analyzer</p>
          <p className="mt-0.5 text-xs text-slate-500/70">AI‑powered engagement insights · Made with precision</p>
        </footer>
      </div>
    </div>
  );
}

export default App;