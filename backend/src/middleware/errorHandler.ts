import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '../errors';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File is too large. Maximum size is 10MB.' });
      return;
    }
    res.status(400).json({ error: 'File upload failed.' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
};
