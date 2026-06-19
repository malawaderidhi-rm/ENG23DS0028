import { useState } from "react";
import { AppBar, Box, Container, CssBaseline, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import { NotificationsPage } from "./pages/NotificationsPage";
import { PriorityInboxPage } from "./pages/PriorityInboxPage";

export default function App() {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)", pb: 6 }}>
      <CssBaseline />
      <AppBar 
        position="sticky" 
        sx={{ 
          background: "rgba(255, 255, 255, 0.8)", 
          backdropFilter: "blur(16px)", 
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)", 
          color: "text.primary",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.02)"
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", maxWidth: 932, width: "100%", mx: "auto" }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 800, 
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", 
              WebkitBackgroundClip: "text", 
              WebkitTextFillColor: "transparent",
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            🎓 Campus Hub
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box 
          sx={{ 
            bgcolor: "rgba(255, 255, 255, 0.8)", 
            backdropFilter: "blur(12px)", 
            borderRadius: 4, 
            p: 0.5, 
            border: "1px solid rgba(226, 232, 240, 0.8)", 
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
            overflow: "hidden" 
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={(_, newValue) => setTabIndex(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{
              "& .MuiTabs-flexContainer": {
                gap: 1,
              }
            }}
          >
            <Tab label="All Notifications" />
            <Tab label="Priority Inbox" />
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>
          {tabIndex === 0 && <NotificationsPage />}
          {tabIndex === 1 && <PriorityInboxPage />}
        </Box>
      </Container>
    </Box>
  );
}
