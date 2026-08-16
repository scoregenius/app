import React, { createContext, useContext, useEffect, useState } from "react";

const OnlineCtx = createContext<boolean>(true);
export const useOnline = () => useContext(OnlineCtx);

/**
 * Optimistic, event-only online detection.
 * - Starts TRUE (so we don't soft-block rendering on desktop PWA)
 * - Flips only when the browser actually emits online/offline events
 * - No health pings, no timers, no startup reads of navigator.onLine
 */
export const OnlineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [online, setOnline] = useState<boolean>(true); // <- optimistic start

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // If you really want to reconcile once after mount without forcing false:
    // if (navigator.onLine) setOnline(true);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return <OnlineCtx.Provider value={online}>{children}</OnlineCtx.Provider>;
};
