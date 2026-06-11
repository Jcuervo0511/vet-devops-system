export const CHAOS_DEFAULT_DELAY_MS = 3000;
export const CHAOS_DEFAULT_MEMORY_MB = 1;
export const CHAOS_RETRY_DELAY_MS = 100;

export function isEnabled(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

export function positiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
