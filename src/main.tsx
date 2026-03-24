import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./hooks/useTheme";
import { SettingsProvider } from "./hooks/useSettings";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </SettingsProvider>
  </React.StrictMode>,
);
