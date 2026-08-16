// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

// 1. Core app dependencies are imported statically as before.

// ─── React‑Query Client ──────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 120_000, retry: 1 },
  },
});

// ─── Service Worker Registration (Already Optimized) ─────────────────────────
if ("serviceWorker" in navigator && !import.meta.env.DEV) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "/app/app-sw.js",
        { scope: "/app/" }
      );

      // If there's already a waiting SW, tell it to activate immediately
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      // Listen for new SW installations and skip waiting as soon as they're installed
      registration.addEventListener("updatefound", () => {
        const newSW = registration.installing;
        if (newSW) {
          newSW.addEventListener("statechange", () => {
            if (newSW.state === "installed") {
              newSW.postMessage({ type: "SKIP_WAITING" });
            }
          });
        }
      });

      // Auto-reload the page when the new SW takes control
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    } catch (err) {
      console.error("⚠️ SW registration failed:", err);
    }
  });
}

// ─── Render App (Happens Immediately) ───────────────────────────────────────
const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/app">
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
