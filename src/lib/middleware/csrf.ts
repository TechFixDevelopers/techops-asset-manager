import { NextRequest } from 'next/server';

export function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');

  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

/**
 * Validates CSRF only for state-changing HTTP methods.
 * GET, HEAD, OPTIONS are considered safe and skip validation.
 */
export function validateCsrf(req: NextRequest): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return true;
  return validateOrigin(req);
}
