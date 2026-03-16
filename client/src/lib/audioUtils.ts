/**
 * Go-live — Audio Utilities
 * Handles microphone capture (16kHz PCM) and audio playback (24kHz PCM)
 * For Gemini Live API real-time audio streaming
 */

// ─── Microphone Capture ────────────────────────────────────────────────────

export class MicrophoneStreamer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  public onAudioChunk?: (base64PCM: string) => void;
  public isStreaming = false;

  async start(stream: MediaStream) {
    this.mediaStream = stream;
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.source = this.audioContext.createMediaStreamSource(stream);

    // ScriptProcessor for raw PCM capture
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      if (!this.isStreaming) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = float32ToPCM16(inputData);
      const base64 = arrayBufferToBase64(pcm16.buffer);
      this.onAudioChunk?.(base64);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    this.isStreaming = true;
  }

  stop() {
    this.isStreaming = false;
    this.processor?.disconnect();
    this.source?.disconnect();
    this.audioContext?.close();
    this.audioContext = null;
    this.processor = null;
    this.source = null;
  }

  pause() { this.isStreaming = false; }
  resume() { this.isStreaming = true; }
}

// ─── Audio Playback ────────────────────────────────────────────────────────

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextPlayTime = 0;
  private isPlaying = false;

  private getContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.nextPlayTime = 0;
    }
    return this.audioContext;
  }

  async playPCM16(base64Data: string) {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const raw = base64ToArrayBuffer(base64Data);
    const pcm16 = new Int16Array(raw);
    const float32 = pcm16ToFloat32(pcm16);

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startTime = Math.max(now, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + buffer.duration;
    this.isPlaying = true;

    source.onended = () => {
      if (this.nextPlayTime <= ctx.currentTime) {
        this.isPlaying = false;
      }
    };
  }

  stop() {
    this.audioContext?.close();
    this.audioContext = null;
    this.nextPlayTime = 0;
    this.isPlaying = false;
  }

  get playing() { return this.isPlaying; }
}

// ─── Video Frame Capture ───────────────────────────────────────────────────

export class VideoFrameCapture {
  private interval: ReturnType<typeof setInterval> | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public onFrame?: (base64JPEG: string) => void;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 480;
    this.ctx = this.canvas.getContext('2d')!;
  }

  start(videoEl: HTMLVideoElement, fps = 1) {
    this.stop();
    const ms = Math.floor(1000 / fps);
    this.interval = setInterval(() => {
      if (videoEl.readyState >= 2) {
        this.ctx.drawImage(videoEl, 0, 0, 640, 480);
        const jpeg = this.canvas.toDataURL('image/jpeg', 0.7);
        const base64 = jpeg.split(',')[1];
        this.onFrame?.(base64);
      }
    }, ms);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function float32ToPCM16(float32Array: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}

function pcm16ToFloat32(pcm16: Int16Array): Float32Array {
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
