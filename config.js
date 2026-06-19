export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/evaluation-service";

let currentToken = "";
if (typeof window !== "undefined") {
  currentToken = window.localStorage.getItem("AUTH_TOKEN") || window.sessionStorage.getItem("AUTH_TOKEN") || "";
}
if (!currentToken) {
  currentToken = import.meta.env.VITE_AUTH_TOKEN || "";
}

console.log("[Auth] Loaded token. Length:", currentToken.length, "Prefix:", currentToken.substring(0, 20));

// Custom base64url decoder because JWT payload can contain '-' and '_' characters
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error("Invalid base64url string");
    }
    base64 += new Array(5 - pad).join('=');
  }
  return atob(base64);
}

// Decode JWT token helper to extract info for auth request
function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return payload;
  } catch (err) {
    console.error("[Auth] decodeToken error:", err);
    return null;
  }
}

// Check if token is expired (or close to expiring, e.g. within 30 seconds)
function isTokenExpired(token) {
  if (!token) return true;
  const payload = decodeToken(token);
  if (!payload) return true;
  
  const exp = payload.MapClaims?.exp || payload.exp;
  if (!exp) return false; // if no exp, assume not expired
  
  const expired = Date.now() >= (exp - 30) * 1000;
  console.log("[Auth] Token expiration check. Exp:", new Date(exp * 1000).toISOString(), "Expired:", expired);
  return expired;
}

export async function refreshToken() {
  const initialToken = import.meta.env.VITE_AUTH_TOKEN || "";
  const payload = decodeToken(initialToken);
  if (!payload) {
    console.error("[Auth] Cannot refresh: initial VITE_AUTH_TOKEN is missing or invalid");
    return currentToken;
  }

  const requestBody = {
    email: payload.email || payload.MapClaims?.email || "",
    name: payload.name || payload.MapClaims?.name || "",
    rollNo: payload.rollNo || payload.MapClaims?.rollNo || "",
    accessCode: payload.accessCode || payload.MapClaims?.accessCode || "",
    clientID: payload.clientID || payload.MapClaims?.clientID || payload.MapClaims?.sub || import.meta.env.VITE_CLIENT_ID || "",
    clientSecret: payload.clientSecret || payload.MapClaims?.clientSecret || import.meta.env.VITE_CLIENT_SECRET || "",
  };

  try {
    console.log("[Auth] Requesting fresh token from server...");
    const res = await fetch(`${BASE_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token || data.access_token) {
        currentToken = data.token || data.access_token;
        if (typeof window !== "undefined") {
          window.localStorage.setItem("AUTH_TOKEN", currentToken);
        }
        console.log("[Auth] Token refreshed successfully. New length:", currentToken.length);
      }
    } else {
      console.error("[Auth] Token refresh request failed with status:", res.status);
    }
  } catch (err) {
    console.error("[Auth] Failed to refresh token", err);
  }
  return currentToken;
}

export async function createHeaders(hasBody = false) {
  if (isTokenExpired(currentToken)) {
    await refreshToken();
  }
  const headers = {};
  if (hasBody) headers["Content-Type"] = "application/json";
  if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
  return headers;
}
