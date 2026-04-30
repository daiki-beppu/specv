import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ThemeProvider } from "@/hooks/use-theme";

import { App } from "./app";

import "./index.css";

const root = document.querySelector("#root");
if (root !== null) {
  createRoot(root).render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>
  );
}
