export const MAX_HISTORY = 10;

export function addToHistory(history: string[], prompt: string): string[] {
  return [prompt, ...history.filter((p) => p !== prompt)].slice(0, MAX_HISTORY);
}

export function reviveHistory(parsed: unknown): string[] {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((p): p is string => typeof p === 'string').slice(0, MAX_HISTORY);
}
