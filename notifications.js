import { Log } from "../logger";
import { BASE_URL, createHeaders } from "./config";

const NOTIFICATIONS_URL = `${BASE_URL}/notifications`;

function buildQuery(params) {
  const query = new URLSearchParams();

  if (params.limit) query.append("limit", String(params.limit));
  if (params.page) query.append("page", String(params.page));
  if (params.notification_type && params.notification_type !== "All") {
    query.append("notification_type", params.notification_type);
  }

  return query.toString();
}

function normalizeNotifications(data) {
  const notifications = Array.isArray(data.notifications) ? data.notifications : [];

  return notifications.map((notification) => ({
    ...notification,
    id: notification.ID || notification.id || notification.Id || "",
  }));
}

function computeTotalPages(response, limit, currentPage, notificationCount) {
  const totalHeader = Number(response.headers.get("x-total-count"));
  if (!Number.isNaN(totalHeader) && totalHeader >= 0) {
    return Math.max(1, Math.ceil(totalHeader / limit));
  }

  if (notificationCount < limit) {
    return currentPage;
  }

  return currentPage + 1;
}

// Internal helper for fetching a single page of size <= 10
async function fetchSinglePage({ limit = 10, page = 1, notification_type = "All" } = {}) {
  const query = buildQuery({ limit, page, notification_type });
  const url = `${NOTIFICATIONS_URL}?${query}`;

  Log("frontend", "info", "api", `Fetching single page: page=${page} limit=${limit} filter=${notification_type}`);

  const headers = await createHeaders(false);
  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    const responseText = await response.text();
    Log(
      "frontend",
      "error",
      "api",
      `Failed to fetch single page: ${response.status} ${response.statusText} ${responseText}`,
    );
    throw new Error("Unable to load notifications from the server.");
  }

  const data = await response.json();
  const notifications = normalizeNotifications(data);
  return { notifications, response };
}

export async function fetchNotifications({ limit = 10, page = 1, notification_type = "All" } = {}) {
  // If requested limit is within backend limit, fetch standard single page
  if (limit <= 10) {
    const { notifications, response } = await fetchSinglePage({ limit, page, notification_type });
    const totalPages = computeTotalPages(response, Number(limit), Number(page), notifications.length);
    const total = Number(response.headers.get("x-total-count")) || notifications.length;

    Log(
      "frontend",
      "debug",
      "api",
      `Fetched ${notifications.length} notifications, totalPages=${totalPages}`,
    );

    return { notifications, total, totalPages };
  }

  // If requested limit is larger than backend's maximum allowed page size of 10,
  // we fetch multiple pages of size 10 in parallel.
  const pageSize = 10;
  const pagesToFetch = Math.ceil(limit / pageSize);
  const startPage = (page - 1) * pagesToFetch + 1;

  Log(
    "frontend",
    "info",
    "api",
    `Fetching multiple pages in parallel for limit=${limit}: startPage=${startPage} to ${startPage + pagesToFetch - 1}`,
  );

  const pagePromises = [];
  for (let i = 0; i < pagesToFetch; i++) {
    pagePromises.push(
      fetchSinglePage({ limit: pageSize, page: startPage + i, notification_type })
    );
  }

  const results = await Promise.all(pagePromises);
  const allNotifications = results.flatMap(r => r.notifications);
  
  const lastResponse = results[results.length - 1].response;
  const totalPages = Math.ceil(
    computeTotalPages(
      lastResponse,
      pageSize,
      startPage + pagesToFetch - 1,
      results[results.length - 1].notifications.length
    ) / pagesToFetch
  );
  const total = Number(lastResponse.headers.get("x-total-count")) || allNotifications.length;

  Log(
    "frontend",
    "debug",
    "api",
    `Fetched ${allNotifications.length} notifications in total, totalPages=${totalPages}`,
  );

  return { notifications: allNotifications.slice(0, limit), total, totalPages };
}
