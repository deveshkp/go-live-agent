'use strict';

const request = require('supertest');
const app = require('../server');

// ── /api/health ────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('responds 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

// ── /api/analyze – input validation ───────────────────────────
describe('POST /api/analyze – validation', () => {
  it('returns 400 when image field is missing', async () => {
    const res = await request(app).post('/api/analyze').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('returns 400 when image is not a string', async () => {
    const res = await request(app).post('/api/analyze').send({ image: 42 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('returns 400 when image is not a data URL', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ image: 'not-a-data-url' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/data:image/);
  });
});

// ── /api/analyze – AI call (mocked) ───────────────────────────
describe('POST /api/analyze – AI integration (mocked)', () => {
  const VALID_IMAGE = 'data:image/jpeg;base64,/9j/abc123';

  beforeEach(() => {
    jest.resetModules();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    jest.restoreAllMocks();
  });

  it('returns guidance from the AI module', async () => {
    // Mock the analyzeImage module
    jest.mock('../src/analyzeImage', () => ({
      analyzeImage: jest.fn().mockResolvedValue('1. Check the router LEDs.\n2. Reboot the router.'),
    }));

    // Re-require app after mocking
    const freshApp = require('../server');
    const res = await request(freshApp)
      .post('/api/analyze')
      .send({ image: VALID_IMAGE });

    expect(res.statusCode).toBe(200);
    expect(res.body.guidance).toContain('router');
  });

  it('returns 503 when analyzeImage throws an API key error', async () => {
    jest.mock('../src/analyzeImage', () => ({
      analyzeImage: jest.fn().mockRejectedValue(
        Object.assign(new Error('Invalid API key'), { status: 401 })
      ),
    }));

    const freshApp = require('../server');
    const res = await request(freshApp)
      .post('/api/analyze')
      .send({ image: VALID_IMAGE });

    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBeTruthy();
  });

  it('returns 500 when analyzeImage throws a generic error', async () => {
    jest.mock('../src/analyzeImage', () => ({
      analyzeImage: jest.fn().mockRejectedValue(new Error('network error')),
    }));

    const freshApp = require('../server');
    const res = await request(freshApp)
      .post('/api/analyze')
      .send({ image: VALID_IMAGE });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBeTruthy();
  });
});

// ── Static file serving ────────────────────────────────────────
describe('Static files', () => {
  it('serves index.html on GET /', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.type).toMatch(/html/);
  });

  it('serves app.js on GET /app.js', async () => {
    const res = await request(app).get('/app.js');
    expect(res.statusCode).toBe(200);
    expect(res.type).toMatch(/javascript/);
  });
});
