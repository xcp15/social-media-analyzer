import { AppError } from '../errors';

export interface ScoreBreakdown {
  hook: number | null;
  clarity: number | null;
  callToAction: number | null;
  visualAppeal: number | null;
  engagementPotential: number | null;
}

export interface AnalysisResult {
  score: number;
  scoreBreakdown: ScoreBreakdown;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface AnalysisImage {
  buffer: Buffer;
  mimeType: string;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * The overall engagement score is not asked of the model directly — it is
 * computed here as a weighted average of the five dimension scores below,
 * so the headline number always tells the same story as its breakdown.
 *
 * `visualAppeal` can only be judged when the model actually sees the image
 * (see `buildPrompt`/`analyzeText`). When it's unavailable (PDF-extracted
 * text, or the model omitted it), its weight is redistributed
 * proportionally across the remaining dimensions rather than penalizing
 * the post for something that was never assessed.
 */
const SCORE_WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  hook: 0.25,
  clarity: 0.2,
  callToAction: 0.2,
  visualAppeal: 0.15,
  engagementPotential: 0.2,
};

const DIMENSION_KEYS = Object.keys(SCORE_WEIGHTS) as (keyof ScoreBreakdown)[];

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computeOverallScore(breakdown: ScoreBreakdown): number {
  const available = DIMENSION_KEYS.filter((key) => breakdown[key] !== null);
  const totalWeight = available.reduce((sum, key) => sum + SCORE_WEIGHTS[key], 0);

  if (totalWeight === 0) {
    throw new AppError(502, 'The AI returned an unexpected response. Please try again.');
  }

  const weightedSum = available.reduce(
    (sum, key) => sum + (breakdown[key] as number) * SCORE_WEIGHTS[key],
    0,
  );
  return clampScore(weightedSum / totalWeight);
}

export function buildPrompt(text: string, hasImage: boolean): string {
  const visualLine = hasImage
    ? '- visualAppeal: composition, readability of any on-image text, visual hierarchy, and whether the image supports the message.'
    : '(no image is available for this post — do not include "visualAppeal" in the response at all; do not guess a value for it)';

  return `You are a social media growth expert. Analyze the following social media post${hasImage ? ', including the attached image,' : ''} across specific dimensions.

Post text:
"""
${text}
"""

Score each applicable dimension from 0-100:
- hook: does the opening immediately capture attention and create curiosity?
- clarity: how clear, readable, and easy to understand is the message?
- callToAction: does the post ask the audience to do something specific (comment, share, click, etc.)? Score low if there is no call to action.
${visualLine}
- engagementPotential: overall likelihood of likes/comments/shares, considering the whole post (not a duplicate of the other scores).

Respond with ONLY a JSON object (no markdown, no commentary) with this exact shape:
{
  "scoreBreakdown": {
    "hook": <integer 0-100>,
    "clarity": <integer 0-100>,
    "callToAction": <integer 0-100>${hasImage ? ',\n    "visualAppeal": <integer 0-100>' : ''},
    "engagementPotential": <integer 0-100>
  },
  "strengths": [<short strings describing what the post does well>],
  "weaknesses": [<short strings describing what could hurt engagement>],
  "suggestions": [<short, actionable strings to improve the post>]
}`;
}

function buildResponseSchema(hasImage: boolean) {
  const properties: Record<string, unknown> = {
    hook: { type: 'INTEGER', minimum: 0, maximum: 100 },
    clarity: { type: 'INTEGER', minimum: 0, maximum: 100 },
    callToAction: { type: 'INTEGER', minimum: 0, maximum: 100 },
    engagementPotential: { type: 'INTEGER', minimum: 0, maximum: 100 },
  };
  const required = ['hook', 'clarity', 'callToAction', 'engagementPotential'];

  if (hasImage) {
    properties.visualAppeal = { type: 'INTEGER', minimum: 0, maximum: 100 };
    required.push('visualAppeal');
  }

  return {
    type: 'OBJECT',
    properties: {
      scoreBreakdown: { type: 'OBJECT', properties, required },
      strengths: { type: 'ARRAY', items: { type: 'STRING' } },
      weaknesses: { type: 'ARRAY', items: { type: 'STRING' } },
      suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['scoreBreakdown', 'strengths', 'weaknesses', 'suggestions'],
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function parseScoreBreakdown(raw: unknown): ScoreBreakdown {
  const obj = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const breakdown = {} as ScoreBreakdown;
  for (const key of DIMENSION_KEYS) {
    const value = obj[key];
    breakdown[key] = typeof value === 'number' && Number.isFinite(value) ? clampScore(value) : null;
  }
  return breakdown;
}

function parseAnalysis(raw: string): AnalysisResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError(502, 'The AI returned an unexpected response. Please try again.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new AppError(502, 'The AI returned an unexpected response. Please try again.');
  }

  const record = parsed as Record<string, unknown>;
  if (
    !isStringArray(record.strengths) ||
    !isStringArray(record.weaknesses) ||
    !isStringArray(record.suggestions)
  ) {
    throw new AppError(502, 'The AI returned an unexpected response. Please try again.');
  }

  const scoreBreakdown = parseScoreBreakdown(record.scoreBreakdown);
  const score = computeOverallScore(scoreBreakdown);

  return {
    score,
    scoreBreakdown,
    strengths: record.strengths,
    weaknesses: record.weaknesses,
    suggestions: record.suggestions,
  };
}

export async function analyzeText(text: string, image?: AnalysisImage): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError(500, 'Analysis service is not configured.');
  }

  const hasImage = !!image;
  const parts: Record<string, unknown>[] = [{ text: buildPrompt(text, hasImage) }];
  if (image) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.buffer.toString('base64') } });
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
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: buildResponseSchema(hasImage),
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
