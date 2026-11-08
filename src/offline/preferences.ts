export function readPreference<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(`huntingseasons:${key}`); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
export function writePreference(key: string, value: unknown) {
  try { localStorage.setItem(`huntingseasons:${key}`, JSON.stringify(value)); return true; } catch { return false; }
}
export function readPosition(): [number, number] {
  const value = readPreference<unknown>('position', null);
  return Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && Math.abs(value[0]) <= 90 && typeof value[1] === 'number' && Math.abs(value[1]) <= 180
    ? [value[0], value[1]] : [59.3293, 18.0686];
}
