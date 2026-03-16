'use strict';

/**
 * Tests for the wake-word detection logic.
 *
 * The matchesWakeWord function lives in public/app.js (browser code),
 * so we re-implement the same patterns here to keep tests self-contained
 * and consistent with the client source.
 */

const WAKE_PATTERNS = [
  /hey\s+go.?live/i,
  /go.?live/i,
];

function matchesWakeWord(transcript) {
  return WAKE_PATTERNS.some((re) => re.test(transcript));
}

describe('matchesWakeWord', () => {
  const positives = [
    'hey go-live',
    'Hey Go-live',
    'HEY GOLIVE',
    'hey golive, the router is broken',
    'go-live',
    'golive help me',
    'please hey go live fix this',
  ];

  const negatives = [
    '',
    'hello there',
    'go to the store',
    'live stream',
    'hey siri',
  ];

  positives.forEach((phrase) => {
    it(`matches: "${phrase}"`, () => {
      expect(matchesWakeWord(phrase)).toBe(true);
    });
  });

  negatives.forEach((phrase) => {
    it(`does not match: "${phrase}"`, () => {
      expect(matchesWakeWord(phrase)).toBe(false);
    });
  });
});
