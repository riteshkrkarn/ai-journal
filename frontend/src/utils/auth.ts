import { API_BASE_URL } from "../config/env";

const BASE = API_BASE_URL;

const TOKEN_KEY = "jwt_token";
const REFRESH_KEY = "jwt_refresh";
const EXPIRES_AT_KEY = "auth_expires_at";
const REMEMBER_ME_KEY = "auth_remember_me";
const SESSION_ACTIVE_KEY = "auth_session_active";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const saveAuth = (
  access: string,
  refresh: string,
  rememberMe = false
) => {
  const ttl = rememberMe ? SEVEN_DAYS_MS : ONE_DAY_MS;
  const expiresAt = Date.now() + ttl;

  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "true" : "false");

  if (!rememberMe) {
    sessionStorage.setItem(SESSION_ACTIVE_KEY, "1");
  } else {
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
  }
};

export const removeAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.removeItem(SESSION_ACTIVE_KEY);
};

export const getToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === "true";
  const expiresAtRaw = localStorage.getItem(EXPIRES_AT_KEY);

  // If user did not select Remember Me and browser session ended, clear auth
  if (
    localStorage.getItem(REMEMBER_ME_KEY) === "false" &&
    !sessionStorage.getItem(SESSION_ACTIVE_KEY)
  ) {
    removeAuth();
    return null;
  }

  if (expiresAtRaw) {
    const expiresAt = Number(expiresAtRaw);
    if (!Number.isNaN(expiresAt) && Date.now() > expiresAt) {
      removeAuth();
      return null;
    }
  } else if (!rememberMe) {
    // Legacy token without expiry metadata
    return token;
  }

  return token;
};

export const hasAuth = () => !!getToken();

export async function register(email: string, pwd: string, name: string) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pwd, fullName: name }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error);

  if (json.session) {
    saveAuth(json.session.access_token, json.session.refresh_token, false);
  }
  return json;
}

export async function login(email: string, pwd: string, rememberMe = false) {
  const res = await fetch(`${BASE}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pwd, rememberMe }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error);

  if (json.session) {
    saveAuth(json.session.access_token, json.session.refresh_token, rememberMe);
  }
  return json;
}

export async function verifyLoginCode(
  email: string,
  pwd: string,
  code: string,
  rememberMe = false
) {
  const res = await fetch(`${BASE}/auth/verify-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pwd, code, rememberMe }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error);

  if (json.session) {
    saveAuth(
      json.session.access_token,
      json.session.refresh_token,
      Boolean(json.rememberMe ?? rememberMe)
    );
  }
  return json;
}

export async function resendLoginCode(email: string) {
  const res = await fetch(`${BASE}/auth/resend-login-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json;
}

export async function requestPasswordCode(email: string) {
  const res = await fetch(`${BASE}/auth/password/request-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json;
}

export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string
) {
  const res = await fetch(`${BASE}/auth/password/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
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
