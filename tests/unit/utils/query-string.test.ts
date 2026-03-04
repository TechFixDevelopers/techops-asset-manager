import { describe, it, expect } from 'vitest';
import { toQueryString } from '@/lib/utils/query-string';

describe('toQueryString', () => {
  it('should convert params to query string', () => {
    const result = toQueryString({ page: 1, search: 'test' });
    expect(result).toContain('page=1');
    expect(result).toContain('search=test');
  });

  it('should skip null values', () => {
    const result = toQueryString({ page: 1, search: null });
    expect(result).toBe('page=1');
  });

  it('should skip undefined values', () => {
    const result = toQueryString({ page: 1, search: undefined });
    expect(result).toBe('page=1');
  });

  it('should skip empty string values', () => {
    const result = toQueryString({ page: 1, search: '' });
    expect(result).toBe('page=1');
  });

  it('should return empty string for all-empty params', () => {
    const result = toQueryString({ a: null, b: undefined, c: '' });
    expect(result).toBe('');
  });
});
