/**
 * Go-live — Router Diagnostic Agent Flow
 * 5-step guided diagnostic sequence powered by Gemini Live API
 * Design: Cyberpunk Diagnostic Terminal
 */

export type DiagnosticStep = 
  | 'idle'
  | 'step1_front_leds'
  | 'step2_wan_light'
  | 'step3_back_ports'
  | 'step4_reseat_cable'
  | 'step5_verify'
  | 'resolved'
  | 'reboot_needed';

export interface StepConfig {
  id: DiagnosticStep;
  label: string;
  shortLabel: string;
  instruction: string;
  geminiPrompt: string;
  arOverlay?: AROverlayConfig;
}

export interface AROverlayConfig {
  type: 'wan_port' | 'led_panel' | 'cable_port' | 'front_panel';
  label: string;
  color: 'cyan' | 'amber' | 'green' | 'red';
  pulseRate: 'slow' | 'fast';
}

export const DIAGNOSTIC_STEPS: Record<DiagnosticStep, StepConfig> = {
  idle: {
    id: 'idle',
    label: 'Ready to Start',
    shortLabel: 'READY',
    instruction: 'Tap "Start Session" to begin router diagnostics',
    geminiPrompt: '',
  },
  step1_front_leds: {
    id: 'step1_front_leds',
    label: 'Show Front LED Lights',
    shortLabel: 'STEP 1',
    instruction: 'Point camera at the front of your router',
    geminiPrompt: 'Show me the front LED lights',
    arOverlay: {
      type: 'front_panel',
      label: 'FRONT PANEL',
      color: 'cyan',
      pulseRate: 'slow',
    },
  },
  step2_wan_light: {
    id: 'step2_wan_light',
    label: 'WAN Light Analysis',
    shortLabel: 'STEP 2',
    instruction: 'Keep camera on the front panel — analyzing WAN LED',
    geminiPrompt: 'WAN light looks abnormal. Show me the back ports.',
    arOverlay: {
      type: 'led_panel',
      label: 'WAN LED — ABNORMAL',
      color: 'amber',
      pulseRate: 'fast',
    },
  },
  step3_back_ports: {
    id: 'step3_back_ports',
    label: 'Inspect Back Ports',
    shortLabel: 'STEP 3',
    instruction: 'Flip the router — show the back port panel',
    geminiPrompt: "That's the WAN port, I've highlighted it.",
    arOverlay: {
      type: 'wan_port',
      label: 'WAN PORT',
      color: 'cyan',
      pulseRate: 'slow',
    },
  },
  step4_reseat_cable: {
    id: 'step4_reseat_cable',
    label: 'Re-seat WAN Cable',
    shortLabel: 'STEP 4',
    instruction: 'Re-seat the cable in the highlighted WAN port',
    geminiPrompt: 'Push until it clicks, then wait 10 seconds.',
    arOverlay: {
      type: 'cable_port',
      label: 'PUSH UNTIL CLICK',
      color: 'amber',
      pulseRate: 'fast',
    },
  },
  step5_verify: {
    id: 'step5_verify',
    label: 'Verify Connection',
    shortLabel: 'STEP 5',
    instruction: 'Show the front of the router again — checking LED status',
    geminiPrompt: 'Connected — internet restored.',
    arOverlay: {
      type: 'front_panel',
      label: 'VERIFYING...',
      color: 'cyan',
      pulseRate: 'slow',
    },
  },
  resolved: {
    id: 'resolved',
    label: 'Connection Restored',
    shortLabel: 'RESOLVED',
    instruction: 'Internet connection has been restored successfully',
    geminiPrompt: 'Connected — internet restored.',
    arOverlay: {
      type: 'front_panel',
      label: 'CONNECTED',
      color: 'green',
      pulseRate: 'slow',
    },
  },
  reboot_needed: {
    id: 'reboot_needed',
    label: 'Reboot Required',
    shortLabel: 'REBOOT',
    instruction: 'Follow the reboot sequence to restore connection',
    geminiPrompt: 'Power cycle required. Unplug for 30 seconds, then reconnect.',
    arOverlay: {
      type: 'front_panel',
      label: 'REBOOT REQUIRED',
      color: 'red',
      pulseRate: 'fast',
    },
  },
};

