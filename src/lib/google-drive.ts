// Google Drive integration for Finance Flash
// Stores data as a JSON file in the user's Google Drive

const FILE_NAME = "finance-flash-data.json";
const MIME_TYPE = "application/json";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

// API helper to call our backend
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(endpoint, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

export async function getAuthUrl(): Promise<string> {
  const { url } = await apiCall<{ url: string }>("/api/auth/google");
  return url;
}

export async function exchangeCode(code: string): Promise<void> {
  await apiCall("/api/auth/callback", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function checkAuth(): Promise<{ authenticated: boolean; email?: string }> {
  return apiCall("/api/auth/status");
}

export async function logout(): Promise<void> {
  await apiCall("/api/auth/logout", { method: "POST" });
}

// Save data to Google Drive
export async function saveToDrive(data: unknown): Promise<void> {
  return apiCall("/api/google-drive/save", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
}

// Load data from Google Drive
export async function loadFromDrive<T>(): Promise<T | null> {
  return apiCall<T | null>("/api/google-drive/load");
}
