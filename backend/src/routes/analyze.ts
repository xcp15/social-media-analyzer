import { Router } from 'express';
import { upload } from '../middleware/upload';
import { extractText } from '../services/textExtraction';
import { AppError } from '../errors';

const router = Router();

router.post('/analyze', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded.');
    }
    const extractedText = await extractText(req.file);
    res.json({ extractedText });
  } catch (err) {
    next(err);
  }
});

export default router;
