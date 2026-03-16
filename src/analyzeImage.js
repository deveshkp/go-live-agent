'use strict';

const OpenAI = require('openai');

const SYSTEM_PROMPT = `You are Go-live, a concise and practical AI home-repair assistant.
The user will send you a photo of a household problem (e.g. router, circuit-breaker panel, door lock, garage door, hinge, or similar).
Your job is to:
1. Identify the item or problem you see.
2. Give clear, numbered, step-by-step instructions to fix or troubleshoot it.
3. Mention any safety warnings if relevant (e.g. electrical panels: do NOT touch live wires).
4. Keep your answer under 200 words so it fits on a small phone screen.
If the image does not show a home/appliance problem, politely ask the user to point the camera at the issue.`;

/**
 * Sends a base64 image to OpenAI Vision and returns step-by-step guidance.
 *
 * @param {string} imageDataUrl - data URL, e.g. "data:image/jpeg;base64,..."
 * @returns {Promise<string>} guidance text
 */
async function analyzeImage(imageDataUrl) {
  if (!process.env.OPENAI_API_KEY) {
    throw Object.assign(new Error('OPENAI_API_KEY is not set'), { status: 401 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 512,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageDataUrl, detail: 'low' },
          },
          {
            type: 'text',
            text: 'What do you see and how do I fix or troubleshoot it?',
          },
        ],
      },
    ],
  });

  const guidance = response.choices?.[0]?.message?.content;
  if (!guidance) {
    throw new Error('Empty response from OpenAI');
  }
  return guidance;
}

module.exports = { analyzeImage, SYSTEM_PROMPT };
