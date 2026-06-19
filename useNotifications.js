import { useState, useEffect } from "react";
import { fetchNotifications } from "../api/notifications";
import { Log } from "../logger";

export function useNotifications({ filter = "All", page = 1, limit = 10 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let canceled = false;

    async function loadNotifications() {
      setLoading(true);
      setError(null);

      Log("frontend", "debug", "hook", `Loading notifications filter=${filter} page=${page}`);

      try {
        const result = await fetchNotifications({
          limit,
          page,
          notification_type: filter,
        });

        if (canceled) {
          return;
        }

        setNotifications(result.notifications);
        setTotal(result.total);
        setTotalPages(result.totalPages);

        if (result.notifications.length === 0) {
          Log("frontend", "warn", "hook", "No notifications found for current filter/page.");
        }
      } catch (loadError) {
        if (canceled) {
          return;
        }

        setError(loadError.message || "An unexpected error occurred.");
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      canceled = true;
    };
  }, [filter, page, limit]);

  return { notifications, total, totalPages, loading, error };
}

