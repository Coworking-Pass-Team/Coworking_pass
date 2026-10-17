/** Message of anything that was thrown, without assuming it is an Error. */
export function errorMessage(error: unknown, fallback = ''): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}
