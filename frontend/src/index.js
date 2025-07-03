import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { CssBaseline } from "@mui/material";

import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: ["Inter", "Roboto", "Arial", "sans-serif"].join(","),
  },
  palette: {
    primary: { main: "#102B4E" },
    secondary: { main: "#1F4A7C" },
    accent: { main: "#F4A261" },
    success: { main: "#2E7D32" },
    error: { main: "#D32F2F" },
    warning: { main: "#E09F3E" },
    info: { main: "#0288D1" },
    background: { default: "#F8F9FB" },
    card: { main: "#FFFFFF" },
    border: { main: "#D3D6DB" },
    status: {
      open: "#D32F2F",
      assigned: "#2563EB",
    },
    priority: {
      critical: "#D32F2F",
      high: "#FF9800",
      medium: "#FBC02D",
      low: "#4CAF50",
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
