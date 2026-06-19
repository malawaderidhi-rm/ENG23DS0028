const BASE_API_URL = typeof import.meta !== "undefined" ? import.meta.env.VITE_API_BASE_URL : undefined;
const LOG_API_URL = BASE_API_URL ? `${BASE_API_URL}/logs` : "http://4.224.186.213/evaluation-service/logs";

function resolveToken() {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("AUTH_TOKEN") || window.sessionStorage.getItem("AUTH_TOKEN");
    if (stored) return stored;
  }

  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_AUTH_TOKEN) {
    return import.meta.env.VITE_AUTH_TOKEN;
  }

  if (typeof process !== "undefined" && process.env?.VITE_AUTH_TOKEN) {
    return process.env.VITE_AUTH_TOKEN;
  }

  return "";
}

async function sendLog(payload) {
  const token = resolveToken();
  if (!token) {
    return;
  }

  await fetch(LOG_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function Log(stack, level, pkg, message) {
  if (!stack || !level || !pkg || !message) {
    return;
  }

  const payload = {
    stack: stack.toLowerCase(),
    level: level.toLowerCase(),
    package: pkg.toLowerCase(),
    message: String(message),
  };

  try {
    await sendLog(payload);
  } catch {
    // Logging should never break the app.
  }
}
