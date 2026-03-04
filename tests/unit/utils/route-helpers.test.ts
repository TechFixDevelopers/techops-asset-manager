import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { extractIdFromPath } from '@/lib/utils/route-helpers';

describe('extractIdFromPath', () => {
  it('should extract a valid UUID from the path', () => {
    const req = new NextRequest(
      'http://localhost:3000/api/equipos/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    );
    expect(extractIdFromPath(req)).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  it('should throw for a non-UUID path segment', () => {
    const req = new NextRequest('http://localhost:3000/api/equipos/not-a-uuid');
    expect(() => extractIdFromPath(req)).toThrow('Invalid or missing UUID');
  });

  it('should throw for an empty path', () => {
    const req = new NextRequest('http://localhost:3000/');
    expect(() => extractIdFromPath(req)).toThrow();
  });
});
