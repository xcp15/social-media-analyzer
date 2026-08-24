// src/components/ResultsDashboard.tsx
import { useState } from 'react';
import type { AnalyzeResponse } from '../lib/api';

interface ResultsDashboardProps {
  result: AnalyzeResponse;
  sourceMimeType?: string;
  onReset: () => void;
}

// ─── Icon components ──────────────────────────────────────────────
function CheckIcon() {
  return (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 12.75 6 6 9-13.5"
    />
  );
}

function WarningIcon() {
  return (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
    />
  );
}

function BulbIcon() {
  return (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
    />
  );
}

function CopyIcon() {
  return (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375M9.75 3v3.375c0 .621-.504 1.125-1.125 1.125H5.25"
    />
  );
}

// ─── Helper: Item list for strengths/weaknesses ────────────────
function ItemList({ items, tone }: { items: string[]; tone: 'positive' | 'negative' }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">None noted.</p>;
  }
  const dotColor = tone === 'positive' ? 'bg-emerald-400' : 'bg-rose-400';
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-200">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function ResultsDashboard({
  result,
  sourceMimeType,
  onReset,
}: ResultsDashboardProps) {
  const { extractedText, analysis } = result;
  const [copied, setCopied] = useState(false);
  const usedOcr = sourceMimeType ? sourceMimeType !== 'application/pdf' : false;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignored
    }
  }

  // Destructure analysis data
  const score = analysis.score || 0;
  const breakdown = analysis.scoreBreakdown || {};
  const strengths = analysis.strengths || [];
  const weaknesses = analysis.weaknesses || [];
  const suggestions = analysis.suggestions || [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ─── Header ─── */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
          Analysis Results
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Here's how your content performs based on the extracted post content.
        </p>
      </div>

      {/* ─── Score Card ─── */}
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#0f172a] to-[#1a2444] p-6 shadow-xl shadow-blue-900/10">
        <div className="flex flex-col items-center sm:flex-row sm:justify-between">
          <div className="flex items-center gap-6">
            {/* Circular score */}
            <div className="relative h-24 w-24 shrink-0">
              <svg className="h-24 w-24 -rotate-90 transform">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#1e293b"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="url(#scoreGrad)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(score / 100) * 251} 251`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
                {score}%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Engagement Score</p>
              <p className="text-sm text-slate-300">
                {score >= 80
                  ? 'Excellent – your content is highly engaging!'
                  : score >= 50
                  ? 'Good – some areas can be improved.'
                  : 'Needs attention – consider the suggestions below.'}
              </p>
            </div>
          </div>
          {sourceMimeType && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 backdrop-blur sm:mt-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {usedOcr ? 'OCR extracted' : 'PDF text extracted'}
            </span>
          )}
        </div>
      </div>

      {/* ─── Score Breakdown ─── */}
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#0f172a] to-[#1a2444] p-6 shadow-xl shadow-blue-900/10">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Score Breakdown
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium text-white">{value}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Strengths & Weaknesses ─── */}
      <div>
        <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Content Evaluation
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Strengths */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <CheckIcon />
                </svg>
              </span>
              <h3 className="font-semibold text-slate-200">Strengths</h3>
            </div>
            <ItemList items={strengths} tone="positive" />
          </div>

          {/* Weaknesses */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <WarningIcon />
                </svg>
              </span>
              <h3 className="font-semibold text-slate-200">Weaknesses</h3>
            </div>
            <ItemList items={weaknesses} tone="negative" />
          </div>
        </div>
      </div>

      {/* ─── Suggestions ─── */}
      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <BulbIcon />
            </svg>
          </span>
          <h3 className="font-semibold text-slate-200">Recommended Improvements</h3>
        </div>
        {suggestions.length > 0 ? (
          <ol className="space-y-2.5">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 font-mono text-xs font-semibold text-sky-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="leading-relaxed text-slate-300">{suggestion}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-400">None noted.</p>
        )}
      </div>

      {/* ─── Extracted Content ─── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">Extracted Content</h3>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <CopyIcon />
            </svg>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="subtle-scrollbar max-h-48 overflow-y-auto rounded-xl border border-white/5 bg-[#0f172a]/50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
          {extractedText}
        </div>
        {usedOcr && (
          <p className="mt-2 text-xs text-slate-500">
            OCR may occasionally misinterpret characters in low-quality images.
          </p>
        )}
      </div>

      {/* ─── Reset Button ─── */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Analyze Another Post
        </button>
      </div>
    </div>
  );
}