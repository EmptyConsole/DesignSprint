import type { ClassifyRequest, ClassifyResponse } from "./types";

export async function classifyPhoto(req: ClassifyRequest, signal?: AbortSignal): Promise<ClassifyResponse> {
  let res: Response;
  try {
    res = await fetch("/api/classify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Server error (${res.status}).`);
  return data as ClassifyResponse;
}
