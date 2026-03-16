# Go-live — Design Brainstorm

## Context
iPhone 11 OS 26.x styled mobile web app. Gemini Live API-powered router troubleshooting assistant.
Real-time camera + mic, AR overlays, step-by-step guided diagnostics. Hackathon demo.

---

<response>
<idea>
**Design Movement**: Cyberpunk Diagnostic Terminal — Dark HUD / AR Interface

**Core Principles**:
1. Everything feels like it's overlaid on a live camera feed — translucent panels, glowing borders
2. Neon cyan/green accents on deep black — high contrast, high urgency
3. Monospace + display font pairing for a "system terminal" feel
4. Animated scan lines, pulsing indicators, and AR-style corner brackets

**Color Philosophy**:
- Background: near-black `#0a0d12` — like a camera viewfinder at night
- Primary accent: electric cyan `#00e5ff` — the "active signal" color
- Secondary: neon green `#39ff14` — for "connected/success" states
- Warning: amber `#ff9800` — for "abnormal" LED states
- Danger: deep red `#ff1744` — for "disconnected" states
- All UI panels use `rgba(0,0,0,0.6)` with `backdrop-filter: blur(12px)`

**Layout Paradigm**:
- Full-screen camera feed as the base layer
- Floating HUD panels anchored to corners and edges (not centered)
- AR overlay canvas sits above camera, below UI controls
- Bottom drawer slides up with agent transcript
- iPhone 11 notch + home indicator rendered as SVG frame overlay

**Signature Elements**:
1. Animated corner brackets (⌐ ¬) that pulse around detected router ports
2. Scan-line animation sweeping across camera feed during analysis
3. LED status indicators with bloom glow effect

**Interaction Philosophy**:
- Tap anywhere to interrupt Gemini mid-speech (barge-in)
- Long-press to force a new analysis frame
- Swipe up to see full conversation history

**Animation**:
- Scan line: 2s linear loop from top to bottom of camera feed
- AR brackets: scale-in with spring physics when port is detected
- Agent speaking: waveform visualizer pulses in sync with audio output
- Session start: radial ripple from center outward

**Typography System**:
- Display: `Space Grotesk` (700) — for status labels and step numbers
- Body: `JetBrains Mono` (400/500) — for agent transcript and technical info
- UI Labels: `Space Grotesk` (500) — for button labels and section headers
</idea>
<probability>0.07</probability>
</response>

<response>
<idea>
**Design Movement**: Apple iOS 26 Glassmorphism — Frosted Glass Native Feel

**Core Principles**:
1. Mimics actual iOS 26 "Liquid Glass" design language — frosted panels, dynamic island
2. Soft shadows, rounded corners (28px+), and translucent surfaces
3. SF Pro-inspired typography with generous line heights
4. Smooth spring animations matching iOS native feel

**Color Philosophy**:
- Background: gradient from `#1c1c1e` to `#2c2c2e` (iOS dark system background)
- Glass panels: `rgba(255,255,255,0.08)` with heavy blur
- Accent: iOS blue `#0a84ff` for interactive elements
- Success: iOS green `#30d158`
- Warning: iOS orange `#ff9f0a`
- Text: `rgba(255,255,255,0.9)` primary, `rgba(255,255,255,0.5)` secondary

**Layout Paradigm**:
- iPhone 11 hardware frame rendered with CSS (silver aluminum bezels)
- Dynamic Island at top (pill-shaped) showing live agent status
- Camera feed fills the screen
- Floating glass cards for step indicators
- Bottom sheet for conversation history

**Signature Elements**:
1. Dynamic Island expands/contracts based on agent state
2. Glass morphism cards with subtle inner glow
3. Haptic-style micro-animations on interactions

**Interaction Philosophy**:
- Swipe gestures matching iOS conventions
- Tap to interrupt with haptic feedback simulation
- Smooth transitions between diagnostic steps

**Animation**:
- Spring physics (stiffness: 300, damping: 30) for all transitions
- Dynamic Island morphs between states
- Cards slide in from bottom with blur-in effect

**Typography System**:
- Primary: `SF Pro Display` equivalent via system font stack
- Fallback: `-apple-system, BlinkMacSystemFont, 'Helvetica Neue'`
- Sizes follow iOS type scale: 34/28/22/17/15/13
</idea>
<probability>0.08</probability>
</response>

<response>
<idea>
**Design Movement**: Tactical Field Operations — Military AR HUD

**Core Principles**:
1. Inspired by military targeting systems and field diagnostic tools
2. Olive/amber on dark charcoal — earthy but high-tech
3. Grid overlays, crosshair indicators, and range-finder aesthetics
4. Brutalist typography meets precision engineering

**Color Philosophy**:
- Background: `#111410` — dark olive black
- Primary: `#c8b400` — tactical amber/gold
- Secondary: `#4a7c59` — muted military green
- Alert: `#e84545` — target-lock red
- All panels use thin 1px borders in amber with no fill

**Layout Paradigm**:
- Asymmetric layout with status bars on left and right edges
- Crosshair overlay permanently visible in center
- Step counter displayed as mission objective in top-left
- Agent voice displayed as radio transmission text

**Signature Elements**:
1. Crosshair that snaps to detected router components
2. "SIGNAL ACQUIRED" / "SIGNAL LOST" status banners
3. Typewriter effect for all agent text output

**Interaction Philosophy**:
- Every action has a confirmation "beep" animation
- Tap = "lock target" visual feedback
- Steps feel like mission objectives being completed

**Animation**:
- Typewriter effect at 40ms per character for agent text
- Crosshair snaps with mechanical precision (no spring, just snap)
- Scan sweep in amber color

**Typography System**:
- Primary: `Share Tech Mono` — military terminal aesthetic
- Secondary: `Rajdhani` — structured display font
- All caps for status labels
</idea>
<probability>0.05</probability>
</response>

---

## Selected Design: **Cyberpunk Diagnostic Terminal (Response 1)**

Chosen for maximum visual impact in a hackathon demo context. The dark HUD with neon accents 
perfectly communicates "AI-powered diagnostic tool" and makes the AR overlays visually striking.
The camera feed as base layer is the most authentic representation of the use case.
