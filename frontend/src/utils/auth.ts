import { API_BASE_URL } from "../config/env";

const BASE = API_BASE_URL;

// Token management
const TOKEN_KEY = "jwt_token";
const REFRESH_KEY = "jwt_refresh";

export const saveAuth = (access: string, refresh: string) => {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const removeAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export const hasAuth = () => !!getToken();

// Auth requests
export async function register(email: string, pwd: string, name: string) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pwd, fullName: name }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error);

  if (json.session) {
    saveAuth(json.session.access_token, json.session.refresh_token);
  }
  return json;
}

export async function login(email: string, pwd: string) {
  const res = await fetch(`${BASE}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pwd }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error);

  if (json.session) {
    saveAuth(json.session.access_token, json.session.refresh_token);
  }
  return json;
}

export async function logout() {
  const token = getToken();
  if (token) {
    await fetch(`${BASE}/auth/signout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  removeAuth();
}

export async function getProfile() {
  const token = getToken();
  if (!token) throw new Error("No auth");

  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed");
  return res.json();
}

// Helper for authenticated requests
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}
