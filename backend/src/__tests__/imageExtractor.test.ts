import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../errors';

const recognize = vi.fn();
const terminate = vi.fn();

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(async () => ({ recognize, terminate })),
}));

describe('extractImageText', () => {
  beforeEach(() => {
    recognize.mockReset();
    terminate.mockReset();
  });

  it('returns trimmed text on success', async () => {
    recognize.mockResolvedValue({ data: { text: '  Big Launch Today  ' } });
    const { extractImageText } = await import('../services/imageExtractor');

    const text = await extractImageText(Buffer.from('fake-image'));

    expect(text).toBe('Big Launch Today');
    expect(terminate).toHaveBeenCalled();
  });

  it('throws when OCR finds no text', async () => {
    recognize.mockResolvedValue({ data: { text: '   ' } });
    const { extractImageText } = await import('../services/imageExtractor');

    await expect(extractImageText(Buffer.from('fake-image'))).rejects.toThrow(AppError);
    expect(terminate).toHaveBeenCalled();
  });

  it('wraps OCR engine failures in an AppError', async () => {
    recognize.mockRejectedValue(new Error('engine crashed'));
    const { extractImageText } = await import('../services/imageExtractor');

    await expect(extractImageText(Buffer.from('fake-image'))).rejects.toThrow(AppError);
    expect(terminate).toHaveBeenCalled();
  });
});
