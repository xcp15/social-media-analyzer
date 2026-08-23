import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeText } from '../services/analysisService';
import { AppError } from '../errors';

function mockGeminiResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function geminiBodyWithText(text: string) {
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

describe('analyzeText', () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalKey;
    vi.restoreAllMocks();
  });

  it('returns a parsed analysis with a score computed from the breakdown', async () => {
    const payload = {
      scoreBreakdown: { hook: 80, clarity: 90, callToAction: 70, visualAppeal: 60, engagementPotential: 85 },
      strengths: ['Clear call to action'],
      weaknesses: ['No hashtags'],
      suggestions: ['Add relevant hashtags'],
    };
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(200, geminiBodyWithText(JSON.stringify(payload))));

    const result = await analyzeText('Some post text', {
      buffer: Buffer.from('fake'),
      mimeType: 'image/png',
    });

    // weighted average: hook .25, clarity .2, cta .2, visual .15, engagement .2
    const expectedScore = Math.round(80 * 0.25 + 90 * 0.2 + 70 * 0.2 + 60 * 0.15 + 85 * 0.2);
    expect(result.score).toBe(expectedScore);
    expect(result.scoreBreakdown).toEqual(payload.scoreBreakdown);
    expect(result.strengths).toEqual(payload.strengths);
  });

  it('redistributes weight when visualAppeal is unavailable (no image, e.g. PDF text)', async () => {
    const payload = {
      scoreBreakdown: { hook: 80, clarity: 80, callToAction: 80, engagementPotential: 80 },
      strengths: [],
      weaknesses: [],
      suggestions: [],
    };
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(200, geminiBodyWithText(JSON.stringify(payload))));

    const result = await analyzeText('Some post text');

    expect(result.scoreBreakdown.visualAppeal).toBeNull();
    expect(result.score).toBe(80);
  });

  it('clamps out-of-range dimension scores into 0-100', async () => {
    const payload = {
      scoreBreakdown: { hook: -10, clarity: 200, callToAction: 50, engagementPotential: 50 },
      strengths: [],
      weaknesses: [],
      suggestions: [],
    };
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(200, geminiBodyWithText(JSON.stringify(payload))));

    const result = await analyzeText('Some post text');

    expect(result.scoreBreakdown.hook).toBe(0);
    expect(result.scoreBreakdown.clarity).toBe(100);
  });

  it('gracefully drops an individual malformed dimension instead of failing outright', async () => {
    const payload = {
      scoreBreakdown: { hook: 'not a number', clarity: 80, callToAction: 80, engagementPotential: 80 },
      strengths: [],
      weaknesses: [],
      suggestions: [],
    };
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(200, geminiBodyWithText(JSON.stringify(payload))));

    const result = await analyzeText('Some post text');

    expect(result.scoreBreakdown.hook).toBeNull();
    expect(result.score).toBe(80);
  });

  it('throws AppError when the entire breakdown is missing/invalid', async () => {
    const payload = { strengths: [], weaknesses: [], suggestions: [] };
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(200, geminiBodyWithText(JSON.stringify(payload))));

    await expect(analyzeText('Some post text')).rejects.toThrow(AppError);
  });

  it('throws AppError when strengths/weaknesses/suggestions are missing', async () => {
    const payload = { scoreBreakdown: { hook: 50, clarity: 50, callToAction: 50, engagementPotential: 50 } };
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(200, geminiBodyWithText(JSON.stringify(payload))));

    await expect(analyzeText('Some post text')).rejects.toThrow(AppError);
  });

  it('throws AppError on malformed JSON from the model', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(200, geminiBodyWithText('not json')));

    await expect(analyzeText('Some post text')).rejects.toThrow(AppError);
  });

  it('throws AppError on an empty candidate response', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(200, { candidates: [] }));

    await expect(analyzeText('Some post text')).rejects.toThrow(AppError);
  });

  it('throws a rate-limit AppError on HTTP 429', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(429, {}));

    await expect(analyzeText('Some post text')).rejects.toThrow(AppError);
  });

  it('throws AppError on a generic HTTP failure', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(500, {}));

    await expect(analyzeText('Some post text')).rejects.toThrow(AppError);
  });

  it('throws AppError on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'));

    await expect(analyzeText('Some post text')).rejects.toThrow(AppError);
  });

  it('throws AppError when the API key is not configured', async () => {
    delete process.env.GEMINI_API_KEY;
    global.fetch = vi.fn();

    await expect(analyzeText('Some post text')).rejects.toThrow(AppError);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
