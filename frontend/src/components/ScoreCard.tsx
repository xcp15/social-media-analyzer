function scoreTheme(score: number) {
  if (score >= 80) return { ring: '#059669', text: 'text-emerald-700', label: 'Excellent' }
  if (score >= 60) return { ring: '#16a34a', text: 'text-green-700', label: 'Good' }
  if (score >= 30) return { ring: '#d97706', text: 'text-amber-700', label: 'Moderate' }
  return { ring: '#dc2626', text: 'text-red-700', label: 'Weak' }
}

interface ScoreCardProps {
  score: number
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  const theme = scoreTheme(score)

  return (
    <div className="animate-fade-in-up rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Engagement Score</p>

      <div className="relative mx-auto mt-4 h-28 w-28">
        <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="9" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={theme.ring}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{score}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>

      <p className={`mt-3 text-base font-semibold ${theme.text}`}>{theme.label}</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-slate-400">
        Overall engagement potential of the post
      </p>
    </div>
  )
}
