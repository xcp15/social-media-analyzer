import { describe, it, expect } from 'vitest';
import { extractPdfText } from '../services/pdfExtractor';
import { buildTestPdf } from './fixtures/buildPdf';
import { AppError } from '../errors';

describe('extractPdfText', () => {
  it('extracts text from a valid PDF', async () => {
    const pdf = await buildTestPdf('This is a test social media post about our launch.');
    const text = await extractPdfText(pdf);
    expect(text).toContain('This is a test social media post about our launch.');
  });

  it('throws for a corrupted PDF', async () => {
    const garbage = Buffer.from('not a real pdf');
    await expect(extractPdfText(garbage)).rejects.toThrow(AppError);
  });

  it('throws when extracted text is too short (likely scanned)', async () => {
    const pdf = await buildTestPdf('Hi');
    await expect(extractPdfText(pdf)).rejects.toThrow(AppError);
  });
});
