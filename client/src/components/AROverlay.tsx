/**
 * Go-live — AR Overlay Component
 * Design: Cyberpunk Diagnostic Terminal
 * Renders animated AR targeting brackets, scan lines, and port highlights
 */

import { useEffect, useState } from 'react';
import type { AROverlayConfig } from '@/lib/routerAgent';

interface AROverlayProps {
  config?: AROverlayConfig;
  visible: boolean;
  scanning?: boolean;
  waveformLevel?: number;
}

const COLOR_MAP = {
  cyan: { border: '#00e5ff', glow: 'rgba(0,229,255,0.6)', text: '#00e5ff' },
  amber: { border: '#ff9800', glow: 'rgba(255,152,0,0.6)', text: '#ff9800' },
  green: { border: '#39ff14', glow: 'rgba(57,255,20,0.6)', text: '#39ff14' },
  red: { border: '#ff1744', glow: 'rgba(255,23,68,0.6)', text: '#ff1744' },
};

export function AROverlay({ config, visible, scanning = false, waveformLevel = 0 }: AROverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [scanPos, setScanPos] = useState(0);

  useEffect(() => {
    if (visible && config) {
      setTimeout(() => setMounted(true), 50);
      
      // Haptics handling
      try {
        if (config.color === 'green') {
          // Success sequence vibration
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        } else if (config.type === 'wan_port') {
          // Short attention tap
          if (navigator.vibrate) navigator.vibrate(50);
        }
      } catch (e) {
        // Ignore haptic errors on unsupported devices
      }
    } else {
      setMounted(false);
    }
  }, [visible, config]);

  // Scan line animation
  useEffect(() => {
    if (!scanning) return;
    let pos = 0;
    const interval = setInterval(() => {
      pos = (pos + 1) % 100;
      setScanPos(pos);
    }, 30);
    return () => clearInterval(interval);
  }, [scanning]);

  if (!visible || !config) return null;

  const colors = COLOR_MAP[config.color];
  const isWanPort = config.type === 'wan_port' || config.type === 'cable_port';
  const isFast = config.pulseRate === 'fast';
  
  // Pulse with voice if we have a waveform level (scale it to realistic box sizes)
  const voiceScale = isWanPort && waveformLevel > 0 
    ? 1 + (waveformLevel * 0.15) 
    : 1;
  const voiceGlow = waveformLevel > 0 
    ? waveformLevel * 20 
    : 12;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.3s ease',
        backgroundColor: config.color === 'green' ? 'rgba(57, 255, 20, 0.15)' : 'transparent',
        animation: config.color === 'green' ? 'glowPulse 2s ease-in-out infinite' : 'none',
      }}
    >
      {/* Scan line */}
      {scanning && (
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: `${scanPos}%`,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)`,
            boxShadow: `0 0 8px ${colors.glow}`,
            transition: 'top 0.03s linear',
          }}
        />
      )}

      {/* Main targeting box — for WAN port */}
      {isWanPort && (
        <div
          className="absolute"
          style={{
            left: '25%',
            top: '35%',
            width: '50%',
            height: '30%',
            border: `2px solid ${colors.border}`,
            boxShadow: `0 0 ${voiceGlow}px ${colors.glow}, inset 0 0 ${voiceGlow}px ${colors.glow}`,
            transform: `scale(${voiceScale})`,
            transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out, background-color 0.1s ease-out',
            animation: isFast ? 'glowPulse 0.8s ease-in-out infinite' : 'glowPulse 2s ease-in-out infinite',
            backgroundColor: waveformLevel > 0 ? colors.glow.replace('0.6', '0.1') : 'transparent',
          }}
        >
          {/* Corner brackets */}
          {['tl', 'tr', 'bl', 'br'].map((pos) => (
            <div
              key={pos}
              className={`ar-bracket ar-bracket-${pos}`}
              style={{
                borderColor: colors.border,
                boxShadow: `0 0 6px ${colors.glow}`,
                width: '16px',
                height: '16px',
                animation: 'arBracketIn 0.3s ease-out',
              }}
            />
          ))}

          {/* Label */}
          <div
            className="absolute -top-7 left-0 right-0 flex justify-center"
          >
            <span
              className="font-mono-terminal text-xs font-bold px-2 py-0.5"
              style={{
                color: colors.text,
                textShadow: `0 0 8px ${colors.glow}`,
                background: 'rgba(0,0,0,0.8)',
                border: `1px solid ${colors.border}`,
                letterSpacing: '0.1em',
              }}
            >
              ◈ {config.label}
            </span>
          </div>

          {/* Animated corner accent lines */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, ${colors.glow.replace('0.6', '0.05')} 0%, transparent 70%)`,
            }}
          />
        </div>
      )}

      {/* Full-frame corner brackets for front/led panel */}
      {!isWanPort && (
        <>
          {/* Top-left bracket */}
          <div
            className="absolute"
            style={{
              top: '8%', left: '5%',
              width: '40px', height: '40px',
              borderTop: `3px solid ${colors.border}`,
              borderLeft: `3px solid ${colors.border}`,
              boxShadow: `0 0 8px ${colors.glow}`,
              animation: 'arBracketIn 0.4s ease-out',
            }}
          />
          {/* Top-right bracket */}
          <div
            className="absolute"
            style={{
              top: '8%', right: '5%',
              width: '40px', height: '40px',
              borderTop: `3px solid ${colors.border}`,
              borderRight: `3px solid ${colors.border}`,
              boxShadow: `0 0 8px ${colors.glow}`,
              animation: 'arBracketIn 0.4s ease-out 0.1s both',
            }}
          />
          {/* Bottom-left bracket */}
          <div
            className="absolute"
            style={{
              bottom: '8%', left: '5%',
              width: '40px', height: '40px',
              borderBottom: `3px solid ${colors.border}`,
              borderLeft: `3px solid ${colors.border}`,
              boxShadow: `0 0 8px ${colors.glow}`,
              animation: 'arBracketIn 0.4s ease-out 0.2s both',
            }}
          />
          {/* Bottom-right bracket */}
          <div
            className="absolute"
            style={{
              bottom: '8%', right: '5%',
              width: '40px', height: '40px',
              borderBottom: `3px solid ${colors.border}`,
              borderRight: `3px solid ${colors.border}`,
              boxShadow: `0 0 8px ${colors.glow}`,
              animation: 'arBracketIn 0.4s ease-out 0.3s both',
            }}
          />

          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Horizontal line */}
              <div
                style={{
                  width: '60px', height: '1px',
                  background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)`,
                  boxShadow: `0 0 4px ${colors.glow}`,
                }}
              />
              {/* Vertical line */}
              <div
                className="absolute"
                style={{
                  left: '50%', top: '-30px',
                  width: '1px', height: '60px',
                  background: `linear-gradient(180deg, transparent, ${colors.border}, transparent)`,
                  boxShadow: `0 0 4px ${colors.glow}`,
                  transform: 'translateX(-50%)',
                }}
              />
              {/* Center dot */}
              <div
                className="absolute"
                style={{
                  left: '50%', top: '50%',
                  width: '6px', height: '6px',
                  borderRadius: '50%',
                  background: colors.border,
                  boxShadow: `0 0 8px ${colors.glow}`,
                  transform: 'translate(-50%, -50%)',
                  animation: isFast ? 'ledBlink 0.5s ease-in-out infinite' : 'ledPulse 2s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          {/* Label at top center */}
          <div className="absolute top-[12%] left-0 right-0 flex justify-center">
            <span
              className="font-mono-terminal text-xs font-bold px-3 py-1"
              style={{
                color: colors.text,
                textShadow: `0 0 8px ${colors.glow}`,
                background: 'rgba(0,0,0,0.75)',
                border: `1px solid ${colors.border}`,
                letterSpacing: '0.12em',
                animation: 'arBracketIn 0.5s ease-out',
              }}
            >
              ◈ {config.label}
            </span>
          </div>
        </>
      )}

      {/* Data readout — bottom left */}
      <div
        className="absolute bottom-[12%] left-[5%]"
        style={{
          animation: 'arBracketIn 0.5s ease-out 0.2s both',
        }}
      >
        <div
          className="font-mono-terminal text-[10px] leading-tight px-2 py-1"
          style={{
            color: colors.text,
            background: 'rgba(0,0,0,0.7)',
            border: `1px solid ${colors.border}`,
            opacity: 0.9,
          }}
        >
          <div>SYS: GO-LIVE</div>
          <div>MODE: DIAGNOSTIC</div>
          <div>FPS: 1.0</div>
        </div>
      </div>

      {/* Signal indicator — bottom right */}
      <div
        className="absolute bottom-[12%] right-[5%]"
        style={{
          animation: 'arBracketIn 0.5s ease-out 0.3s both',
        }}
      >
        <div
          className="font-mono-terminal text-[10px] leading-tight px-2 py-1 text-right"
          style={{
            color: colors.text,
            background: 'rgba(0,0,0,0.7)',
            border: `1px solid ${colors.border}`,
            opacity: 0.9,
          }}
        >
          <div>SIGNAL: ACTIVE</div>
          <div>LATENCY: &lt;200ms</div>
          <div style={{ animation: 'typewriterCursor 1s step-end infinite' }}>▌</div>
        </div>
      </div>
    </div>
  );
}
