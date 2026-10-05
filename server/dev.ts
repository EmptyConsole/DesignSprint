// Local API server for development. Vite proxies /api/* here (see vite.config.ts).
// In production on Vercel, files in api/ are deployed as functions instead.
import { createServer } from "node:http";
import { POST as classify } from "../api/classify";

try {
  process.loadEnvFile(".env");
} catch {
  console.warn("[api] No .env file found — copy .env.example to .env and add OPENAI_API_KEY.");
}

const routes: Record<string, (req: Request) => Promise<Response>> = {
  "POST /api/classify": classify,
};

const PORT = Number(process.env.API_PORT) || 8787;

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const handler = routes[`${req.method} ${url.pathname}`];
  if (!handler) {
    res.writeHead(404, { "content-type": "application/json" }).end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);

  const request = new Request(url, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });

  const started = Date.now();
  const response = await handler(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
  console.log(`[api] ${req.method} ${url.pathname} → ${response.status} (${Date.now() - started}ms)`);
}).listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
