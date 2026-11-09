/**
 * One place for the backend address and for how requests to it behave.
 *
 * - NEXT_PUBLIC_API_URL (with or without a trailing /api) points the whole app at another backend; nothing else in
 *   the frontend needs to change. Without it, a page served from port 3001 talks to itself and everything else uses
 *   the QA deployment.
 * - Every request gets a timeout, so a sleeping serverless backend never leaves a screen waiting forever.
 * - Reads (GET/HEAD) are retried on a network error, a timeout or a 502/503/504, which absorbs cold starts.
 *   Writes are never retried automatically, so a booking or a payment cannot be sent twice.
 */
const DEFAULT_API_ORIGIN = 'https://coworking-pass-backend.vercel.app';

export const API_TIMEOUT_MS = 10_000;
export const API_READ_RETRIES = 2;
const RETRY_BACKOFF_MS = 700;
const RETRYABLE_STATUS = new Set([502, 503, 504]);

/** Backend origin without a trailing slash or /api, e.g. https://api.example.com */
export function apiOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window === 'undefined' ? process.env.API_URL : undefined);
  if (envUrl) return envUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  if (typeof window !== 'undefined' && window.location?.port === '3001') return 'http://localhost:3001';
  return DEFAULT_API_ORIGIN;
}

/** Base for REST calls, e.g. https://api.example.com/api */
export function apiBase(): string {
  return `${apiOrigin()}/api`;
}

export interface RetryOptions {
  /** Abort a single attempt after this long (default 10 s). */
  timeoutMs?: number;
  /** Extra attempts for reads (default 2); writes are always sent once. */
  retries?: number;
}

const pendingCheckoutKeys = new Map<string, string>();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fetch() with a per-attempt timeout and, for reads, automatic retries with a growing pause. Resolves with the
 * last response (even a 5xx) so callers keep their own status handling; rejects only when no attempt got through.
 */
export async function fetchWithRetry(input: string, init: RequestInit & RetryOptions = {}): Promise<Response> {
  const { timeoutMs = API_TIMEOUT_MS, retries, ...request } = init;
  const method = (request.method || 'GET').toUpperCase();
  const financial = method === 'POST' && /\/(direct-bookings|hourly-bookings|subscriptions|payments|wallet|mock-payment)$/.test(input);
  const headers = new Headers(request.headers);
  const identity = `${input}:${headers.get('Authorization')}:${String(request.body)}`;
  if (financial && !headers.has('Idempotency-Key')) {
    const key = pendingCheckoutKeys.get(identity) ?? crypto.randomUUID();
    pendingCheckoutKeys.set(identity, key);
    headers.set('Idempotency-Key', key);
    request.headers = headers;
  }
  const attempts = 1 + (method === 'GET' || method === 'HEAD' ? retries ?? API_READ_RETRIES : 0);

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    // A caller's own abort still stops the request
    const outer = request.signal;
    const relay = () => controller.abort();
    outer?.addEventListener('abort', relay, { once: true });
    try {
      const response = await fetch(input, { ...request, signal: controller.signal });
      if (financial && response.status < 500) pendingCheckoutKeys.delete(identity);
      if (response.status === 429 && input.includes('/auth/') && typeof window !== 'undefined') {
        const limited = await response.clone().json().catch(() => ({}));
        window.dispatchEvent(new CustomEvent('otp-throttle', { detail: limited }));
      }
      if (!RETRYABLE_STATUS.has(response.status) || attempt === attempts) return response;
    } catch (err) {
      if (outer?.aborted) throw err;
      lastError = err;
      if (attempt === attempts) throw err;
    } finally {
      clearTimeout(timer);
      outer?.removeEventListener('abort', relay);
    }
    await wait(RETRY_BACKOFF_MS * attempt);
  }
  throw lastError ?? new Error('Request failed');
}
