// frontend/src/api/client.ts

const API = "";
// Empty by design: the PWA and the Express API share an origin, so every
// request goes out on a relative /api/v1/... path. Set this only if the API is
// ever split onto its own host.

export async function apiFetch(path: string, init: RequestInit = {}) {
  // Allow callers to pass an absolute URL (handy for Supabase signed URLs etc.)
  const url = /^https?:\/\//.test(path) ? path : `/${path.replace(/^\/+/, "")}`;

  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      accept: "application/json",
      ...(init.headers || {}),
    },
  });

  return res;
}
