import { Router } from 'express';
import { upload } from '../middleware/upload';
import { extractText } from '../services/textExtraction';
import { analyzeText } from '../services/analysisService';
import { AppError } from '../errors';

const router = Router();

router.post('/analyze', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded.');
    }
    const extractedText = await extractText(req.file);
    const isImage = req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/png';
    const analysis = await analyzeText(
      extractedText,
      isImage ? { buffer: req.file.buffer, mimeType: req.file.mimetype } : undefined,
    );
    res.json({ extractedText, analysis });
  } catch (err) {
    next(err);
  }
});

export default router;
