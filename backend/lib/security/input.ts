import { NextResponse } from "next/server";

export class InputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const MAX_AMOUNT = 100_000;
/** Validate before rounding so out-of-range inputs cannot round into the allowed interval. */
export function money(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1 || value > MAX_AMOUNT) {
    throw new InputError("Amount must be a finite number between 1.00 and 100,000.00 SAR.");
  }
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
export function positiveInteger(value: unknown, fallback = 1, max = 365): number {
  const n = value === undefined ? fallback : value;
  if (typeof n !== "number" || !Number.isSafeInteger(n) || n < 1 || n > max) throw new InputError("Invalid quantity.");
  return n;
}
/** Inspect numeric JSON tokens before parsing: JSON.parse discards exponent notation. */
export async function financialBody(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  // Consume quoted strings first, including escaped quotes, to avoid matching text inside strings.
  const tokens = raw.match(/"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g) ?? [];
  if (tokens.some(t => !t.startsWith('"') && /[eE]/.test(t))) throw new InputError("Scientific notation is not accepted.");
  let body: unknown;
  try { body = JSON.parse(raw); } catch { throw new InputError("Request body must be valid JSON."); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new InputError("Expected a JSON object.");
  const result = body as Record<string, unknown>;
  if (Object.hasOwn(result, "amount")) result.amount = money(result.amount);
  return result;
}
export function inputResponse(error: unknown): NextResponse | null {
  return error instanceof InputError ? NextResponse.json({ error: error.message }, { status: error.status }) : null;
}
