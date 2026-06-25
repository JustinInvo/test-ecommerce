import "server-only";
import { ApiError } from "./errors";

/**
 * Server-only HTTP transport.
 *
 * Wraps fetch to:
 *   - normalize errors into ApiError;
 *   - enforce a hard timeout so a hanging upstream can never freeze a
 *     serverless function (Vercel kills the lambda after the function timeout
 *     and the client just sees a 500 with no useful digest);
 *   - delegate caching to the Cache Components layer via `'use cache'` in
 *     callers - we no longer pass `cache: "no-store"` because that directive
 *     conflicts with `'use cache'` in Next 16 and silently disables caching.
 *
 * Intentionally tiny - it should never grow business logic. SRP: transport only.
 */

/** Upstream timeout. FakeStore should answer in <1s; 8s is generous. */
const HTTP_TIMEOUT_MS = 8_000;

function timeoutSignal(ms: number): AbortSignal {
  // AbortSignal.timeout is available in Node 18+ (Vercel runs >=18).
  return AbortSignal.timeout(ms);
}

export async function httpServer<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      signal: init?.signal ?? timeoutSignal(HTTP_TIMEOUT_MS),
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
  } catch (err) {
    const e = err as Error & { name?: string };
    const reason =
      e?.name === "TimeoutError" || e?.name === "AbortError"
        ? `Timeout after ${HTTP_TIMEOUT_MS}ms`
        : e?.message ?? "Unknown network error";
    throw new ApiError(`Network error fetching ${url}: ${reason}`, 0, url);
  }
  if (!res.ok) {
    throw new ApiError(`Upstream ${res.status} for ${url}`, res.status, url);
  }
  return (await res.json()) as T;
}

/** Same as httpServer but tolerates empty / null bodies (used for /products/:id). */
export async function httpServerNullable<T>(
  url: string,
  init?: RequestInit,
): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(url, {
      signal: init?.signal ?? timeoutSignal(HTTP_TIMEOUT_MS),
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
  } catch (err) {
    const e = err as Error & { name?: string };
    const reason =
      e?.name === "TimeoutError" || e?.name === "AbortError"
        ? `Timeout after ${HTTP_TIMEOUT_MS}ms`
        : e?.message ?? "Unknown network error";
    throw new ApiError(`Network error fetching ${url}: ${reason}`, 0, url);
  }
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new ApiError(`Upstream ${res.status} for ${url}`, res.status, url);
  }
  const text = await res.text();
  if (!text || text === "null") return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("Malformed JSON payload", 502, url);
  }
}
