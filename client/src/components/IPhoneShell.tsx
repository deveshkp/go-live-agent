/**
 * Go-live — iPhone 11 Shell Component
 * Renders the iPhone 11 hardware frame with notch, home indicator, and side buttons
 * Design: Cyberpunk Diagnostic Terminal
 */

import { ReactNode } from 'react';

interface IPhoneShellProps {
  children: ReactNode;
  className?: string;
}

export function IPhoneShell({ children, className = '' }: IPhoneShellProps) {
  return (
    <div
      className={`relative flex items-center justify-center min-h-screen ${className}`}
      style={{ background: '#050709' }}
    >
      {/* Outer frame — iPhone 11 dimensions 375x812 logical pixels */}
      <div
        className="relative"
        style={{
          width: 'min(393px, 100vw)',
          height: 'min(852px, 100dvh)',
          background: '#0a0d12',
          borderRadius: 'clamp(0px, 4vw, 44px)',
          overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(0,229,255,0.15), 0 0 40px rgba(0,229,255,0.05), 0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Screen content */}
        <div className="absolute inset-0 overflow-hidden">
          {children}
        </div>

        {/* Notch overlay */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{
            width: '150px',
            height: '30px',
            background: '#050709',
            borderRadius: '0 0 20px 20px',
          }}
        >
          {/* Camera dot */}
          <div
            className="absolute right-8 top-1/2 -translate-y-1/2"
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#111',
              border: '1px solid #222',
            }}
          />
          {/* Speaker grille */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
            style={{
              width: '50px',
              height: '5px',
              borderRadius: '3px',
              background: '#111',
            }}
          />
        </div>

        {/* Home indicator */}
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{
            width: '120px',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(255,255,255,0.2)',
          }}
        />

        {/* Status bar time */}
        <div
          className="absolute top-0 left-0 right-0 z-40 pointer-events-none flex items-center justify-between px-6 pt-2"
          style={{ height: '44px' }}
        >
          <span
            className="font-mono-terminal text-[11px] font-bold"
            style={{ color: 'rgba(255,255,255,0.8)' }}
          >
            <StatusTime />
          </span>
          <div className="flex items-center gap-1.5">
            {/* Signal bars */}
            <div className="flex items-end gap-0.5">
              {[4, 7, 10, 13].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    height: `${h}px`,
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: '1px',
                  }}
                />
              ))}
            </div>
            {/* WiFi icon */}
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
              <path d="M7.5 8.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="rgba(255,255,255,0.8)"/>
              <path d="M4.5 6.5C5.5 5.3 6.4 4.8 7.5 4.8s2 .5 3 1.7" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              <path d="M1.5 3.5C3.2 1.5 5.2.5 7.5.5s4.3 1 6 3" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
            </svg>
            {/* Battery */}
            <div className="flex items-center gap-0.5">
              <div
                style={{
                  width: '22px',
                  height: '11px',
                  border: '1px solid rgba(255,255,255,0.6)',
                  borderRadius: '2px',
                  padding: '1px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '70%',
                    height: '100%',
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: '1px',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side buttons (decorative) */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: 'calc(50% - min(196.5px, 50vw) - 3px)',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        {/* Volume up */}
        <div
          style={{
            width: '3px',
            height: '32px',
            background: '#1a1a1a',
            borderRadius: '2px 0 0 2px',
            marginBottom: '8px',
            marginTop: '80px',
          }}
        />
        {/* Volume down */}
        <div
          style={{
            width: '3px',
            height: '32px',
            background: '#1a1a1a',
            borderRadius: '2px 0 0 2px',
            marginBottom: '8px',
          }}
        />
        {/* Silent switch */}
        <div
          style={{
            width: '3px',
            height: '20px',
            background: '#1a1a1a',
            borderRadius: '2px 0 0 2px',
          }}
        />
      </div>

      {/* Power button */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: 'calc(50% - min(196.5px, 50vw) - 3px)',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <div
          style={{
            width: '3px',
            height: '60px',
            background: '#1a1a1a',
            borderRadius: '0 2px 2px 0',
            marginTop: '60px',
          }}
        />
      </div>
    </div>
  );
}

function StatusTime() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return <>{h12}:{m} {ampm}</>;
}
