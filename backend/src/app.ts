import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', analyzeRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use(errorHandler);

export default app;
