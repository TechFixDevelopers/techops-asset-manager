import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, resetRateLimit, clearAllRateLimits } from '@/lib/middleware/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  it('should allow requests under the limit', () => {
    const result = rateLimit('test-user', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should block requests when limit is reached', () => {
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      rateLimit('block-test', limit, 60_000);
    }
    const result = rateLimit('block-test', limit, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should track remaining count correctly', () => {
    const limit = 5;
    const r1 = rateLimit('count-test', limit, 60_000);
    expect(r1.remaining).toBe(4);
    const r2 = rateLimit('count-test', limit, 60_000);
    expect(r2.remaining).toBe(3);
    const r3 = rateLimit('count-test', limit, 60_000);
    expect(r3.remaining).toBe(2);
  });

  it('should isolate different identifiers', () => {
    rateLimit('user-a', 1, 60_000);
    const resultA = rateLimit('user-a', 1, 60_000);
    const resultB = rateLimit('user-b', 1, 60_000);

    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });

  it('should reset rate limit for a specific identifier', () => {
    const limit = 2;
    rateLimit('reset-test', limit, 60_000);
    rateLimit('reset-test', limit, 60_000);
    const blocked = rateLimit('reset-test', limit, 60_000);
    expect(blocked.allowed).toBe(false);

    resetRateLimit('reset-test');

    const afterReset = rateLimit('reset-test', limit, 60_000);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(1);
  });

  it('should clear all rate limits', () => {
    rateLimit('clear-a', 1, 60_000);
    rateLimit('clear-b', 1, 60_000);
    const blockedA = rateLimit('clear-a', 1, 60_000);
    const blockedB = rateLimit('clear-b', 1, 60_000);
    expect(blockedA.allowed).toBe(false);
    expect(blockedB.allowed).toBe(false);

    clearAllRateLimits();

    const afterClearA = rateLimit('clear-a', 1, 60_000);
    const afterClearB = rateLimit('clear-b', 1, 60_000);
    expect(afterClearA.allowed).toBe(true);
    expect(afterClearB.allowed).toBe(true);
  });

  it('should reset window when window expires', () => {
    // Use a very small window (1ms) to test expiry
    rateLimit('expiry-test', 1, 1);

    // Wait for window to expire
    const start = Date.now();
    while (Date.now() - start < 5) {
      // busy wait
    }

    const result = rateLimit('expiry-test', 1, 1);
    expect(result.allowed).toBe(true);
  });
});
