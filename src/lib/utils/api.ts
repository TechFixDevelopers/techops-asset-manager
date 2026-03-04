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
