import type { AnalyzeResponse } from '../lib/api'

interface ResultsDashboardProps {
  result: AnalyzeResponse
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-600 bg-emerald-50 ring-emerald-200'
  if (score >= 40) return 'text-amber-600 bg-amber-50 ring-amber-200'
  return 'text-red-600 bg-red-50 ring-red-200'
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 font-medium text-slate-800">{title}</h3>
      {items.length > 0 ? (
        <ul className="space-y-1.5 text-sm text-slate-600">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-slate-300">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">None noted.</p>
      )}
    </div>
  )
}

export default function ResultsDashboard({ result }: ResultsDashboardProps) {
  const { extractedText, analysis } = result

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold ring-4 ${scoreColor(analysis.score)}`}
        >
          {analysis.score}
        </div>
        <div>
          <p className="font-medium text-slate-800">Engagement Score</p>
          <p className="text-sm text-slate-400">Out of 100</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-2 font-medium text-slate-800">Extracted Text</h3>
        <div className="max-h-40 overflow-y-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-600 whitespace-pre-wrap">
          {extractedText}
        </div>
      </div>

      <ListSection title="Strengths" items={analysis.strengths} />
      <ListSection title="Weaknesses" items={analysis.weaknesses} />
      <ListSection title="Suggestions" items={analysis.suggestions} />
    </div>
  )
}
