import OpenAI from "openai";
import type { Response as OpenAIResponse, ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import type { Classification, ClassifyRequest, ClassifyResponse, LocationInfo, Source } from "../src/lib/types";
import { buildInstructions } from "./prompt";
import { classificationSchema } from "./schema";

const MAX_IMAGE_CHARS = 6_000_000; // ~4.5MB of base64, matches Vercel's body limit

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let client: OpenAI | null = null;
function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-...") {
    throw new HttpError(500, "Server is missing OPENAI_API_KEY. Add it to .env (see .env.example).");
  }
  client ??= new OpenAI({ apiKey });
  return client;
}

const str = (v: unknown, max = 120) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Validate untrusted request JSON into a ClassifyRequest. */
export function parseRequest(body: unknown): ClassifyRequest {
  if (!body || typeof body !== "object") throw new HttpError(400, "Invalid request body.");
  const b = body as Record<string, unknown>;
  const image = b.image;
  if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) {
    throw new HttpError(400, "Expected a JPEG, PNG or WebP image.");
  }
  if (image.length > MAX_IMAGE_CHARS) throw new HttpError(413, "Image is too large.");

  const l = (b.location ?? {}) as Record<string, unknown>;
  const source = l.source === "precise" || l.source === "manual" ? l.source : "ip";
  const location: LocationInfo = {
    source,
    label: str(l.label) ?? "Unknown location",
    city: str(l.city),
    region: str(l.region),
    regionCode: str(l.regionCode, 10),
    country: str(l.country),
    countryCode: str(l.countryCode, 2)?.toUpperCase(),
    postal: str(l.postal, 16),
    lat: num(l.lat),
    lon: num(l.lon),
  };
  return { image, location, advanced: b.advanced === true };
}

function clip(s: string, maxWords: number): string {
  const words = s.trim().split(/\s+/);
  return words.length <= maxWords ? s.trim() : words.slice(0, maxWords).join(" ") + "…";
}

/** Defensive trimming in case the model ignores a length rule. */
function tidy(r: Classification): Classification {
  return {
    ...r,
    reason: clip(r.reason, 30),
    steps: r.steps.slice(0, 3).map((s) => clip(s, 8)),
    parts: r.parts.slice(0, 4),
    special: r.category === "special" ? r.special : null,
  };
}

function extractSources(res: OpenAIResponse): Source[] {
  const seen = new Map<string, Source>();
  const add = (url: string | undefined, title?: string) => {
    if (!url || !/^https?:\/\//.test(url)) return;
    const clean = url.replace(/[?&]utm_source=openai$/, "");
    if (!seen.has(clean)) seen.set(clean, { url: clean, title: title || new URL(clean).hostname.replace(/^www\./, "") });
  };
  for (const item of res.output) {
    if (item.type === "message") {
      for (const c of item.content) {
        if (c.type !== "output_text") continue;
        for (const a of c.annotations) if (a.type === "url_citation") add(a.url, a.title);
      }
    } else if (item.type === "web_search_call" && item.action.type === "search") {
      for (const s of item.action.sources ?? []) add(s.url);
    }
  }
  return [...seen.values()].slice(0, 5);
}

export async function classify(req: ClassifyRequest): Promise<ClassifyResponse> {
  const started = Date.now();
  const openai = getClient();
  const { location, advanced } = req;

  const params: ResponseCreateParamsNonStreaming = {
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    instructions: buildInstructions(location, advanced),
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: "How do I dispose of this here?" },
          { type: "input_image", image_url: req.image, detail: "auto" },
        ],
      },
    ],
    // web_search needs at least "low" effort; "minimal" keeps the fast path fast.
    reasoning: { effort: advanced ? "low" : "minimal" },
    text: {
      verbosity: "low",
      format: { type: "json_schema", name: "classification", strict: true, schema: classificationSchema },
    },
    ...(advanced && {
      tools: [
        {
          type: "web_search" as const,
          search_context_size: "low" as const,
          user_location: {
            type: "approximate" as const,
            ...(location.city && { city: location.city }),
            ...(location.region && { region: location.region }),
            ...(location.countryCode && { country: location.countryCode }),
          },
        },
      ],
      include: ["web_search_call.action.sources" as const],
    }),
  };

  let res: OpenAIResponse;
  try {
    res = await openai.responses.create(params);
  } catch (err) {
    // A different OPENAI_MODEL may not support "minimal" effort — retry with the model's default.
    if (err instanceof OpenAI.BadRequestError && /reasoning|effort/i.test(err.message)) {
      const { reasoning: _omit, ...rest } = params;
      res = await openai.responses.create(rest);
    } else {
      throw err;
    }
  }

  if (!res.output_text) {
    throw new HttpError(502, "The model returned no answer. Please try again.");
  }
  let result: Classification;
  try {
    result = JSON.parse(res.output_text);
  } catch {
    throw new HttpError(502, "Couldn't read the model's answer. Please try again.");
  }

  return { result: tidy(result), sources: advanced ? extractSources(res) : [], advanced, ms: Date.now() - started };
}
