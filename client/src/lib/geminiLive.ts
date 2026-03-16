/**
 * Go-live — Gemini Live API Client
 * Refactored to use Google GenAI SDK (@google/genai)
 */

import { GoogleGenAI, Modality } from '@google/genai';

export const MultimodalLiveResponseType = {
  TEXT: "TEXT",
  AUDIO: "AUDIO",
  SETUP_COMPLETE: "SETUP_COMPLETE",
  INTERRUPTED: "INTERRUPTED",
  TURN_COMPLETE: "TURN_COMPLETE",
  TOOL_CALL: "TOOL_CALL",
  ERROR: "ERROR",
  INPUT_TRANSCRIPTION: "INPUT_TRANSCRIPTION",
  OUTPUT_TRANSCRIPTION: "OUTPUT_TRANSCRIPTION",
} as const;

export type ResponseType = typeof MultimodalLiveResponseType[keyof typeof MultimodalLiveResponseType];

export interface LiveMessage {
  type: ResponseType;
  data?: string | { text: string; finished: boolean } | Record<string, unknown>;
  endOfTurn?: boolean;
}

export interface GeminiLiveConfig {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  voiceName?: string;
  onMessage?: (msg: LiveMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: string) => void;
}

const DEFAULT_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

export class GeminiLiveClient {
  private ai: GoogleGenAI | null = null;
  private session: any = null;
  private config: GeminiLiveConfig;
  public connected = false;

  constructor(config: GeminiLiveConfig) {
    this.config = config;
  }

  async connect() {
    console.log('Connecting to Gemini Live API using Google GenAI SDK...');
    this.ai = new GoogleGenAI({ apiKey: this.config.apiKey });
    
    const model = this.config.model || DEFAULT_MODEL;
    const genConfig = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: this.config.voiceName || "Puck",
          },
        },
      },
      systemInstruction: {
        parts: [{ text: this.config.systemInstruction || "" }],
      },
    };

    try {
      this.session = await this.ai.live.connect({
        model: model,
        config: genConfig,
        callbacks: {
          onopen: () => {
            this.connected = true;
            console.log('Gemini Live session opened');
            this.config.onOpen?.();
          },
          onmessage: (response: any) => {
            console.log('Gemini message received:', response);
            this.handleResponse(response);
          },
          onerror: (err: any) => {
            this.connected = false;
            console.error('Gemini Live error:', err);
            this.config.onError?.(err.message || "Gemini Live connection error");
          },
          onclose: (event: any) => {
            this.connected = false;
            console.log('Gemini Live session closed:', event.reason);
            this.config.onClose?.();
          },
        },
      });
    } catch (error: any) {
      this.connected = false;
      console.error('Failed to connect to Gemini Live:', error);
      this.config.onError?.(error.message || "Failed to connect to Gemini Live");
    }
  }

  private handleResponse(response: any) {
    const content = response.serverContent;
    const endOfTurn = content?.turnComplete || false;

    if (response.setupComplete) {
      this.config.onMessage?.({ type: MultimodalLiveResponseType.SETUP_COMPLETE, endOfTurn: false });
      return;
    }

    if (content?.turnComplete) {
      this.config.onMessage?.({ type: MultimodalLiveResponseType.TURN_COMPLETE, endOfTurn: true });
      return;
    }

    if (content?.interrupted) {
      this.config.onMessage?.({ type: MultimodalLiveResponseType.INTERRUPTED, endOfTurn: false });
      return;
    }

    if (content?.inputTranscription) {
      this.config.onMessage?.({
        type: MultimodalLiveResponseType.INPUT_TRANSCRIPTION,
        data: { 
          text: content.inputTranscription.text || "", 
          finished: content.inputTranscription.finished || false 
        },
        endOfTurn,
      });
    }

    if (content?.outputTranscription) {
      this.config.onMessage?.({
        type: MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION,
        data: { 
          text: content.outputTranscription.text || "", 
          finished: content.outputTranscription.finished || false 
        },
        endOfTurn,
      });
    }

    if (response.toolCall) {
      this.config.onMessage?.({ 
        type: MultimodalLiveResponseType.TOOL_CALL, 
        data: response.toolCall, 
        endOfTurn 
      });
    }

    if (content?.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        if (part.text) {
          this.config.onMessage?.({ type: MultimodalLiveResponseType.TEXT, data: part.text, endOfTurn });
        }
        if (part.inlineData) {
          this.config.onMessage?.({ type: MultimodalLiveResponseType.AUDIO, data: part.inlineData.data, endOfTurn });
        }
      }
    }
  }

  sendText(text: string) {
    if (!this.session || !this.connected) {
      // console.warn('Session not active, cannot send text');
      return;
    }

    try {
      this.session.sendRealtimeInput({ text });
    } catch (err: any) {
      if (err.message && (err.message.includes("CLOSING") || err.message.includes("CLOSED"))) {
        this.connected = false;
      } else {
        console.debug('Failed to send text:', err);
      }
    }
  }

  sendAudio(base64PCM: string) {
    if (!this.session || !this.connected) {
      // console.warn('Session not active, cannot send audio');
      return;
    }

    try {
      this.session.sendRealtimeInput({
        audio: {
          data: base64PCM,
          mimeType: "audio/pcm;rate=16000"
        }
      });
    } catch (err: any) {
      if (err.message && (err.message.includes("CLOSING") || err.message.includes("CLOSED"))) {
        this.connected = false;
      } else {
        console.debug('Failed to send audio:', err);
      }
    }
  }

  sendImage(base64JPEG: string) {
    if (!this.session || !this.connected) {
      // console.warn('Session not active, cannot send image');
      return;
    }

    try {
      this.session.sendRealtimeInput({
        video: {
          data: base64JPEG,
          mimeType: "image/jpeg"
        }
      });
    } catch (err: any) {
      if (err.message && (err.message.includes("CLOSING") || err.message.includes("CLOSED"))) {
        this.connected = false;
      } else {
        console.debug('Failed to send image:', err);
      }
    }
  }

  disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
      this.connected = false;
    }
  }
}
