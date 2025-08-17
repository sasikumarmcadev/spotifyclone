
export async function sFetch<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {}
): Promise<T | null> {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (res.status === 204) {
    return null;
  }

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "1", 10);
    console.log(`Spotify API rate limited. Retrying after ${retryAfter} seconds.`);
    await new Promise((r) => setTimeout(r, (retryAfter + 1) * 1000));
    return sFetch(accessToken, path, init);
  }

  const data = await res.json();

  if (!res.ok) {
    const errorMessage = `Spotify API Error: ${res.status} ${res.statusText} - ${JSON.stringify(data.error)}`;
    console.error(errorMessage);
    throw new Error(data.error?.message || "Failed to fetch from Spotify API.");
  }

  return data as T;
}
