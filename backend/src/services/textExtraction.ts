import type { Express } from 'express';
import { extractPdfText } from './pdfExtractor';
import { extractImageText } from './imageExtractor';
import { AppError } from '../errors';

export async function extractText(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === 'application/pdf') {
    return extractPdfText(file.buffer);
  }
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    return extractImageText(file.buffer);
  }
  throw new AppError(400, 'Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG file.');
}
