const STORAGE_KEY = "viewedNotificationIds";

export function getViewedNotificationIds() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function markNotificationsViewed(ids) {
  const current = getViewedNotificationIds();
  const merged = Array.from(new Set([...current, ...ids.filter(Boolean)]));

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore session storage failures.
  }

  return merged;
}
