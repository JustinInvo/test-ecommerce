import "server-only";
import { ApiError } from "./errors";

/**
 * Server-only HTTP transport.
 *
 * Wraps fetch to:
 *   - normalize errors into ApiError;
 *   - opt out of the per-request memo cache (Cache Components owns caching
 *     via the `'use cache'` directive in callers).
 *
 * Intentionally tiny - it should never grow business logic. SRP: transport only.
 */
export async function httpServer<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
  } catch (err) {
    throw new ApiError(
      `Network error fetching ${url}: ${(err as Error).message}`,
      0,
      url,
    );
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
      cache: "no-store",
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
  } catch (err) {
    throw new ApiError(
      `Network error fetching ${url}: ${(err as Error).message}`,
      0,
      url,
    );
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
