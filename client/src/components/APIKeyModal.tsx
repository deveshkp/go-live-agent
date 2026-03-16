/**
 * Go-live — API Key Modal
 * Secure input for Gemini API key before session start
 * Design: Cyberpunk Diagnostic Terminal
 */

import { useState } from 'react';

interface APIKeyModalProps {
  onConfirm: (key: string) => void;
  initialKey?: string;
}

export function APIKeyModal({ onConfirm, initialKey = '' }: APIKeyModalProps) {
  const [key, setKey] = useState(initialKey);
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) onConfirm(key.trim());
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full mx-4"
        style={{
          border: '1px solid rgba(0,229,255,0.4)',
          background: 'rgba(0,10,15,0.95)',
          boxShadow: '0 0 30px rgba(0,229,255,0.15)',
          animation: 'fadeInUp 0.4s ease-out',
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3"
          style={{
            borderBottom: '1px solid rgba(0,229,255,0.2)',
            background: 'rgba(0,229,255,0.05)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: '#00e5ff',
                boxShadow: '0 0 6px rgba(0,229,255,0.8)',
                animation: 'ledPulse 2s ease-in-out infinite',
              }}
            />
            <span
              className="font-mono-terminal text-xs font-bold tracking-widest"
              style={{ color: '#00e5ff' }}
            >
              GEMINI API AUTHENTICATION
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <p
            className="font-mono-terminal text-[11px] mb-4 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Enter your Gemini API key to enable live AI diagnostics.
            The key is stored locally and never transmitted to any server.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label
                className="font-mono-terminal text-[9px] tracking-widest block mb-1.5"
                style={{ color: 'rgba(0,229,255,0.7)' }}
              >
                API KEY
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full font-mono-terminal text-xs px-3 py-2.5 pr-10 outline-none"
                  style={{
                    background: 'rgba(0,229,255,0.05)',
                    border: '1px solid rgba(0,229,255,0.3)',
                    color: '#fff',
                    letterSpacing: '0.05em',
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(0,229,255,0.5)' }}
                >
                  <span className="font-mono-terminal text-[9px]">
                    {showKey ? 'HIDE' : 'SHOW'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!key.trim()}
              className="w-full py-3 font-mono-terminal text-xs font-bold tracking-widest transition-all"
              style={{
                background: key.trim()
                  ? 'rgba(0,229,255,0.15)'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${key.trim() ? '#00e5ff' : 'rgba(255,255,255,0.1)'}`,
                color: key.trim() ? '#00e5ff' : 'rgba(255,255,255,0.2)',
                boxShadow: key.trim() ? '0 0 12px rgba(0,229,255,0.2)' : 'none',
                cursor: key.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              ◈ INITIALIZE SYSTEM
            </button>
          </form>

          <div className="mt-3 flex items-start gap-2">
            <span style={{ color: '#ff9800', fontSize: '10px' }}>⚠</span>
            <p
              className="font-mono-terminal text-[9px] leading-relaxed"
              style={{ color: 'rgba(255,152,0,0.7)' }}
            >
              Requires Gemini API key with Live API access enabled.
              Get yours at{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#ff9800', textDecoration: 'underline' }}
              >
                aistudio.google.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
