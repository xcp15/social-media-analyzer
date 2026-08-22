import { createWorker } from 'tesseract.js';
import { AppError } from '../errors';

export async function extractImageText(buffer: Buffer): Promise<string> {
  const worker = await createWorker('eng');
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    const trimmed = text.trim();

    if (!trimmed) {
      throw new AppError(422, 'No readable text found in this image.');
    }

    return trimmed;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(422, 'OCR failed to process this image.');
  } finally {
    await worker.terminate();
  }
}
