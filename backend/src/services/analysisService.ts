import { AppError } from '../errors';

export interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 20_000;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    score: { type: 'INTEGER', minimum: 0, maximum: 100 },
    strengths: { type: 'ARRAY', items: { type: 'STRING' } },
    weaknesses: { type: 'ARRAY', items: { type: 'STRING' } },
    suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['score', 'strengths', 'weaknesses', 'suggestions'],
};

export function buildPrompt(text: string): string {
  return `You are a social media growth expert. Analyze the following social media post text and evaluate its likely audience engagement.

Post text:
"""
${text}
"""

Respond with ONLY a JSON object (no markdown, no commentary) with this exact shape:
{
  "score": <integer 0-100, overall engagement potential>,
  "strengths": [<short strings describing what the post does well>],
  "weaknesses": [<short strings describing what could hurt engagement>],
  "suggestions": [<short, actionable strings to improve the post>]
}`;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function parseAnalysis(raw: string): AnalysisResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError(502, 'The AI returned an unexpected response. Please try again.');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).score !== 'number' ||
    !isStringArray((parsed as Record<string, unknown>).strengths) ||
    !isStringArray((parsed as Record<string, unknown>).weaknesses) ||
    !isStringArray((parsed as Record<string, unknown>).suggestions)
  ) {
    throw new AppError(502, 'The AI returned an unexpected response. Please try again.');
  }

  const result = parsed as AnalysisResult;
  return {
    score: Math.max(0, Math.min(100, Math.round(result.score))),
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    suggestions: result.suggestions,
  };
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError(500, 'Analysis service is not configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(text) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AppError(504, 'The AI analysis timed out. Please try again.');
    }
    throw new AppError(502, 'Could not reach the AI analysis service. Please try again.');
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    throw new AppError(429, 'The AI service is rate-limited right now. Please try again shortly.');
  }
  if (!response.ok) {
    throw new AppError(502, 'The AI analysis service returned an error. Please try again.');
  }

  const body = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const analysisText = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof analysisText !== 'string' || !analysisText.trim()) {
    throw new AppError(502, 'The AI returned an empty response. Please try again.');
  }

  return parseAnalysis(analysisText);
}
