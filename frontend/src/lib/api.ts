export interface ScoreBreakdown {
  hook: number | null
  clarity: number | null
  callToAction: number | null
  visualAppeal: number | null
  engagementPotential: number | null
}

export interface AnalysisResult {
  score: number
  scoreBreakdown: ScoreBreakdown
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

export interface AnalyzeResponse {
  extractedText: string
  analysis: AnalysisResult
}

const REQUEST_TIMEOUT_MS = 60_000
const GENERIC_ERROR = 'Something went wrong. Please try again.'

export function analyzeFile(
  file: File,
  onUploadProgress?: (percent: number) => void,
): Promise<AnalyzeResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/analyze')
    xhr.timeout = REQUEST_TIMEOUT_MS

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onUploadProgress) {
        onUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      let body: { error?: string } & Partial<AnalyzeResponse> = {}
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        reject(new Error(GENERIC_ERROR))
        return
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as AnalyzeResponse)
      } else {
        reject(new Error(body.error || GENERIC_ERROR))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error. Please check your connection and try again.'))
    }

    xhr.ontimeout = () => {
      reject(new Error('The request took too long. Please try again.'))
    }

    xhr.send(formData)
  })
}
