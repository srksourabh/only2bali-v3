"use client";

import { useEffect } from "react";

/** Registers the offline voucher shell service worker once per session. */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* non-fatal — PWA is progressive */
    });
  }, []);
  return null;
}
