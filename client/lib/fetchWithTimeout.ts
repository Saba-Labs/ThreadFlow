/**
 * Wrapper around fetch that adds timeout and better error handling
 */
export async function fetchWithTimeout<T>(
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof TypeError && error.message.includes("fetch")) {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Network error: Unable to reach the server. Please check your connection.",
      );
    }

    throw error;
  }
}
