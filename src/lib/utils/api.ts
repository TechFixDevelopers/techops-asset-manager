export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiFetch<T>(
  url: string,
  options?: ApiFetchOptions
): Promise<T> {
  const { body, headers, ...rest } = options ?? {};

  const config: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body !== undefined && body !== null
      ? { body: JSON.stringify(body) }
      : {}),
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      // Response body is not JSON
    }

    const message =
      errorData &&
      typeof errorData === 'object' &&
      'message' in errorData &&
      typeof (errorData as Record<string, unknown>).message === 'string'
        ? (errorData as Record<string, string>).message
        : `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message, errorData);
  }

  return response.json() as Promise<T>;
}

/**
 * Download a file from an API route (e.g. template-based Excel export).
 * Fetches the binary response and triggers a browser download.
 */
export async function apiDownload(url: string, fallbackFilename: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    let msg = `Export failed (${response.status})`;
    try {
      const err = await response.json();
      if (err?.error) msg = err.error;
    } catch { /* not JSON */ }
    throw new Error(msg);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  let filename = fallbackFilename;
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
