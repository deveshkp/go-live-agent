/**
 * Go-live — Step Indicator Component
 * Shows the 5-step diagnostic progress with cyberpunk HUD styling
 */

import type { DiagnosticStep } from '@/lib/routerAgent';
import { STEP_SEQUENCE, DIAGNOSTIC_STEPS, getStepNumber } from '@/lib/routerAgent';

interface StepIndicatorProps {
  currentStep: DiagnosticStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentNum = getStepNumber(currentStep);
  const isResolved = currentStep === 'resolved';
  const isReboot = currentStep === 'reboot_needed';

  return (
    <div className="hud-panel px-3 py-2">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="font-mono-terminal text-[9px] font-bold tracking-widest"
          style={{ color: '#00e5ff', opacity: 0.7 }}
        >
          DIAGNOSTIC SEQUENCE
        </span>
        {isResolved && (
          <span
            className="font-mono-terminal text-[9px] font-bold tracking-wider px-1.5 py-0.5"
            style={{
              color: '#39ff14',
              border: '1px solid #39ff14',
              textShadow: '0 0 6px rgba(57,255,20,0.8)',
              animation: 'ledPulse 2s ease-in-out infinite',
            }}
          >
            ✓ RESOLVED
          </span>
        )}
        {isReboot && (
          <span
            className="font-mono-terminal text-[9px] font-bold tracking-wider px-1.5 py-0.5"
            style={{
              color: '#ff9800',
              border: '1px solid #ff9800',
              textShadow: '0 0 6px rgba(255,152,0,0.8)',
              animation: 'ledPulse 1s ease-in-out infinite',
            }}
          >
            ⚠ REBOOT
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {STEP_SEQUENCE.map((step, idx) => {
          const stepNum = idx + 1;
          const isActive = step === currentStep;
          const isComplete = currentNum > stepNum || isResolved;
          const isPending = currentNum < stepNum && !isResolved;

          return (
            <div key={step} className="flex items-center gap-1.5">
              {/* Step dot */}
              <div className="flex flex-col items-center gap-0.5">
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '2px',
                    border: `1.5px solid ${
                      isActive ? '#00e5ff' :
                      isComplete ? '#39ff14' :
                      '#333'
                    }`,
                    background: isActive
                      ? 'rgba(0,229,255,0.15)'
                      : isComplete
                      ? 'rgba(57,255,20,0.15)'
                      : 'transparent',
                    boxShadow: isActive
                      ? '0 0 6px rgba(0,229,255,0.5)'
                      : isComplete
                      ? '0 0 4px rgba(57,255,20,0.4)'
                      : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    animation: isActive ? 'glowPulse 2s ease-in-out infinite' : 'none',
                  }}
                >
                  <span
                    className="font-mono-terminal font-bold"
                    style={{
                      fontSize: '9px',
                      color: isActive ? '#00e5ff' : isComplete ? '#39ff14' : '#555',
                      textShadow: isActive
                        ? '0 0 6px rgba(0,229,255,0.8)'
                        : isComplete
                        ? '0 0 4px rgba(57,255,20,0.6)'
                        : 'none',
                    }}
                  >
                    {isComplete ? '✓' : stepNum}
                  </span>
                </div>
              </div>

              {/* Connector line */}
              {idx < STEP_SEQUENCE.length - 1 && (
                <div
                  style={{
                    width: '12px',
                    height: '1px',
                    background: isComplete
                      ? 'linear-gradient(90deg, #39ff14, #39ff14)'
                      : isActive
                      ? 'linear-gradient(90deg, #00e5ff, #333)'
                      : '#333',
                    boxShadow: isComplete ? '0 0 3px rgba(57,255,20,0.4)' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step label */}
      {currentStep !== 'idle' && (
        <div className="mt-1.5">
          <span
            className="font-mono-terminal text-[9px]"
            style={{ color: 'rgba(0,229,255,0.6)' }}
          >
            {DIAGNOSTIC_STEPS[currentStep]?.instruction || ''}
          </span>
        </div>
      )}
    </div>
  );
}
