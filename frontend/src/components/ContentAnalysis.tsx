import type { ScoreBreakdown } from '../lib/api'

interface ContentAnalysisProps {
  breakdown: ScoreBreakdown
}

const LABELS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: 'hook', label: 'Hook' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'callToAction', label: 'Call to Action' },
  { key: 'visualAppeal', label: 'Visual Appeal' },
  { key: 'engagementPotential', label: 'Engagement Potential' },
]

function barColor(score: number) {
  if (score >= 85) return 'bg-emerald-500'
  if (score >= 70) return 'bg-green-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

export default function ContentAnalysis({ breakdown }: ContentAnalysisProps) {
  const dimensions = LABELS.filter(({ key }) => breakdown[key] !== null)

  if (dimensions.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-slate-800">Content Analysis</h3>
      <div className="space-y-3">
        {dimensions.map(({ key, label }) => {
          const value = breakdown[key] as number
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-sm text-slate-600">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${barColor(value)}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-sm font-medium text-slate-700">
                {value}/100
              </span>
            </div>
          )
        })}
      </div>
      {LABELS.some(({ key }) => breakdown[key] === null) && (
        <p className="mt-3 text-xs text-slate-400">
          Visual Appeal isn't scored for PDF text — no image was available to evaluate.
        </p>
      )}
    </div>
  )
}
