/*
 * Wrapper around fetch that adds timeout and improved error handling
 */
export async function fetchWithTimeout<T = any>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 10000,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const finalOptions: RequestInit = {
      ...options,
      signal: controller.signal,
    };

    const response = await fetch(url, finalOptions);
    clearTimeout(timeoutId);

    // No content
    if (response.status === 204) return (null as unknown) as T;

    const text = await response.text().catch(() => "");

    if (!response.ok) {
      // Try to parse JSON error body if present
      let parsed: any = undefined;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch (e) {
        parsed = undefined;
      }

      const message =
        (parsed && (parsed.error || parsed.message)) ||
        text ||
        response.statusText ||
        `HTTP ${response.status}`;

      const err = new Error(String(message));
      (err as any).status = response.status;
      (err as any).statusText = response.statusText;
      (err as any).body = parsed ?? text;
      throw err;
    }

    // Try parse JSON, fall back to text
    try {
      return (JSON.parse(text) as T) ?? (text as unknown as T);
    } catch (e) {
      return (text as unknown) as T;
    }
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Network error: Unable to reach the server. Please check your connection.",
      );
    }

    throw error;
  }
}

/**
 * Wrapper around fetch for non-JSON responses
 */
export async function fetchWithTimeoutText(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 10000,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const finalOptions: RequestInit = {
      ...options,
      signal: controller.signal,
    };

    const response = await fetch(url, finalOptions);
    clearTimeout(timeoutId);

    const text = await response.text().catch(() => "");

    if (!response.ok) {
      const message = text || response.statusText || `HTTP ${response.status}`;
      const err = new Error(String(message));
      (err as any).status = response.status;
      (err as any).body = text;
      throw err;
    }

    return text;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Network error: Unable to reach the server. Please check your connection.",
      );
    }

    throw error;
  }
}
