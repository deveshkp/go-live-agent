'use strict';

// Prefix with "mock" so Jest hoisting allows the reference inside jest.mock()
const mockGuidance = 'Step 1: Flip the breaker to Off.\nStep 2: Reset the GFCI outlet.';

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: mockGuidance } }],
        }),
      },
    },
  }));
});

const { analyzeImage, SYSTEM_PROMPT } = require('../src/analyzeImage');

const VALID_IMAGE = 'data:image/jpeg;base64,/9j/abc123';

describe('analyzeImage – OPENAI_API_KEY missing', () => {
  const savedKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (savedKey) process.env.OPENAI_API_KEY = savedKey;
  });

  it('throws an error with status 401 when API key is not set', async () => {
    await expect(analyzeImage(VALID_IMAGE)).rejects.toMatchObject({ status: 401 });
  });
});

describe('analyzeImage – with mocked OpenAI client', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('returns the guidance text from the OpenAI response', async () => {
    const result = await analyzeImage(VALID_IMAGE);
    expect(result).toBe(mockGuidance);
  });

  it('throws when OpenAI returns an empty choices array', async () => {
    const OpenAI = require('openai');
    OpenAI.mockImplementationOnce(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({ choices: [] }),
        },
      },
    }));
    await expect(analyzeImage(VALID_IMAGE)).rejects.toThrow('Empty response from OpenAI');
  });
});

describe('SYSTEM_PROMPT', () => {
  it('mentions safety', () => {
    expect(SYSTEM_PROMPT).toMatch(/safety/i);
  });

  it('mentions step-by-step', () => {
    expect(SYSTEM_PROMPT).toMatch(/step/i);
  });
});
