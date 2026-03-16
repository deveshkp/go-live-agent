/**
 * Go-live – client-side application
 *
 * Responsibilities:
 *  1. Start the device camera (rear-facing on mobile).
 *  2. Listen continuously for the wake phrase "Hey Go-live".
 *  3. On wake-word (or manual shutter tap), capture a video frame.
 *  4. POST the frame to /api/analyze and display the AI guidance.
 *  5. Optionally read the guidance aloud via Web Speech Synthesis.
 */

/* ── DOM references ─────────────────────────────────────────── */
const videoEl          = document.getElementById('camera');
const canvasEl         = document.getElementById('capture-canvas');
const statusBadge      = document.getElementById('status-badge');
const startOverlay     = document.getElementById('start-overlay');
const startBtn         = document.getElementById('start-btn');
const captureControls  = document.getElementById('capture-controls');
const manualCaptureBtn = document.getElementById('manual-capture-btn');
const guidancePanel    = document.getElementById('guidance-panel');
const guidanceText     = document.getElementById('guidance-text');
const closePanelBtn    = document.getElementById('close-panel-btn');
const speakBtn         = document.getElementById('speak-btn');
const newScanBtn       = document.getElementById('new-scan-btn');
const loadingOverlay   = document.getElementById('loading-overlay');

/* ── State ──────────────────────────────────────────────────── */
let recognition  = null;   // SpeechRecognition instance
let stream       = null;   // MediaStream from camera
let isAnalysing  = false;  // guard against double-triggers
let lastGuidance = '';     // most recent AI response

/* ── Wake-word patterns ─────────────────────────────────────── */
const WAKE_PATTERNS = [
  /hey\s+go.?live/i,
  /go.?live/i,
];

/**
 * Returns true if the transcript contains a wake-word phrase.
 * Exported on window so unit tests can reach it.
 */
function matchesWakeWord(transcript) {
  return WAKE_PATTERNS.some((re) => re.test(transcript));
}

/* ── Status helpers ─────────────────────────────────────────── */
function setStatus(label, modifier) {
  statusBadge.textContent = label;
  statusBadge.className = `badge badge--${modifier}`;
}

/* ── Camera ─────────────────────────────────────────────────── */
async function startCamera() {
  const constraints = {
    video: {
      facingMode: { ideal: 'environment' },
      width:  { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };

  stream = await navigator.mediaDevices.getUserMedia(constraints);
  videoEl.srcObject = stream;
  await videoEl.play();
}

/**
 * Captures the current video frame and returns a JPEG data URL.
 */
function captureFrame() {
  const { videoWidth: w, videoHeight: h } = videoEl;
  canvasEl.width  = w;
  canvasEl.height = h;
  const ctx = canvasEl.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, w, h);
  return canvasEl.toDataURL('image/jpeg', 0.85);
}

/* ── AI analysis ────────────────────────────────────────────── */
async function analyse() {
  if (isAnalysing) return;
  isAnalysing = true;

  // Visual feedback
  manualCaptureBtn.classList.add('triggered');
  setTimeout(() => manualCaptureBtn.classList.remove('triggered'), 500);
  setStatus('Thinking…', 'thinking');
  showLoading(true);
  hidePanel();

  try {
    const image = captureFrame();
    const response = await fetch('/api/analyze', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ image }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error ${response.status}`);
    }

    lastGuidance = data.guidance || '';
    showGuidance(lastGuidance);
    setStatus('Done', 'idle');
  } catch (err) {
    console.error('Analyse error:', err);
    showGuidance(`⚠️ ${err.message || 'Something went wrong. Please try again.'}`);
    setStatus('Error', 'error');
  } finally {
    isAnalysing = false;
    showLoading(false);
  }
}

/* ── Speech recognition ─────────────────────────────────────── */
function startSpeechRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('SpeechRecognition not supported in this browser.');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous    = true;
  recognition.interimResults = true;
  recognition.lang           = 'en-US';

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (matchesWakeWord(transcript)) {
        recognition.stop(); // pause until analysis finishes
        analyse().finally(() => {
          // Resume listening after analysis is done
          try { recognition.start(); } catch (_) { /* already started */ }
        });
        return;
      }
    }
  };

  recognition.onerror = (event) => {
    if (event.error !== 'no-speech') {
      console.warn('SpeechRecognition error:', event.error);
    }
  };

  recognition.onend = () => {
    // Auto-restart unless we deliberately stopped for analysis
    if (!isAnalysing) {
      try { recognition.start(); } catch (_) { /* ignore */ }
    }
  };

  recognition.start();
  setStatus('Listening', 'listening');
}

/* ── UI helpers ─────────────────────────────────────────────── */
function showLoading(visible) {
  loadingOverlay.classList.toggle('loading-overlay--hidden', !visible);
}

function showGuidance(text) {
  guidanceText.textContent = text;
  guidancePanel.classList.remove('panel--hidden');
}

function hidePanel() {
  guidancePanel.classList.add('panel--hidden');
}

/* ── Text-to-Speech ─────────────────────────────────────────── */
function speakGuidance(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = 1.0;
  window.speechSynthesis.speak(utt);
}

/* ── Event listeners ────────────────────────────────────────── */
startBtn.addEventListener('click', async () => {
  try {
    await startCamera();
    startOverlay.style.display = 'none';
    captureControls.classList.remove('capture-controls--hidden');
    startSpeechRecognition();
  } catch (err) {
    console.error('Camera error:', err);
    setStatus('Error', 'error');
    startBtn.textContent = '⚠️ Camera access denied – retry';
  }
});

manualCaptureBtn.addEventListener('click', () => analyse());

closePanelBtn.addEventListener('click', () => {
  hidePanel();
  window.speechSynthesis?.cancel();
  setStatus('Listening', 'listening');
});

speakBtn.addEventListener('click', () => speakGuidance(lastGuidance));

newScanBtn.addEventListener('click', () => {
  hidePanel();
  window.speechSynthesis?.cancel();
  setStatus('Listening', 'listening');
  analyse();
});

/* ── Expose helpers for testing ─────────────────────────────── */
if (typeof window !== 'undefined') {
  window._golive = { matchesWakeWord };
}
