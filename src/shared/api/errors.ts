/**
 * Shared error class for any HTTP transport error.
 *
 * Why a dedicated class:
 *  - lets the UI distinguish "expected 404" from "network blown up" via
 *    `instanceof ApiError` + `status`;
 *  - carries the failing URL so observability traces are useful;
 *  - serializable (toJSON), so it can travel safely through error.tsx boundary.
 */
export class ApiError extends Error {
  public override readonly name = "ApiError";
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
  ) {
    super(message);
  }

  toJSON() {
    return { name: this.name, message: this.message, status: this.status, url: this.url };
  }
}
