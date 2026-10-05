# Sortly

Point your phone at an item → find out if it's **Recycling**, **Compost**, **Trash**, or needs **Special** handling — by *your* local rules.

## Setup

```bash
npm install
cp .env.example .env      # then put your OpenAI key in .env (gitignored)
npm run dev               # web on http://localhost:5173, API on :8787
```

### Testing on your phone

Phones only allow the live camera over HTTPS, so use:

```bash
npm run dev:phone
```

Open the `Network` URL it prints (e.g. `https://192.168.1.20:5173`) on your phone (same Wi-Fi) and accept the self-signed certificate warning once. The photo-upload button works without HTTPS too.

## How it works

```
Browser (React + TS, Vite)                       Server (Node + TS)
 camera / upload → resize to ≤1024px JPEG  ──►  api/classify.ts
 location: IP estimate → manual → GPS              └─ OpenAI Responses API (gpt-5-mini)
                                                      image + location → strict JSON schema
 result card  ◄─────────────────────────────────── { category, reason, steps, special, details }
```

- **Location** — estimated from IP by default (ipapi.co, fallback geojs.io). Tap the chip to type a city/ZIP, or the target button for GPS (reverse-geocoded with BigDataCloud). Saved on the device.
- **Fast vs Advanced** — Fast answers from model knowledge (~2–5 s). Advanced turns on OpenAI web search to check official local guidance and shows the sources (~10–20 s).
- **Result** — one glanceable card (category, one-sentence reason, ≤3 steps). "Special" items get a hazard-striped card with *where to take it*. Details (local rule, why it matters, common mistake, better alternative) sit below the fold as short tiles.
- **Secrets** — the API key only lives on the server (`.env` locally, Vercel env vars in production). It never reaches the browser bundle.

## Project layout

```
api/classify.ts      POST /api/classify — Web-standard handler (deploys as a Vercel function)
server/classify.ts   validation + OpenAI call + response tidying
server/prompt.ts     system instructions (location-aware)
server/schema.ts     JSON schema for structured output
server/dev.ts        local Node server wrapping api/ (Vite proxies /api here)
src/                 React app (components/, lib/)
```

## Deploying to Vercel

1. Import the repo in Vercel (framework preset: Vite — already set in `vercel.json`).
2. Add `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) under Project Settings → Environment Variables.
3. Deploy. `api/classify.ts` becomes a serverless function automatically; `vercel.json` gives it up to 60 s for Advanced mode.

Optional upgrade: on Vercel you can read the `x-vercel-ip-city` / `x-vercel-ip-country-region` request headers for a server-side IP location instead of the third-party lookup.
