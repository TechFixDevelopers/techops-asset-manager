import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { validateOrigin, validateCsrf } from '@/lib/middleware/csrf';

function createRequest(
  method: string,
  origin?: string,
  host?: string,
): NextRequest {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  if (host) headers.set('host', host);

  return new NextRequest('http://localhost:3000/api/test', {
    method,
    headers,
  });
}

describe('validateOrigin', () => {
  it('should return true when origin matches host', () => {
    const req = createRequest('POST', 'http://localhost:3000', 'localhost:3000');
    expect(validateOrigin(req)).toBe(true);
  });

  it('should return false when origin does not match host', () => {
    const req = createRequest('POST', 'http://evil.com', 'localhost:3000');
    expect(validateOrigin(req)).toBe(false);
  });

  it('should return false when origin is missing', () => {
    const req = createRequest('POST', undefined, 'localhost:3000');
    expect(validateOrigin(req)).toBe(false);
  });

  it('should return false when host is missing', () => {
    const req = createRequest('POST', 'http://localhost:3000');
    expect(validateOrigin(req)).toBe(false);
  });

  it('should return false for invalid origin URL', () => {
    const headers = new Headers();
    headers.set('origin', 'not-a-url');
    headers.set('host', 'localhost:3000');
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers,
    });
    expect(validateOrigin(req)).toBe(false);
  });
});

describe('validateCsrf', () => {
  it('should skip validation for GET requests', () => {
    const req = createRequest('GET');
    expect(validateCsrf(req)).toBe(true);
  });

  it('should skip validation for HEAD requests', () => {
    const req = createRequest('HEAD');
    expect(validateCsrf(req)).toBe(true);
  });

  it('should skip validation for OPTIONS requests', () => {
    const req = createRequest('OPTIONS');
    expect(validateCsrf(req)).toBe(true);
  });

  it('should validate origin for POST requests', () => {
    const req = createRequest('POST', 'http://localhost:3000', 'localhost:3000');
    expect(validateCsrf(req)).toBe(true);
  });

  it('should reject POST with mismatched origin', () => {
    const req = createRequest('POST', 'http://evil.com', 'localhost:3000');
    expect(validateCsrf(req)).toBe(false);
  });

  it('should validate origin for PATCH requests', () => {
    const req = createRequest('PATCH', 'http://localhost:3000', 'localhost:3000');
    expect(validateCsrf(req)).toBe(true);
  });

  it('should validate origin for DELETE requests', () => {
    const req = createRequest('DELETE', 'http://localhost:3000', 'localhost:3000');
    expect(validateCsrf(req)).toBe(true);
  });
});
