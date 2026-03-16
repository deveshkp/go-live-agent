/**
 * Go-live — Main App Page
 * Design: Cyberpunk Diagnostic Terminal
 * 
 * iPhone 11 shell with:
 * - Full-screen camera feed as base layer
 * - AR overlay with targeting brackets
 * - Go-live voice agent (Gemini Live API powered)
 * - 5-step diagnostic flow
 * - Real-time transcript drawer
 * - Demo mode for hackathon presentation
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { IPhoneShell } from '@/components/IPhoneShell';
import { AROverlay } from '@/components/AROverlay';
import { StepIndicator } from '@/components/StepIndicator';
import { TranscriptDrawer } from '@/components/TranscriptDrawer';
import { WaveformVisualizer, CircularWaveform } from '@/components/WaveformVisualizer';
import { APIKeyModal } from '@/components/APIKeyModal';
import { useGeminiSession } from '@/hooks/useGeminiSession';
import { DIAGNOSTIC_STEPS, STEP_SEQUENCE, type DiagnosticStep } from '@/lib/routerAgent';

const SPLASH_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663442190353/hpUHQetYwat8SqAQwxGgiy/splash-bg-FztDsqUtZnNQPwSUYxW9S3.webp';
const WAN_PORT_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663442190353/hpUHQetYwat8SqAQwxGgiy/wan-port-highlight-3WaM2sUf4b6xwuDAgCdKf6.webp';
const LED_PANEL_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663442190353/hpUHQetYwat8SqAQwxGgiy/led-status-panel-ExJFXKvoujrQrgZCaBemGx.webp';

// Demo mode script — simulates the 5-step flow
const DEMO_SCRIPT: Array<{ step: DiagnosticStep; text: string; delay: number }> = [
  { step: 'step1_front_leds', text: 'Show me the front LED lights.', delay: 1500 },
  { step: 'step2_wan_light', text: 'WAN light looks abnormal. Show me the back ports.', delay: 5000 },
  { step: 'step3_back_ports', text: "That's the WAN port, I've highlighted it.", delay: 5000 },
  { step: 'step4_reseat_cable', text: 'Push until it clicks, then wait 10 seconds.', delay: 5000 },
  { step: 'step5_verify', text: 'Connected — internet restored.', delay: 6000 },
  { step: 'resolved', text: '', delay: 2000 },
];

interface DemoTranscriptEntry {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
  finished: boolean;
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('golive_api_key') || '');
  const [showApiModal, setShowApiModal] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Demo mode state
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState<DiagnosticStep>('idle');
  const [demoSpeaking, setDemoSpeaking] = useState(false);
  const [demoTranscript, setDemoTranscript] = useState<DemoTranscriptEntry[]>([]);
  const [demoState, setDemoState] = useState<'idle' | 'requesting_permissions' | 'connecting' | 'active' | 'speaking' | 'listening' | 'ended'>('idle');
  const [demoStream, setDemoStream] = useState<MediaStream | null>(null);
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoScriptIdxRef = useRef(0);

  const {
    state: liveState,
    currentStep: liveStep,
    transcript: liveTranscript,
    agentSpeaking: liveAgentSpeaking,
    waveformLevel,
    errorMessage,
    startSession,
    endSession,
    interruptAgent,
  } = useGeminiSession(apiKey);

  // Unified state
  const state = demoMode ? demoState : liveState;
  const currentStep = demoMode ? demoStep : liveStep;
  const transcript = demoMode ? demoTranscript : liveTranscript;
  const agentSpeaking = demoMode ? demoSpeaking : liveAgentSpeaking;

  const isSessionActive = state === 'active' || state === 'speaking' || state === 'listening';
  const isConnecting = state === 'connecting' || state === 'requesting_permissions';
  const stepConfig = DIAGNOSTIC_STEPS[currentStep];

  // ── Demo Mode Logic ──────────────────────────────────────────────────────

  const runDemoScript = useCallback((stream: MediaStream) => {
    demoScriptIdxRef.current = 0;
    setDemoState('active');
    setDemoStep('step1_front_leds');
    setDemoTranscript([]);

    const runNext = (idx: number) => {
      if (idx >= DEMO_SCRIPT.length) return;
      const entry = DEMO_SCRIPT[idx];

      demoTimerRef.current = setTimeout(() => {
        if (entry.text) {
          // Agent speaks
          setDemoSpeaking(true);
          setDemoState('speaking');
          setDemoTranscript(prev => [
            ...prev,
            {
              id: `demo-${idx}`,
              role: 'agent',
              text: entry.text,
              timestamp: new Date(),
              finished: false,
            },
          ]);

          // Finish speaking after 2.5s
          setTimeout(() => {
            setDemoSpeaking(false);
            setDemoTranscript(prev =>
              prev.map((e, i) => i === prev.length - 1 ? { ...e, finished: true } : e)
            );
            setDemoState('listening');
            setDemoStep(entry.step);

            // Run next step
            runNext(idx + 1);
          }, 2500);
        } else {
          // No text — just update step
          setDemoStep(entry.step);
          setDemoState(entry.step === 'resolved' ? 'active' : 'listening');
        }
      }, entry.delay);
    };

    runNext(0);
  }, []);

  const startDemoSession = useCallback(async () => {
    setDemoMode(true);
    setDemoState('requesting_permissions');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      });
      setDemoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setDemoState('connecting');
      setTimeout(() => runDemoScript(stream), 1200);
    } catch {
      // Camera not available — run demo without camera
      setDemoState('connecting');
      setTimeout(() => runDemoScript(new MediaStream()), 1200);
    }
  }, [runDemoScript]);

  const endDemoSession = useCallback(() => {
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    demoStream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setDemoStream(null);
    setDemoMode(false);
    setDemoState('idle');
    setDemoStep('idle');
    setDemoSpeaking(false);
    setDemoTranscript([]);
    setShowTranscript(false);
  }, [demoStream]);

  // ── Live Session Handlers ─────────────────────────────────────────────────

  const handleStartLiveSession = useCallback(async () => {
    if (!apiKey) {
      setShowApiModal(true);
      return;
    }
    if (videoRef.current) {
      await startSession(videoRef.current);
    }
  }, [apiKey, startSession]);

  const handleApiKeyConfirm = useCallback((key: string) => {
    setApiKey(key);
  localStorage.setItem('golive_api_key', key);
    setShowApiModal(false);
    setTimeout(() => {
      if (videoRef.current) startSession(videoRef.current);
    }, 300);
  }, [startSession]);

  const handleEndSession = useCallback(() => {
    if (demoMode) endDemoSession();
    else endSession();
  }, [demoMode, endDemoSession, endSession]);

  const handleInterrupt = useCallback(() => {
    if (demoMode) {
      setDemoSpeaking(false);
      setDemoState('listening');
    } else {
      interruptAgent();
    }
  }, [demoMode, interruptAgent]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    };
  }, []);

  // ── Status colors ─────────────────────────────────────────────────────────

  const statusColor = {
    idle: '#555',
    requesting_permissions: '#ff9800',
    connecting: '#00e5ff',
    active: '#39ff14',
    speaking: '#00e5ff',
    listening: '#39ff14',
    error: '#ff1744',
    ended: '#555',
  }[state] || '#555';

  const statusLabel = {
    idle: 'STANDBY',
    requesting_permissions: 'INIT...',
    connecting: 'CONNECTING',
    active: 'ACTIVE',
    speaking: 'AI SPEAKING',
    listening: 'LISTENING',
    error: 'ERROR',
    ended: 'ENDED',
  }[state] || 'STANDBY';

  // ── Background image for demo steps ──────────────────────────────────────

  const demoStepBg = (() => {
    if (!demoMode || !isSessionActive) return null;
    if (currentStep === 'step3_back_ports' || currentStep === 'step4_reseat_cable') return WAN_PORT_IMG;
    if (currentStep === 'step1_front_leds' || currentStep === 'step2_wan_light' || currentStep === 'step5_verify' || currentStep === 'resolved') return LED_PANEL_IMG;
    return null;
  })();

  return (
    <IPhoneShell>
      {/* ── Base Layer: Camera Feed / Splash ── */}
      <div className="absolute inset-0 bg-black">
        {/* Video element */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: isSessionActive && (demoStream || !demoMode) ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
          autoPlay
          playsInline
          muted
        />

        {/* Demo step background image (when no camera) */}
        {demoMode && isSessionActive && demoStepBg && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${demoStepBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.55,
              transition: 'opacity 0.6s ease, background-image 0.3s ease',
            }}
          />
        )}

        {/* Splash background */}
        {!isSessionActive && !isConnecting && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${SPLASH_BG})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.35,
            }}
          />
        )}

        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: isSessionActive
              ? 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.5) 100%)'
              : 'rgba(0,0,0,0.65)',
          }}
        />

        {/* Scanline texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
            opacity: 0.5,
          }}
        />
      </div>

      {/* ── AR Overlay Layer ── */}
      {isSessionActive && (
        <AROverlay
          config={stepConfig?.arOverlay}
          visible={!!stepConfig?.arOverlay}
          scanning={state === 'active' || state === 'listening'}
          waveformLevel={waveformLevel}
        />
      )}

      {/* ── Scan Line ── */}
      {isSessionActive && (
        <div className="scan-line" style={{ zIndex: 5 }} />
      )}

      {/* ── Top HUD Bar ── */}
      <div
        className="absolute left-0 right-0 z-30 px-3"
        style={{ top: '50px' }}
      >
        <div className="hud-panel px-3 py-2 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 flex items-center justify-center flex-shrink-0"
              style={{
                border: '1.5px solid #00e5ff',
                boxShadow: '0 0 6px rgba(0,229,255,0.4)',
              }}
            >
              <span style={{ color: '#00e5ff', fontSize: '10px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>G</span>
            </div>
            <div>
              <div
                className="font-mono-terminal text-[10px] font-bold tracking-wider leading-none"
                style={{ color: '#00e5ff', textShadow: '0 0 6px rgba(0,229,255,0.6)' }}
              >
                GO-LIVE
              </div>
              <div
                className="font-mono-terminal text-[8px] tracking-widest leading-none mt-0.5"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                GO-LIVE
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: statusColor,
                boxShadow: `0 0 5px ${statusColor}`,
                animation: isSessionActive ? 'ledPulse 2s ease-in-out infinite' : 'none',
              }}
            />
            <span
              className="font-mono-terminal text-[8px] font-bold tracking-wider"
              style={{ color: statusColor }}
            >
              {statusLabel}
            </span>
            {demoMode && (
              <span
                className="font-mono-terminal text-[7px] px-1 py-0.5 ml-1"
                style={{
                  color: '#ff9800',
                  border: '1px solid rgba(255,152,0,0.4)',
                  background: 'rgba(255,152,0,0.1)',
                }}
              >
                DEMO
              </span>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowApiModal(true)}
            className="flex items-center justify-center w-7 h-7 flex-shrink-0"
            style={{
              border: '1px solid rgba(0,229,255,0.25)',
              background: 'rgba(0,229,255,0.05)',
            }}
          >
            <span style={{ color: 'rgba(0,229,255,0.6)', fontSize: '11px' }}>⚙</span>
          </button>
        </div>
      </div>

      {/* ── Step Indicator ── */}
      {(isSessionActive || (currentStep !== 'idle' && currentStep !== 'resolved')) && (
        <div
          className="absolute left-0 right-0 z-30 px-3"
          style={{ top: '104px' }}
        >
          <StepIndicator currentStep={currentStep} />
        </div>
      )}

      {/* ── Agent Speaking Bubble ── */}
      {isSessionActive && agentSpeaking && transcript.length > 0 && (
        <div
          className="absolute left-3 right-3 z-30"
          style={{
            top: (isSessionActive && currentStep !== 'idle') ? '178px' : '108px',
            animation: 'fadeInUp 0.3s ease-out',
          }}
        >
          <div
            className="hud-panel px-3 py-2.5 flex items-start gap-2.5"
            style={{ borderColor: 'rgba(0,229,255,0.5)' }}
          >
            <CircularWaveform active={true} size={26} />
            <div className="flex-1 min-w-0">
              <div
                className="font-mono-terminal text-[8px] tracking-widest mb-1"
                style={{ color: 'rgba(0,229,255,0.5)' }}
              >
                GO-LIVE AGENT
              </div>
              <p
                className="font-mono-terminal text-[11px] leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                {transcript[transcript.length - 1]?.role === 'agent'
                  ? transcript[transcript.length - 1].text
                  : ''}
                <span
                  style={{
                    animation: 'typewriterCursor 1s step-end infinite',
                    color: '#00e5ff',
                  }}
                >
                  ▌
                </span>
              </p>
            </div>
            <WaveformVisualizer active={agentSpeaking} barCount={6} height={22} />
          </div>
        </div>
      )}

      {/* ── Center Content (Idle / Connecting) ── */}
      {!isSessionActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-5">
          {isConnecting ? (
            <div className="flex flex-col items-center gap-5">
              <CircularWaveform active={true} size={60} />
              <div className="text-center">
                <div
                  className="font-mono-terminal text-sm font-bold tracking-widest mb-1.5"
                  style={{ color: '#00e5ff', textShadow: '0 0 8px rgba(0,229,255,0.6)' }}
                >
                  {state === 'requesting_permissions' ? 'REQUESTING ACCESS' : 'CONNECTING TO GEMINI'}
                </div>
                <div
                  className="font-mono-terminal text-[10px] tracking-wider"
                  style={{ color: 'rgba(0,229,255,0.5)' }}
                >
                  {state === 'requesting_permissions' ? 'Camera & Microphone' : 'Live API WebSocket'}
                </div>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: '#00e5ff',
                      boxShadow: '0 0 6px rgba(0,229,255,0.8)',
                      animation: `ledPulse 1s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 w-full">
              {/* Logo */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-14 h-14 flex items-center justify-center relative"
                  style={{
                    border: '2px solid #00e5ff',
                    boxShadow: '0 0 20px rgba(0,229,255,0.25), inset 0 0 20px rgba(0,229,255,0.04)',
                    animation: 'glowPulse 3s ease-in-out infinite',
                  }}
                >
                  <span
                    style={{
                      fontSize: '24px',
                      color: '#00e5ff',
                      textShadow: '0 0 12px rgba(0,229,255,0.8)',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontWeight: 700,
                    }}
                  >
                    G
                  </span>
                  {/* Corner accents */}
                  {['tl', 'tr', 'bl', 'br'].map(pos => (
                    <div
                      key={pos}
                      style={{
                        position: 'absolute',
                        width: '8px', height: '8px',
                        ...(pos.includes('t') ? { top: -4 } : { bottom: -4 }),
                        ...(pos.includes('l') ? { left: -4 } : { right: -4 }),
                        borderTop: pos.includes('t') ? '2px solid #39ff14' : 'none',
                        borderBottom: pos.includes('b') ? '2px solid #39ff14' : 'none',
                        borderLeft: pos.includes('l') ? '2px solid #39ff14' : 'none',
                        borderRight: pos.includes('r') ? '2px solid #39ff14' : 'none',
                      }}
                    />
                  ))}
                </div>
                <div className="text-center">
                  <h1
                    style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#00e5ff',
                      textShadow: '0 0 12px rgba(0,229,255,0.5)',
                      letterSpacing: '0.18em',
                    }}
                  >
                    GO-LIVE
                  </h1>
                  <p
                    className="font-mono-terminal text-[9px] tracking-widest mt-0.5"
                    style={{ color: 'rgba(0,229,255,0.45)' }}
                  >
                    ROUTER DIAGNOSTIC SYSTEM
                  </p>
                </div>
              </div>

              {/* Capabilities */}
              <div className="hud-panel px-4 py-3 w-full">
                <div
                  className="font-mono-terminal text-[8px] tracking-widest mb-2.5"
                  style={{ color: 'rgba(0,229,255,0.45)' }}
                >
                  SYSTEM CAPABILITIES
                </div>
                <div className="space-y-1.5">
                  {[
                    { icon: '◉', label: 'Live Camera Vision Analysis', color: '#00e5ff' },
                    { icon: '◎', label: 'Real-time Voice Interaction', color: '#00e5ff' },
                    { icon: '◈', label: 'AR Port Highlighting Overlay', color: '#39ff14' },
                    { icon: '◆', label: '5-Step Guided Diagnostics', color: '#39ff14' },
                    { icon: '⊕', label: 'Barge-in Interruption Support', color: '#ff9800' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span style={{ color: item.color, fontSize: '10px', flexShrink: 0 }}>{item.icon}</span>
                      <span
                        className="font-mono-terminal text-[10px]"
                        style={{ color: 'rgba(255,255,255,0.65)' }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error */}
              {(liveState === 'error' || liveState === 'ended') && errorMessage && (
                <div
                  className="hud-panel px-3 py-2.5 w-full"
                  style={{ borderColor: 'rgba(255,23,68,0.4)', background: 'rgba(255,23,68,0.05)' }}
                >
                  <p className="font-mono-terminal text-[10px]" style={{ color: '#ff1744' }}>
                    ⚠ {errorMessage}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2 w-full">
                {/* Live Session */}
                <button
                  onClick={handleStartLiveSession}
                  className="w-full py-3.5 relative overflow-hidden"
                  style={{
                    background: 'rgba(0,229,255,0.08)',
                    border: '1.5px solid #00e5ff',
                    boxShadow: '0 0 16px rgba(0,229,255,0.15)',
                    animation: 'glowPulse 3s ease-in-out infinite',
                  }}
                >
                  <div className="flex items-center justify-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: '#00e5ff',
                        boxShadow: '0 0 8px rgba(0,229,255,0.8)',
                        animation: 'ledPulse 2s ease-in-out infinite',
                      }}
                    />
                    <span
                      className="font-mono-terminal font-bold tracking-widest"
                      style={{ fontSize: '12px', color: '#00e5ff', textShadow: '0 0 8px rgba(0,229,255,0.6)' }}
                    >
                      ◈ START LIVE SESSION
                    </span>
                  </div>
                  <div
                    className="absolute text-[8px] bottom-0.5 right-2 font-mono-terminal"
                    style={{ color: 'rgba(0,229,255,0.4)' }}
                  >
                    REQUIRES API KEY
                  </div>
                </button>

                {/* Demo Mode */}
                <button
                  onClick={startDemoSession}
                  className="w-full py-3"
                  style={{
                    background: 'rgba(57,255,20,0.06)',
                    border: '1px solid rgba(57,255,20,0.4)',
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: '#39ff14', boxShadow: '0 0 6px rgba(57,255,20,0.6)' }}
                    />
                    <span
                      className="font-mono-terminal font-bold tracking-widest text-[11px]"
                      style={{ color: '#39ff14' }}
                    >
                      ▶ DEMO MODE
                    </span>
                  </div>
                  <div
                    className="font-mono-terminal text-[8px] mt-0.5"
                    style={{ color: 'rgba(57,255,20,0.4)' }}
                  >
                    SIMULATED 5-STEP FLOW
                  </div>
                </button>
              </div>

              {/* Hackathon badge */}
              <div
                className="font-mono-terminal text-[8px] tracking-wider px-3 py-1.5 text-center"
                style={{
                  color: '#ff9800',
                  border: '1px solid rgba(255,152,0,0.25)',
                  background: 'rgba(255,152,0,0.04)',
                }}
              >
                ◈ HACKATHON DEMO · GO-LIVE · GEMINI LIVE API · GOOGLE CLOUD
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom Session Controls ── */}
      {isSessionActive && (
        <div
          className="absolute left-0 right-0 z-30 px-3"
          style={{ bottom: '220px' }}
        >
          <div className="flex gap-2">
            {/* Interrupt */}
            <button
              onClick={handleInterrupt}
              className="flex-1 py-2.5 flex items-center justify-center gap-1.5"
              style={{
                background: 'rgba(255,152,0,0.08)',
                border: '1px solid rgba(255,152,0,0.35)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{ color: '#ff9800', fontSize: '11px' }}>⊘</span>
              <span className="font-mono-terminal text-[9px] font-bold tracking-wider" style={{ color: '#ff9800' }}>
                INTERRUPT
              </span>
            </button>

            {/* Transcript */}
            <button
              onClick={() => setShowTranscript(s => !s)}
              className="flex-1 py-2.5 flex items-center justify-center gap-1.5"
              style={{
                background: showTranscript ? 'rgba(0,229,255,0.12)' : 'rgba(0,229,255,0.04)',
                border: `1px solid ${showTranscript ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.2)'}`,
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{ color: '#00e5ff', fontSize: '11px' }}>≡</span>
              <span className="font-mono-terminal text-[9px] font-bold tracking-wider" style={{ color: '#00e5ff' }}>
                LOG
              </span>
            </button>

            {/* End */}
            <button
              onClick={handleEndSession}
              className="flex-1 py-2.5 flex items-center justify-center gap-1.5"
              style={{
                background: 'rgba(255,23,68,0.08)',
                border: '1px solid rgba(255,23,68,0.35)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{ color: '#ff1744', fontSize: '11px' }}>⏹</span>
              <span className="font-mono-terminal text-[9px] font-bold tracking-wider" style={{ color: '#ff1744' }}>
                END
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Transcript Drawer ── */}
      <TranscriptDrawer
        entries={transcript}
        visible={showTranscript}
        agentSpeaking={agentSpeaking}
      />

      {/* ── API Key Modal ── */}
      {showApiModal && (
        <APIKeyModal
          onConfirm={handleApiKeyConfirm}
          initialKey={apiKey}
        />
      )}

      {/* ── Success Overlay ── */}
      {currentStep === 'resolved' && (
        <div
          className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
          style={{ animation: 'fadeInUp 0.5s ease-out' }}
        >
          <div
            className="text-center px-8 py-5"
            style={{
              background: 'rgba(0,0,0,0.88)',
              border: '2px solid #39ff14',
              boxShadow: '0 0 40px rgba(57,255,20,0.25)',
            }}
          >
            <div
              className="font-mono-terminal font-bold text-2xl tracking-widest mb-2"
              style={{
                color: '#39ff14',
                textShadow: '0 0 16px rgba(57,255,20,0.8)',
                animation: 'ledPulse 2s ease-in-out infinite',
              }}
            >
              ✓ CONNECTED
            </div>
            <div
              className="font-mono-terminal text-[11px] tracking-wider"
              style={{ color: 'rgba(57,255,20,0.6)' }}
            >
              INTERNET RESTORED
            </div>
            <div
              className="font-mono-terminal text-[9px] tracking-widest mt-2"
              style={{ color: 'rgba(57,255,20,0.4)' }}
            >
              DIAGNOSTIC COMPLETE
            </div>
          </div>
        </div>
      )}
    </IPhoneShell>
  );
}