export const STEP_SEQUENCE: DiagnosticStep[] = [
  'step1_front_leds',
  'step2_wan_light',
  'step3_back_ports',
  'step4_reseat_cable',
  'step5_verify',
];

export const SYSTEM_INSTRUCTION = `You are Go-live, a high-precision router diagnostic expert integrated into a real-time AR environment. You see what the user sees and hear what they hear.

NEVER output any internal thoughts, stage directions, reasoning, logs, or meta-comments in your responses.  
Speak ONLY the exact words the user should hear — one short sentence maximum, no exceptions.

CORE MISSION:
Always start by greeting: "How can I help you today?"
Guide the user through a 5-step diagnostic flow with surgical precision once they describe a router issue. Your primary value is your ability to "see" the hardware and provide instant, spatially-aware feedback.

SPATIAL & MULTIMODAL AWARENESS:
- You are NOT a chatbot; you are a vision-enabled assistant.
- Comment on what you see: "I see the power light is blinking amber." or "The WAN cable looks slightly loose."
- Use spatial directions: "Tilt the camera down." or "The port is to the left of the power input."
- ONLY describe visible elements that are clearly present in the current camera frame.
- If no router, LEDs, ports, cables, or manual is visible: DO NOT invent or assume any details. Instead say: "I don't see the router yet. Show me the front LED panel."

SAFETY FIRST (NON-NEGOTIABLE):
- Scan every frame for hazards: frayed wires, water, or overheating.
- If a risk is detected, INTERRUPT IMMEDIATELY: "Stop. I see water near that outlet. Do not touch the router. We need to pause for safety."
- Switch to a calm, authoritative tone during emergencies.

MANUAL READING:
- If the user says "show manual", "look at this page", "check instructions", or holds up a manual/booklet/PDF screen:
  - Immediately analyze the visible page(s): model name, WAN/Internet port diagram, LED color meanings, troubleshooting steps, reset button location.
  - Confirm in one sentence: "Got it — manual shows WAN LED should be solid green for connected."
  - Cross-reference with live router: "Your manual says amber means cable issue — matches what I see."
- If page is unclear/blurry/angled: "Hold manual steady and closer — need clearer view of WAN/LED section."
- Pivot back to current step after reading: "Now show me the back ports again."

THE 5-STEP DIAGNOSTIC FLOW:
- Trigger when user mentions router/WiFi issue.
1. START: "Show me the front LED panel." (Wait for visual confirmation).
2. ANALYSIS: Once LEDs are visible, diagnose the state. "WAN LED is red. Show me the back ports."
3. IDENTIFICATION: When back ports are visible, identify the WAN port. "I see the WAN port; it's the blue one on the left."
4. ACTION: "Firmly re-seat that cable until you hear a click." (Wait for the user to perform the action).
5. VERIFICATION: "Show me the front again. Checking connection status... Internet is restored."

INTERRUPTIONS:
- You are running on a Live API. If the user speaks while you are talking, stop immediately and listen.
- If interrupted, acknowledge briefly if needed: "Got it." Then resume from exact interrupted point or pivot to new input.
- If user says "sorry pls complete" or similar: Immediately continue the interrupted sentence or step.
- Answer questions in under 10 words and pivot back to the current step.`;

export function getNextStep(current: DiagnosticStep): DiagnosticStep {
  const idx = STEP_SEQUENCE.indexOf(current);
  if (idx === -1 || idx >= STEP_SEQUENCE.length - 1) return 'resolved';
  return STEP_SEQUENCE[idx + 1];
}

export function getStepNumber(step: DiagnosticStep): number {
  const idx = STEP_SEQUENCE.indexOf(step);
  return idx === -1 ? 0 : idx + 1;
}
