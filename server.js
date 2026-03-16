'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { analyzeImage } = require('./src/analyzeImage');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limit all requests: 120 per minute per IP (generous for the UI)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for the AI endpoint: 20 per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});

app.use(globalLimiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/analyze', apiLimiter);

/**
 * POST /api/analyze
 * Accepts a base64-encoded image and returns AI-powered home-fix guidance.
 *
 * Body: { image: "<base64 data URL>" }
 * Response: { guidance: "<string>" }
 */
app.post('/api/analyze', async (req, res) => {
  const { image } = req.body;

  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid image field.' });
  }

  if (!image.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Image must be a base64 data URL (data:image/...).' });
  }

  try {
    const guidance = await analyzeImage(image);
    return res.json({ guidance });
  } catch (err) {
    console.error('analyzeImage error:', err.message);
    if (err.status === 401 || (err.message && err.message.includes('API key'))) {
      return res.status(503).json({ error: 'AI service unavailable. Check OPENAI_API_KEY.' });
    }
    return res.status(500).json({ error: 'Failed to analyse image. Please try again.' });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve the SPA for any other path
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Only listen when run directly (not during tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Go-live agent running on http://localhost:${PORT}`);
  });
}

module.exports = app;
