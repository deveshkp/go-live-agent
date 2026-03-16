# go-live-agent

Go-live is your real-time AI pocket handyman. Say **"Hey Go-live"** and point your phone camera at the issue—router, breaker panel, privacy lock, garage door, squeaky hinge, or similar basic home problem.

## Features

- 📷 **Live camera feed** – uses the device's rear camera for real-time viewing
- 🎙️ **Wake-word detection** – just say *"Hey Go-live"* (no button required)
- 🤖 **AI-powered guidance** – sends the camera frame to GPT-4o Vision and returns concise step-by-step repair instructions
- 🔊 **Text-to-speech** – optionally reads the guidance aloud
- 📱 **Mobile-first UI** – works in any modern mobile browser as a Progressive Web App

## Quick start

### Prerequisites

- Node.js ≥ 18
- An [OpenAI API key](https://platform.openai.com/api-keys) with access to GPT-4o

### Installation

```bash
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...
```

### Running

```bash
npm start          # production
npm run dev        # development (nodemon auto-reload)
```

Open `http://localhost:3000` in your browser (or on your phone via your local network IP).

### Testing

```bash
npm test
```

## How it works

1. The browser starts the rear camera and continuously listens for speech via the Web Speech API.
2. When the wake phrase *"Hey Go-live"* is detected (or the shutter button is tapped), the current video frame is captured as a JPEG.
3. The image is sent to `POST /api/analyze` on the Express backend.
4. The backend proxies the image to OpenAI GPT-4o Vision with a system prompt tuned for home-repair guidance.
5. The guidance is returned to the browser, displayed on screen, and optionally spoken aloud.

## Project structure

```
go-live-agent/
├── server.js           # Express server & API routes
├── src/
│   └── analyzeImage.js # OpenAI Vision wrapper
├── public/
│   ├── index.html      # Mobile-optimised UI
│   ├── app.js          # Client-side voice + camera logic
│   └── styles.css      # Styles
├── tests/
│   ├── server.test.js
│   ├── analyzeImage.test.js
│   └── wakeWord.test.js
└── .env.example
```
