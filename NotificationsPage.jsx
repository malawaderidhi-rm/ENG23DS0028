import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";
import { markNotificationsViewed, getViewedNotificationIds } from "../utils/notificationStorage";
import { Log } from "../logger";

export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [viewedIds, setViewedIds] = useState(getViewedNotificationIds);

  const { notifications, totalPages, loading, error } = useNotifications({
    filter,
    page,
    limit: 10,
  });

  useEffect(() => {
    const ids = notifications.filter(Boolean).map((notification) => notification.id).filter(Boolean);
    if (ids.length === 0) {
      return;
    }

    const updatedIds = markNotificationsViewed(ids);
    setViewedIds(updatedIds);
  }, [notifications]);

  const enrichedNotifications = useMemo(
    () =>
      notifications.map((notification) => {
        const id = notification.id;
        const apiRead = notification.isRead ?? notification.read ?? false;
        return {
          ...notification,
          isRead: Boolean(apiRead || (id && viewedIds.includes(id))),
        };
      }),
    [notifications, viewedIds],
  );

  const unreadCount = enrichedNotifications.filter((notification) => !notification.isRead).length;

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter || "All");
    setPage(1);
    Log("frontend", "info", "page", `Notifications filter changed to ${newFilter}`);
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
    Log("frontend", "debug", "page", `Notifications page changed to ${newPage}`);
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={2} mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Badge 
            badgeContent={unreadCount} 
            color="secondary" 
            max={99}
            sx={{
              "& .MuiBadge-badge": {
                fontWeight: 800,
                fontSize: "0.75rem",
                height: 20,
                minWidth: 20,
                borderRadius: 10,
                border: "2px solid #ffffff",
                boxShadow: "0 2px 8px rgba(244, 63, 94, 0.3)"
              }
            }}
          >
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                width: 44, 
                height: 44, 
                borderRadius: 3, 
                backgroundColor: "rgba(99, 102, 241, 0.08)",
                color: "primary.main"
              }}
            >
              <NotificationsIcon sx={{ fontSize: 24 }} />
            </Box>
          </Badge>
          <Box>
            <Typography variant="h5" component="h1">
              All Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time feed of events, results, and placements
            </Typography>
          </Box>
        </Stack>
        <Button variant="contained" color="primary" onClick={() => setPage(1)}>
          Refresh list
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 3.5 }}>
        <NotificationFilter value={filter} onChange={handleFilterChange} />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={36} thickness={4.5} />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          Failed to load notifications: {error}
        </Alert>
      )}

      {!loading && !error && enrichedNotifications.length === 0 && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
          No notifications available for this filter.
        </Alert>
      )}

      {!loading && !error && enrichedNotifications.length > 0 && (
        <Stack spacing={2}>
          {enrichedNotifications.map((notification) => (
            <NotificationCard key={notification.id || notification.Timestamp || notification.Message} notification={notification} />
          ))}
        </Stack>
      )}

      {!loading && !error && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={5}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            sx={{
              "& .MuiPaginationItem-root": {
                fontWeight: 600,
                borderRadius: 2,
                "&.Mui-selected": {
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  "&:hover": {
                    background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                  }
                }
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
}
