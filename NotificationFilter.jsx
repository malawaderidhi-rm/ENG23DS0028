import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const filters = ["All", "Placement", "Result", "Event"];

export function NotificationFilter({ value = "All", onChange }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      sx={{ 
        flexWrap: "wrap", 
        gap: 1,
        border: "none",
        "& .MuiToggleButtonGroup-grouped": {
          border: "1px solid rgba(226, 232, 240, 0.8)",
          borderRadius: "20px !important",
          textTransform: "none",
          fontWeight: 600,
          color: "text.secondary",
          px: 2.5,
          py: 0.75,
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: "rgba(99, 102, 241, 0.05)",
            color: "primary.main",
            borderColor: "primary.light",
          },
          "&.Mui-selected": {
            backgroundColor: "primary.main",
            backgroundImage: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            color: "#ffffff",
            borderColor: "transparent",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
            "&:hover": {
              backgroundImage: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
              color: "#ffffff",
            }
          }
        }
      }}
      onChange={(_, newValue) => {
        if (newValue !== null) {
          onChange?.(newValue);
        }
      }}
    >
      {filters.map((type) => (
        <ToggleButton key={type} value={type}>
          {type}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
