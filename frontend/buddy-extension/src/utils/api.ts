export const DEFAULT_BACKEND = "http://localhost:3175";
export const BACKEND_URL = DEFAULT_BACKEND; // could be made configurable via options page later

// Token provider gets injected from storage util to avoid import cycle
let getToken: (() => Promise<string | null>) | null = null;
export function __injectGetToken(fn: () => Promise<string | null>) {
  getToken = fn;
}

async function authHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (getToken) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function askForHints(problemText: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/ai/hints`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ problemText }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend error ${res.status}: ${text}`);
  }
  const json = (await res.json()) as { success: boolean; hint?: string; message?: string };
  if (!json.success) {
    throw new Error(json.message || "Unknown backend error");
  }
  return json.hint || "";
}

// Auth APIs
export type AuthUser = { id: string; email: string; name?: string; isEmailVerified: boolean };
export type AuthResponse = { success: boolean; token?: string; user?: AuthUser; message?: string };

export async function sendOtp(email: string, password?: string, name?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || `Failed to send OTP (${res.status})`);
  return json;
}

export async function verifyOtp(email: string, otp: string, name?: string): Promise<AuthResponse> {
  const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, name }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || `OTP verification failed (${res.status})`);
  return json as AuthResponse;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || `Login failed (${res.status})`);
  return json as AuthResponse;
}

export async function getMe(): Promise<AuthResponse> {
  const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: await authHeaders(),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || `Failed to fetch profile (${res.status})`);
  return json as AuthResponse;
}

// Quiz API
export type QuizType = "mcq" | "short";
export async function generateQuiz(text: string, type: QuizType, numQuestions: number) {
  const res = await fetch(`${BACKEND_URL}/api/ai/quiz`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ text, type, numQuestions }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || `Quiz generation failed (${res.status})`);
  return json;
}

// Chat API
export async function aiChat(message: string, history: Array<{ role: "user" | "assistant"; content: string }>=[]) {
  const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ message, history }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json?.message || `Chat failed (${res.status})`);
  return json as { success: true; reply: string };
}

export async function getChatHistoryApi() {
  const res = await fetch(`${BACKEND_URL}/api/ai/chat/history`, {
    headers: await authHeaders(),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json?.message || `Load history failed (${res.status})`);
  return json as { success: true; messages: Array<{ role: "user" | "assistant"; content: string }> };
}

export async function clearChatApi() {
  const res = await fetch(`${BACKEND_URL}/api/ai/chat/clear`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json?.message || `Clear chat failed (${res.status})`);
  return json as { success: true; message: string };
}

