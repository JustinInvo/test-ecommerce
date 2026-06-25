"use client";

import { useEffect, useState } from "react";
import styles from "./OfflineBanner.module.css";

/**
 * Friendly online/offline banner.
 *
 *  - Listens to native `online`/`offline` events; cheap, no polling.
 *  - Initial value is taken from `navigator.onLine` *after mount* so SSR/CSR
 *    agree (server has no navigator).
 *  - When back online, briefly announces recovery, then auto-dismisses.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      setReconnected(true);
      setTimeout(() => setReconnected(false), 2500);
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online && !reconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={styles.root}
      data-tone={online ? "ok" : "warn"}
    >
      <span className={styles.dot} aria-hidden />
      <span>
        {online
          ? "You’re back online."
          : "You appear to be offline. Some content may be unavailable."}
      </span>
    </div>
  );
}
