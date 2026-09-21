// frontend/src/api.ts

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const response = await fetch(endpoint, {
    ...options,
    credentials: "include", // Ensure session cookies are sent with requests
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}
