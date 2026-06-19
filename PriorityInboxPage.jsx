import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { NotificationCard } from "../components/NotificationCard";
import { useNotifications } from "../hooks/useNotifications";
import { Log } from "../logger";

const priorityWeights = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function computeScore(notification) {
  const type = notification.Type || notification.type || "Event";
  const weight = priorityWeights[type] || 1;
  const timestamp = notification.Timestamp || notification.timestamp || notification.createdAt || "";
  const timeValue = timestamp ? new Date(timestamp).getTime() : 0;
  return weight * 1000 + Math.floor(timeValue / 1000000);
}

export function PriorityInboxPage() {
  const [filter, setFilter] = useState("All");
  const [limit, setLimit] = useState(10);

  const { notifications, loading, error } = useNotifications({
    filter,
    page: 1,
    limit: 100,
  });

  const unreadNotifications = useMemo(
    () =>
      notifications
        .filter((notification) => {
          const isRead = notification.isRead ?? notification.read ?? false;
          return !isRead;
        })
        .map((notification) => ({
          ...notification,
          priorityScore: computeScore(notification),
        }))
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, limit),
    [notifications, limit],
  );

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    Log("frontend", "info", "page", `Priority inbox filter changed to ${event.target.value}`);
  };

  const handleLimitChange = (event) => {
    setLimit(Number(event.target.value));
    Log("frontend", "debug", "page", `Priority inbox limit changed to ${event.target.value}`);
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={2} mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              width: 44, 
              height: 44, 
              borderRadius: 3, 
              backgroundColor: "rgba(244, 63, 94, 0.08)",
              color: "secondary.main"
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" component="h1">
              Priority Inbox
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Intelligently ranked unread notifications
            </Typography>
          </Box>
        </Stack>
        
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="priority-type-select-label">Type</InputLabel>
            <Select 
              labelId="priority-type-select-label"
              value={filter} 
              label="Type" 
              onChange={handleFilterChange}
              sx={{
                borderRadius: 3,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(226, 232, 240, 0.8)",
                }
              }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Placement">Placement</MenuItem>
              <MenuItem value="Result">Result</MenuItem>
              <MenuItem value="Event">Event</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="priority-limit-select-label">Top N</InputLabel>
            <Select 
              labelId="priority-limit-select-label"
              value={String(limit)} 
              label="Top N" 
              onChange={handleLimitChange}
              sx={{
                borderRadius: 3,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(226, 232, 240, 0.8)",
                }
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={15}>15</MenuItem>
              <MenuItem value={20}>20</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Card 
        variant="outlined" 
        sx={{ 
          mb: 3.5, 
          borderRadius: 4, 
          borderColor: "rgba(99, 102, 241, 0.15)",
          backgroundColor: "rgba(99, 102, 241, 0.02)"
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <AutoAwesomeIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 550, color: "primary.dark" }}>
              Ordering logic: orders unread items weighting Placement highest (x3), then Result (x2) and Event (x1), boosted by recency.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <Typography sx={{ fontWeight: 500, color: "text.secondary" }}>
            Loading priority notifications...
          </Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>Failed to load priority notifications: {error}</Alert>
      )}

      {!loading && !error && unreadNotifications.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 3 }}>No unread priority notifications are available.</Alert>
      )}

      {!loading && !error && unreadNotifications.length > 0 && (
        <Stack spacing={2}>
          {unreadNotifications.map((notification) => (
            <NotificationCard key={notification.id || notification.Timestamp || notification.Message} notification={notification} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
