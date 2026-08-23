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

  it('returns a parsed analysis on success', async () => {
    const payload = {
      score: 87,
      strengths: ['Clear call to action'],
      weaknesses: ['No hashtags'],
      suggestions: ['Add relevant hashtags'],
    };
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(200, geminiBodyWithText(JSON.stringify(payload))));

    const result = await analyzeText('Some post text');

    expect(result).toEqual(payload);
  });

  it('clamps an out-of-range score into 0-100', async () => {
    const payload = { score: 142, strengths: [], weaknesses: [], suggestions: [] };
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(200, geminiBodyWithText(JSON.stringify(payload))));

    const result = await analyzeText('Some post text');

    expect(result.score).toBe(100);
  });

  it('throws AppError on malformed JSON from the model', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockGeminiResponse(200, geminiBodyWithText('not json')));

    await expect(analyzeText('Some post text')).rejects.toThrow(AppError);
  });

  it('throws AppError when the response is missing expected fields', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockGeminiResponse(200, geminiBodyWithText(JSON.stringify({ score: 50 }))));

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
