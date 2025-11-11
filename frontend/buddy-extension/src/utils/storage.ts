const TOKEN_KEY = "buddy_token";

export async function saveToken(token: string): Promise<void> {
  if (chrome?.storage?.local) {
    await chrome.storage.local.set({ [TOKEN_KEY]: token });
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  if (chrome?.storage?.local) {
    const data = await chrome.storage.local.get(TOKEN_KEY);
    return (data?.[TOKEN_KEY] as string) || null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  if (chrome?.storage?.local) {
    await chrome.storage.local.remove(TOKEN_KEY);
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
}
