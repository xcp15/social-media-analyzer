import { PDFDocument, StandardFonts } from 'pdf-lib';

export async function buildTestPdf(text: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const size = 14;
  const width = font.widthOfTextAtSize(text, size) + 40;
  const page = doc.addPage([width, 150]);
  page.drawText(text, { x: 20, y: 100, size, font });
  const bytes = await doc.save();
  return Buffer.from(bytes);
}
