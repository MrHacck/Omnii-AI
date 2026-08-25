# Omni AI Hub

One interface, many AI models — chat, image generation, and voice in a single Next.js app.

Instead of trying to be "one model that does everything", Omni AI Hub routes each request to the best available provider:

| Capability | Provider |
| --- | --- |
| Chat (no key needed) | Pollinations free text model |
| Chat (premium) | OpenAI GPT-4o-mini, Google Gemini flash |
| Auto-routing | Picks a provider based on the prompt (code/math → OpenAI when a key exists, otherwise Gemini/free) |
| Image generation | Pollinations image API (Flux-based, no key needed) |
| Voice input | Browser SpeechRecognition (mic button) |
| Voice output | Browser speechSynthesis ("Speak replies" toggle) |

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## API keys (optional)

The app works with no keys at all (free model + free image API, rate-limited).
To unlock premium models, either:

- enter keys in the **Settings** tab (stored in your browser's localStorage), or
- set server-side env vars (see `.env.example`): `GEMINI_API_KEY`, `OPENAI_API_KEY`.

## Notes

- The free text model is anonymously rate-limited; the app retries automatically and tells you when to wait.
- Keys entered in Settings are sent only to this app's own `/api/chat` route, never stored server-side.
