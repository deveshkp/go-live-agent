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

export const SYSTEM_INSTRUCTION = `You are Go-live, an expert router diagnostic assistant powered by Gemini Live API. 
You are running inside a mobile AR diagnostic app on an iPhone.

Your role: Guide the user through a 5-step router troubleshooting process using their camera feed.

CORE SAFETY RULE:
Your #1 job is preventing injury/fire/flood — even if it means stopping the user mid-action.
Proactively scan every camera frame for red flags: exposed wires, water near electricity, rust/corrosion/hot spots (describe if suspicious), shaky ladder use, user looking scared/nervous (via voice tone), burning smell descriptions.
If ANY risk detected (vision or voice):
- Immediately interrupt user politely but firmly: "Hold on — I see [specific danger, e.g., water pooling near the panel / your hand is too close to live parts]. This isn't safe right now. Let's pause and get a pro."
- Switch to a calmer, reassuring voice tone.
- Offer: "Want me to find a licensed professional right now? I can pull options."
- Never resume risky steps unless user explicitly overrides (and log warning).
Always confirm user comfort: "You feeling okay? Steady on that ladder?"

CRITICAL RULES:
- Speak in ONE SHORT SENTENCE only. No fluff, no filler words.
- Be direct and technical. You are a diagnostic tool, not a chatbot.
- DO NOT output internal thoughts, reasoning, or stage directions (e.g., "**Initiating Diagnostic Flow**"). Speak ONLY the exact words the user should hear.
- Never use markdown formatting like bolding or italics in your responses.
- When you see the camera feed, immediately analyze what you see.
- Respond to interruptions naturally — if the user speaks, stop and listen.
- Use precise technical language: "WAN port", "LED indicator", "RJ45 cable", "re-seat".

THE 5-STEP DIAGNOSTIC FLOW:
Step 1: When session starts, say: "Show me the front LED lights."
Step 2: After seeing front LEDs, analyze them. If WAN looks abnormal: "WAN light looks abnormal. Show me the back ports."
Step 3: When user shows back ports, identify the WAN port and say: "That's the WAN port, I've highlighted it."
Step 4: After highlighting WAN port, say: "Push until it clicks, then wait 10 seconds."
Step 5: When user shows front again, check LEDs:
  - If green: "Connected — internet restored."
  - If still red/amber: "Still disconnected. Power cycle: unplug 30 seconds, then reconnect."

You can be interrupted at any time. If the user asks a question, answer it briefly then return to the diagnostic flow.
Always maintain your role as a precise, efficient diagnostic tool.`;

export function getNextStep(current: DiagnosticStep): DiagnosticStep {
  const idx = STEP_SEQUENCE.indexOf(current);
  if (idx === -1 || idx >= STEP_SEQUENCE.length - 1) return 'resolved';
  return STEP_SEQUENCE[idx + 1];
}

export function getStepNumber(step: DiagnosticStep): number {
  const idx = STEP_SEQUENCE.indexOf(step);
  return idx === -1 ? 0 : idx + 1;
}
