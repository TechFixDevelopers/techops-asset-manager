import { NextRequest } from 'next/server';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Extract the last path segment from a NextRequest URL and validate it as a UUID.
 * Throws an error if the segment is missing or not a valid UUID.
 */
export function extractIdFromPath(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/').filter(Boolean);
  const id = segments[segments.length - 1];

  if (!id || !UUID_REGEX.test(id)) {
    throw new Error(`Invalid or missing UUID in path: ${req.nextUrl.pathname}`);
  }

  return id;
}
