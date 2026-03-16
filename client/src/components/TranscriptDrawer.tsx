/**
 * Go-live — Transcript Drawer
 * Slide-up panel showing conversation history
 * Design: Cyberpunk Diagnostic Terminal
 */

import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '@/hooks/useGeminiSession';

interface TranscriptDrawerProps {
  entries: TranscriptEntry[];
  visible: boolean;
  agentSpeaking: boolean;
}

export function TranscriptDrawer({ entries, visible, agentSpeaking }: TranscriptDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div
      className="absolute left-0 right-0 bottom-0"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(calc(100% - 44px))',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 20,
      }}
    >
      {/* Handle bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          background: 'rgba(0,0,0,0.85)',
          borderTop: '1px solid rgba(0,229,255,0.3)',
          borderLeft: '1px solid rgba(0,229,255,0.15)',
          borderRight: '1px solid rgba(0,229,255,0.15)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-0.5 rounded-full"
            style={{ background: 'rgba(0,229,255,0.4)' }}
          />
          <span
            className="font-mono-terminal text-[9px] tracking-widest"
            style={{ color: 'rgba(0,229,255,0.6)' }}
          >
            AGENT TRANSCRIPT
          </span>
        </div>
        {agentSpeaking && (
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: '12px',
                  background: '#00e5ff',
                  borderRadius: '2px',
                  boxShadow: '0 0 4px rgba(0,229,255,0.6)',
                  animation: `waveformPulse 0.8s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
            <span
              className="font-mono-terminal text-[9px]"
              style={{ color: '#00e5ff' }}
            >
              SPEAKING
            </span>
          </div>
        )}
      </div>

      {/* Transcript content */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{
          maxHeight: '180px',
          background: 'rgba(0,0,0,0.9)',
          borderLeft: '1px solid rgba(0,229,255,0.15)',
          borderRight: '1px solid rgba(0,229,255,0.15)',
          borderBottom: '1px solid rgba(0,229,255,0.15)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {entries.length === 0 ? (
          <div
            className="flex items-center justify-center py-6"
            style={{ color: 'rgba(0,229,255,0.3)' }}
          >
            <span className="font-mono-terminal text-[10px] tracking-wider">
              AWAITING SESSION...
            </span>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-2"
                style={{
                  animation: 'fadeInUp 0.3s ease-out',
                }}
              >
                {/* Role indicator */}
                <div className="flex-shrink-0 pt-0.5">
                  <span
                    className="font-mono-terminal text-[9px] font-bold"
                    style={{
                      color: entry.role === 'agent' ? '#00e5ff' : '#39ff14',
                      textShadow: entry.role === 'agent'
                        ? '0 0 6px rgba(0,229,255,0.6)'
                        : '0 0 6px rgba(57,255,20,0.6)',
                    }}
                  >
                    {entry.role === 'agent' ? 'AI›' : 'YOU›'}
                  </span>
                </div>

                {/* Message text */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-mono-terminal text-[11px] leading-relaxed"
                    style={{
                      color: entry.role === 'agent'
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(57,255,20,0.8)',
                    }}
                  >
                    {entry.text}
                    {!entry.finished && (
                      <span
                        style={{
                          animation: 'typewriterCursor 1s step-end infinite',
                          color: '#00e5ff',
                        }}
                      >
                        ▌
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
