// POST /api/classify — Web-standard handler. Vercel runs this file directly as
// a serverless function; locally, server/dev.ts wraps it in a Node server.
import OpenAI from "openai";
import { classify, HttpError, parseRequest } from "../server/classify";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export async function POST(request: Request): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new HttpError(400, "Request body must be JSON.");
    }
    return json(200, await classify(parseRequest(body)));
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.message });
    if (err instanceof OpenAI.APIError) {
      console.error("[classify] OpenAI error", err.status, err.message);
      const message =
        err.status === 401
          ? "The server's OpenAI API key was rejected."
          : err.status === 429
            ? "Too many requests right now — try again in a moment."
            : "The AI service had a problem. Please try again.";
      return json(502, { error: message });
    }
    console.error("[classify] unexpected error", err);
    return json(500, { error: "Something went wrong. Please try again." });
  }
}
