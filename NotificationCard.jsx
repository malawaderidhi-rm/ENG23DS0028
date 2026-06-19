import { Card, CardContent, Chip, Stack, Typography, Box } from "@mui/material";

const typeStyles = {
  Placement: {
    color: "#059669", // Emerald-600
    bgColor: "#ecfdf5", // Emerald-50
    borderColor: "#a7f3d0",
    icon: "💼",
  },
  Result: {
    color: "#2563eb", // Blue-600
    bgColor: "#eff6ff", // Blue-50
    borderColor: "#bfdbfe",
    icon: "📝",
  },
  Event: {
    color: "#d97706", // Amber-600
    bgColor: "#fffbeb", // Amber-50
    borderColor: "#fde68a",
    icon: "🎉",
  },
};

export function NotificationCard({ notification }) {
  const isRead = Boolean(
    notification.isRead ?? notification.read ?? notification.Read ?? false,
  );
  const type = notification.Type || notification.type || "Event";
  const timestamp = notification.Timestamp || notification.timestamp || notification.createdAt || "";
  const createdAt = timestamp ? new Date(timestamp) : null;
  const formattedDate = createdAt
    ? createdAt.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown date";

  const styles = typeStyles[type] || {
    color: "#64748b",
    bgColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    icon: "🔔",
  };

  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        borderRadius: 4,
        borderColor: isRead ? "divider" : "primary.light",
        borderWidth: isRead ? 1 : 1.5,
        backgroundColor: isRead ? "#ffffff" : "rgba(99, 102, 241, 0.02)",
        boxShadow: isRead 
          ? "0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 1px 2px -1px rgba(0, 0, 0, 0.02)"
          : "0 4px 20px -2px rgba(99, 102, 241, 0.08)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 24px -4px rgba(0, 0, 0, 0.06), 0 4px 12px -2px rgba(0, 0, 0, 0.02)",
          borderColor: isRead ? "primary.light" : "primary.main",
        },
        overflow: "hidden",
        pl: isRead ? 0 : 0.5
      }}
    >
      {/* Decorative vertical bar on the left edge for unread items */}
      {!isRead && (
        <Box 
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: `linear-gradient(to bottom, ${styles.color}, #818cf8)`,
          }}
        />
      )}
      
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={2}>
          <Stack spacing={1.5} sx={{ width: "100%" }}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Chip
                label={`${styles.icon} ${type}`}
                size="small"
                sx={{
                  color: styles.color,
                  backgroundColor: styles.bgColor,
                  border: `1px solid ${styles.borderColor}`,
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  "& .MuiChip-label": { px: 1 }
                }}
              />
              {!isRead && (
                <Chip 
                  label="NEW" 
                  size="small" 
                  sx={{
                    background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.65rem",
                    letterSpacing: "0.05em",
                    height: 20,
                    "& .MuiChip-label": { px: 1 }
                  }}
                />
              )}
            </Stack>
            <Typography variant="body1" sx={{ fontWeight: 650, color: "text.primary" }}>
              {notification.Message || notification.message || "No message provided."}
            </Typography>
          </Stack>
          <Box sx={{ minWidth: 120, textAlign: { xs: "left", sm: "right" } }}>
            <Typography variant="caption" sx={{ fontWeight: 500, color: "text.secondary" }}>
              {formattedDate}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
