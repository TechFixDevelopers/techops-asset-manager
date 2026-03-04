const MAX_ENTRIES = 10_000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

interface RateLimitEntry {
  count: number;
  lastReset: number;
  windowMs: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now - entry.lastReset > entry.windowMs) {
        rateLimitMap.delete(key);
      }
    }
    if (rateLimitMap.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL_MS);
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    (cleanupTimer as NodeJS.Timeout).unref();
  }
}

export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000,
): { allowed: boolean; remaining: number } {
  ensureCleanup();

  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now - record.lastReset > windowMs) {
    if (rateLimitMap.size >= MAX_ENTRIES) {
      const entriesToDelete = Math.floor(MAX_ENTRIES / 2);
      const iterator = rateLimitMap.keys();
      for (let i = 0; i < entriesToDelete; i++) {
        const key = iterator.next().value;
        if (key) rateLimitMap.delete(key);
      }
    }
    rateLimitMap.set(identifier, { count: 1, lastReset: now, windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}

export function clearAllRateLimits(): void {
  rateLimitMap.clear();
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
