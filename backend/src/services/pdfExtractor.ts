import { PDFParse } from 'pdf-parse';
import { AppError } from '../errors';

const MIN_TEXT_LENGTH = 20;

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  let text: string;
  try {
    const result = await parser.getText();
    text = result.text.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '').trim();
  } catch {
    throw new AppError(422, 'Could not read this PDF — it may be corrupted or password-protected.');
  } finally {
    await parser.destroy();
  }

  if (text.length < MIN_TEXT_LENGTH) {
    throw new AppError(
      422,
      "No readable text found in this PDF. If it's a scanned document, try uploading it as an image (JPG/PNG) instead.",
    );
  }

  return text;
}
