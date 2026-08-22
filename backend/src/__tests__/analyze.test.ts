import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { buildTestPdf } from './fixtures/buildPdf';
import { MAX_FILE_SIZE_BYTES } from '../constants';

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(async () => ({
    recognize: vi.fn(async () => ({ data: { text: 'Big Launch Today' } })),
    terminate: vi.fn(async () => {}),
  })),
}));

describe('POST /api/analyze', () => {
  it('extracts text from a valid PDF upload', async () => {
    const { default: app } = await import('../app');
    const pdf = await buildTestPdf('This is a test social media post about our launch.');

    const res = await request(app)
      .post('/api/analyze')
      .attach('file', pdf, { filename: 'post.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body.extractedText).toContain('This is a test social media post about our launch.');
  });

  it('extracts text from a valid image upload', async () => {
    const { default: app } = await import('../app');

    const res = await request(app)
      .post('/api/analyze')
      .attach('file', Buffer.from('fake-image-bytes'), {
        filename: 'post.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(200);
    expect(res.body.extractedText).toBe('Big Launch Today');
  });

  it('rejects an unsupported file type', async () => {
    const { default: app } = await import('../app');

    const res = await request(app)
      .post('/api/analyze')
      .attach('file', Buffer.from('plain text'), {
        filename: 'post.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('rejects an oversized file', async () => {
    const { default: app } = await import('../app');
    const oversized = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1);

    const res = await request(app)
      .post('/api/analyze')
      .attach('file', oversized, { filename: 'post.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('rejects a request with no file', async () => {
    const { default: app } = await import('../app');

    const res = await request(app).post('/api/analyze');

    expect(res.status).toBe(400);
  });
});
