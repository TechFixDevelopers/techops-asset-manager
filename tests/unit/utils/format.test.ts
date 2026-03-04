import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, truncate } from '@/lib/utils/format';

describe('formatDate', () => {
  it('should format a Date object as DD/MM/YYYY', () => {
    const date = new Date('2024-03-15T10:30:00');
    expect(formatDate(date)).toBe('15/03/2024');
  });

  it('should format a string date as DD/MM/YYYY', () => {
    // Use full ISO string to avoid timezone ambiguity
    expect(formatDate('2024-01-05T12:00:00')).toBe('05/01/2024');
  });

  it('should return "-" for null', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('should return "-" for undefined', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('should return "-" for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('-');
  });
});

describe('formatDateTime', () => {
  it('should format as DD/MM/YYYY HH:mm', () => {
    const date = new Date('2024-03-15T14:30:00');
    expect(formatDateTime(date)).toBe('15/03/2024 14:30');
  });

  it('should return "-" for null', () => {
    expect(formatDateTime(null)).toBe('-');
  });
});

describe('truncate', () => {
  it('should return the string unchanged if shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('should truncate and add ... if longer than maxLength', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });

  it('should return exact string if equal to maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});
