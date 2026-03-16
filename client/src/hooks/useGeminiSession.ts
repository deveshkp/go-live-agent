/**
 * Go-live — Gemini Session Hook
 * Orchestrates Gemini Live API connection, audio/video streaming, and diagnostic flow
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { GeminiLiveClient, MultimodalLiveResponseType, type LiveMessage } from '@/lib/geminiLive';
import { MicrophoneStreamer, AudioPlayer, VideoFrameCapture } from '@/lib/audioUtils';
import { SYSTEM_INSTRUCTION, type DiagnosticStep, STEP_SEQUENCE } from '@/lib/routerAgent';

export type SessionState = 
  | 'idle'
  | 'requesting_permissions'
  | 'connecting'
  | 'active'
  | 'speaking'
  | 'listening'
  | 'error'
  | 'ended';

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
  finished?: boolean;
}

export interface SessionData {
  state: SessionState;
  currentStep: DiagnosticStep;
  transcript: TranscriptEntry[];
  agentSpeaking: boolean;
  userSpeaking: boolean;
  errorMessage: string | null;
  mediaStream: MediaStream | null;
  waveformLevel: number;
}

export function useGeminiSession(apiKey: string) {
  const [state, setState] = useState<SessionState>('idle');
  const [currentStep, setCurrentStep] = useState<DiagnosticStep>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [waveformLevel, setWaveformLevel] = useState(0);

  const clientRef = useRef<GeminiLiveClient | null>(null);
  const micRef = useRef<MicrophoneStreamer | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const videoCapRef = useRef<VideoFrameCapture | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const stepRef = useRef<DiagnosticStep>('idle');
  const waveformIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep stepRef in sync
  useEffect(() => {
    stepRef.current = currentStep;
  }, [currentStep]);

  const addTranscript = useCallback((role: 'user' | 'agent', text: string, finished = true) => {
    if (!text.trim()) return;
    setTranscript(prev => {
      // Update last entry if same role and not finished
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.role === role && !last.finished) {
          return [
            ...prev.slice(0, -1),
            { ...last, text: last.text + text, finished },
          ];
        }
      }
      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          role,
          text,
          timestamp: new Date(),
          finished,
        },
      ];
    });
  }, []);

  const handleMessage = useCallback((msg: LiveMessage) => {
    switch (msg.type) {
      case MultimodalLiveResponseType.SETUP_COMPLETE: {
        setState('active');
        // Advance to step 1 and prompt Gemini
        setCurrentStep('step1_front_leds');
        stepRef.current = 'step1_front_leds';
        // Give Gemini the initial prompt after a short delay
        setTimeout(() => {
          clientRef.current?.sendText("The session has started. Begin the router diagnostic.");
        }, 500);
        break;
      }

      case MultimodalLiveResponseType.AUDIO: {
        setAgentSpeaking(true);
        setState('speaking');
        if (typeof msg.data === 'string') {
          playerRef.current?.playPCM16(msg.data);
        }
        break;
      }

      case MultimodalLiveResponseType.TURN_COMPLETE: {
        setAgentSpeaking(false);
        setState('listening');
        // Removed hardcoded auto-advancing UI step because it blindly advanced 
        // the process every time the agent finished a sentence, ignoring the 
        // actual physical state and user interruptions.
        break;
      }

      case MultimodalLiveResponseType.INTERRUPTED: {
        setAgentSpeaking(false);
        playerRef.current?.stop();
        setState('listening');
        break;
      }

      case MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION: {
        if (typeof msg.data === 'object' && msg.data && 'text' in msg.data) {
          const d = msg.data as { text: string; finished: boolean };
          if (d.text) addTranscript('agent', d.text, d.finished);
        }
        break;
      }

      case MultimodalLiveResponseType.INPUT_TRANSCRIPTION: {
        if (typeof msg.data === 'object' && msg.data && 'text' in msg.data) {
          const d = msg.data as { text: string; finished: boolean };
          if (d.text) addTranscript('user', d.text, d.finished);
        }
        break;
      }

      case MultimodalLiveResponseType.TEXT: {
        if (typeof msg.data === 'string' && msg.data) {
          addTranscript('agent', msg.data, true);
        }
        break;
      }

      case MultimodalLiveResponseType.ERROR: {
        setErrorMessage('Gemini API error occurred');
        setState('error');
        break;
      }
    }
  }, [addTranscript]);

  const startSession = useCallback(async (videoEl: HTMLVideoElement) => {
    if (!apiKey) {
      setErrorMessage('No API key provided. Please enter your Gemini API key.');
      setState('error');
      return;
    }

    setState('requesting_permissions');
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Media devices not available. On iOS Safari, camera/mic access requires HTTPS or localhost.'
        );
      }

      // Request camera + mic permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });

      setMediaStream(stream);
      videoEl.srcObject = stream;
      videoElRef.current = videoEl;
      await videoEl.play();

      setState('connecting');

      // Initialize Gemini client
      const client = new GeminiLiveClient({
        apiKey,
        systemInstruction: SYSTEM_INSTRUCTION,
        voiceName: 'Zephyr',
        onMessage: handleMessage,
        onOpen: () => console.log('Gemini Live connected'),
        onClose: () => {
          setState('ended');
          setAgentSpeaking(false);
          // Stop media streams immediately upon disconnect
          micRef.current?.stop();
          videoCapRef.current?.stop();
          playerRef.current?.stop();
          if (waveformIntervalRef.current) {
            clearInterval(waveformIntervalRef.current);
          }
        },
        onError: (err) => {
          setErrorMessage(err);
          setState('error');
        },
      });

      clientRef.current = client;
      playerRef.current = new AudioPlayer();

      // Start microphone streaming
      const mic = new MicrophoneStreamer();
      mic.onAudioChunk = (base64PCM) => {
        client.sendAudio(base64PCM);
        // Update waveform level
        setWaveformLevel(Math.random() * 0.8 + 0.2);
      };
      await mic.start(stream);
      micRef.current = mic;

      // Start video frame capture at 1fps
      const videoCap = new VideoFrameCapture();
      videoCap.onFrame = (base64JPEG) => {
        client.sendImage(base64JPEG);
      };
      videoCap.start(videoEl, 1);
      videoCapRef.current = videoCap;

      // Connect to Gemini
      client.connect();

      // Waveform animation
      waveformIntervalRef.current = setInterval(() => {
        setWaveformLevel(Math.random() * 0.6 + 0.1);
      }, 150);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start session';
      setErrorMessage(msg);
      setState('error');
    }
  }, [apiKey, handleMessage]);

  const endSession = useCallback(() => {
    micRef.current?.stop();
    videoCapRef.current?.stop();
    playerRef.current?.stop();
    clientRef.current?.disconnect();
    
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
    }

    // Stop media tracks
    mediaStream?.getTracks().forEach(t => t.stop());
    if (videoElRef.current) {
      videoElRef.current.srcObject = null;
    }

    setMediaStream(null);
    setState('idle');
    setCurrentStep('idle');
    setAgentSpeaking(false);
    setUserSpeaking(false);
    setWaveformLevel(0);
    setTranscript([]);
  }, [mediaStream]);

  const interruptAgent = useCallback(() => {
    // Send a text interrupt signal
    clientRef.current?.sendText('[USER INTERRUPTED]');
    playerRef.current?.stop();
    setAgentSpeaking(false);
  }, []);

  const advanceStep = useCallback(() => {
    const cur = stepRef.current;
    const curIdx = STEP_SEQUENCE.indexOf(cur);
    if (curIdx >= 0 && curIdx < STEP_SEQUENCE.length - 1) {
      const next = STEP_SEQUENCE[curIdx + 1];
      setCurrentStep(next);
      stepRef.current = next;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, []); // eslint-disable-line

  return {
    state,
    currentStep,
    transcript,
    agentSpeaking,
    userSpeaking,
    errorMessage,
    mediaStream,
    waveformLevel,
    startSession,
    endSession,
    interruptAgent,
    advanceStep,
  };
}
