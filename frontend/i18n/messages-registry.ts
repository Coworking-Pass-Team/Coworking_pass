/**
 * Registry of Arabic versions of fixed English system sentences (toasts, validation and API errors).
 * Exact-match entries plus patterns for sentences that embed numbers or names ($1, $2 ... = capture groups).
 * Anything not registered is shown in English unchanged.
 */
const exact: Record<string, string> = {};
const patterns: Array<[RegExp, string]> = [];

export function registerMessages(entries: Record<string, string>, patternEntries: Array<[RegExp, string]> = []) {
  Object.assign(exact, entries);
  patterns.push(...patternEntries);
}

export function translateMessageToArabic(message: string): string {
  if (!message) return message;
  const direct = exact[message];
  if (direct) return direct;
  for (const [regex, replacement] of patterns) {
    const match = regex.exec(message);
    if (match) return replacement.replace(/\$(\d)/g, (_, i) => match[Number(i)] ?? '');
  }
  return message;
}
