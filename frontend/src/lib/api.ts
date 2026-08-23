export interface AnalysisResult {
  score: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

export interface AnalyzeResponse {
  extractedText: string
  analysis: AnalysisResult
}

export async function analyzeFile(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(body?.error || 'Something went wrong. Please try again.')
  }

  return body as AnalyzeResponse
}
