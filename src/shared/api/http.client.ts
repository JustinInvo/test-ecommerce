import { ApiError } from "./errors";

/**
 * Client-side HTTP transport. Browser-safe (no `server-only` import).
 *
 *  - `cache: "force-cache"` so the browser HTTP cache + Next router cache get
 *    a chance to dedupe across islands (cart, recommended, etc.). For freshness,
 *    callers pass `cache: "no-store"` explicitly.
 *  - `signal` is supported so callers can cancel on unmount (prevents
 *    setState-after-unmount warnings).
 */
export async function httpClient<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      cache: "force-cache",
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
