import { useState } from 'react'
import type { AnalyzeResponse } from '../lib/api'
import ScoreCard from './ScoreCard'
import ContentAnalysis from './ContentAnalysis'

interface ResultsDashboardProps {
  result: AnalyzeResponse
  sourceMimeType?: string
  onReset: () => void
}

function CheckIcon() {
  return <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
}

function WarningIcon() {
  return (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
    />
  )
}

function BulbIcon() {
  return (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
    />
  )
}

function CopyIcon() {
  return (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375M9.75 3v3.375c0 .621-.504 1.125-1.125 1.125H5.25"
    />
  )
}

function ItemList({ items, tone }: { items: string[]; tone: 'positive' | 'negative' }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">None noted.</p>
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'positive' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ResultsDashboard({ result, sourceMimeType, onReset }: ResultsDashboardProps) {
  const { extractedText, analysis } = result
  const [copied, setCopied] = useState(false)
  const usedOcr = sourceMimeType ? sourceMimeType !== 'application/pdf' : false

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(extractedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard access denied; no-op
    }
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Analysis Results</h2>
        <p className="mt-1 text-sm text-slate-500">
          Here's how your content performs based on the extracted post content.
        </p>
      </div>

      <ScoreCard score={analysis.score} />

      <ContentAnalysis breakdown={analysis.scoreBreakdown} />

      <div>
        <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Content Evaluation
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <CheckIcon />
                </svg>
              </span>
              <h3 className="font-semibold text-slate-800">Strengths</h3>
            </div>
            <ItemList items={analysis.strengths} tone="positive" />
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/40 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <WarningIcon />
                </svg>
              </span>
              <h3 className="font-semibold text-slate-800">Weaknesses</h3>
            </div>
            <ItemList items={analysis.weaknesses} tone="negative" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <BulbIcon />
            </svg>
          </span>
          <h3 className="font-semibold text-slate-800">Recommended Improvements</h3>
        </div>
        {analysis.suggestions.length > 0 ? (
          <ol className="space-y-2.5">
            {analysis.suggestions.map((suggestion, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 font-mono text-xs font-semibold text-sky-500">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="leading-relaxed text-slate-700">{suggestion}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-400">None noted.</p>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">Extracted Content</h3>
            {sourceMimeType && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {usedOcr ? 'OCR extracted' : 'PDF text extracted'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <CopyIcon />
            </svg>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="subtle-scrollbar max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
          {extractedText}
        </div>
        {usedOcr && (
          <p className="mt-2 text-xs text-slate-400">
            OCR may occasionally misinterpret characters in low-quality images.
          </p>
        )}
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Analyze Another Post
        </button>
      </div>
    </div>
  )
}
