import multer from 'multer';
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../constants';
import { AppError } from '../errors';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
      cb(new AppError(400, 'Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG file.'));
      return;
    }
    cb(null, true);
  },
});
