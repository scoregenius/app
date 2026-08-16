/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { registerRoute, setCatchHandler } from "workbox-routing";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkOnly,
} from "workbox-strategies";
import { enable as enableNavigationPreload } from "workbox-navigation-preload";

// --- Bypass the SW for third-party data hosts (no cache, no fallback) ---
const BYPASS_HOSTS = [
  "score-genius-backend.onrender.com",
  "supabase.co",
  "supabase.in",
];

registerRoute(
  // ensure we only bypass for *cross-origin* requests to those hosts
  ({ url }) =>
    url.origin !== self.location.origin &&
    BYPASS_HOSTS.some((h) => url.hostname.endsWith(h)),
  new NetworkOnly()
);
const SW_VERSION = "no-wsod-nav-v1";
const ASSET_CACHE = "assets-cache-v3";
const IMG_CACHE = "img-cache-v3";
const API_CACHE = "api-data-cache-v3";

// 1) never precache HTML (avoid stale shell)
const _WB = (self as any).__WB_MANIFEST as Array<{
  url: string;
  revision?: string;
}>;
const WB_NO_HTML = Array.isArray(_WB)
  ? _WB.filter((e) => !e.url.endsWith(".html"))
  : [];
precacheAndRoute(WB_NO_HTML);

cleanupOutdatedCaches();

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      try {
        enableNavigationPreload();
      } catch {}
      const keep = new Set([ASSET_CACHE, IMG_CACHE, API_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names.map((n) => {
          if (keep.has(n)) return; // keep our runtime caches
          if (n.startsWith("workbox-precache")) return; // keep WB precache (non-HTML only)
          return caches.delete(n);
        })
      );
      await self.clients.claim();
    })()
  );
});

/* 1) Navigations: never cache HTML; if it fails, catch handler runs */
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkOnly({
    fetchOptions: { cache: "reload" }, // force a truly fresh HTML fetch
  })
);

/* 2) Assets (unchanged) */
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    ["style", "script", "worker"].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: ASSET_CACHE })
);

registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin && request.destination === "image",
  new CacheFirst({ cacheName: IMG_CACHE })
);

/* 3) APIs: NEVER cache or fallback — avoids “offline” being triggered by data routes */
registerRoute(
  ({ url }) =>
    url.origin === self.location.origin && url.pathname.startsWith("/api/"),
  new NetworkOnly()
);

/* 4) Single offline catch for failed navigations only */
setCatchHandler(async ({ request }) => {
  if (request.mode === "navigate" || request.destination === "document") {
    return new Response(
      "<!doctype html><meta charset='utf-8'><title>Offline</title><h1>Offline</h1><p>This page requires an internet connection.</p>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
  return Response.error();
});

self.addEventListener("message", (e: ExtendableMessageEvent) => {
  if ((e.data as any)?.type === "SKIP_WAITING") self.skipWaiting();
});
