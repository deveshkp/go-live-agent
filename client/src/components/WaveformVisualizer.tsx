/**
 * Go-live — Waveform Visualizer
 * Animated audio waveform bars for agent speaking state
 * Design: Cyberpunk Diagnostic Terminal — electric cyan bars
 */

import { useEffect, useState } from 'react';

interface WaveformVisualizerProps {
  active: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

export function WaveformVisualizer({
  active,
  color = '#00e5ff',
  barCount = 20,
  height = 32,
}: WaveformVisualizerProps) {
  const [levels, setLevels] = useState<number[]>(Array(barCount).fill(0.1));

  useEffect(() => {
    if (!active) {
      setLevels(Array(barCount).fill(0.1));
      return;
    }

    const interval = setInterval(() => {
      setLevels(prev =>
        prev.map((_, i) => {
          // Create a wave-like pattern
          const base = Math.sin(Date.now() / 200 + i * 0.5) * 0.3 + 0.4;
          const noise = Math.random() * 0.4;
          return Math.max(0.05, Math.min(1, base + noise));
        })
      );
    }, 80);

    return () => clearInterval(interval);
  }, [active, barCount]);

  return (
    <div
      className="flex items-center gap-[2px]"
      style={{ height: `${height}px` }}
    >
      {levels.map((level, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: `${level * height}px`,
            background: active
              ? `linear-gradient(180deg, ${color}, ${color}88)`
              : '#333',
            borderRadius: '2px',
            boxShadow: active ? `0 0 4px ${color}88` : 'none',
            transition: 'height 0.08s ease, background 0.3s ease',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

// Compact circular waveform for status indicator
export function CircularWaveform({ active, size = 48 }: { active: boolean; size?: number }) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setRotation(r => (r + 3) % 360);
    }, 16);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid ${active ? '#00e5ff' : '#333'}`,
          boxShadow: active ? '0 0 8px rgba(0,229,255,0.5)' : 'none',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      />
      {/* Rotating arc */}
      {active && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#39ff14',
            boxShadow: '0 0 6px rgba(57,255,20,0.6)',
            transform: `rotate(${rotation}deg)`,
          }}
        />
      )}
      {/* Center dot */}
      <div
        style={{
          width: size * 0.25,
          height: size * 0.25,
          borderRadius: '50%',
          background: active ? '#00e5ff' : '#444',
          boxShadow: active ? '0 0 8px rgba(0,229,255,0.8)' : 'none',
          transition: 'background 0.3s, box-shadow 0.3s',
        }}
      />
    </div>
  );
}
