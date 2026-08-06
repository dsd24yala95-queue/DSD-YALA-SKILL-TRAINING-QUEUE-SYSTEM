"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const handleRegistration = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("[PWA] Service Worker registered with scope:", registration.scope);

        // Handle update found
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content is available; show toast to refresh
              toast.info("🚀 มีอัปเดตระบบเวอร์ชันใหม่!", {
                description: "กดปุ่มด้านล่างเพื่อรีเฟรชและใช้งานเวอร์ชันล่าสุด",
                action: {
                  label: "อัปเดตเลย",
                  onClick: () => {
                    if (registration.waiting) {
                      registration.waiting.postMessage({ type: "SKIP_WAITING" });
                    }
                    window.location.reload();
                  },
                },
                duration: 10000,
              });
            }
          };
        };
      } catch (err) {
        console.error("[PWA] Service Worker registration failed:", err);
      }
    };

    window.addEventListener("load", handleRegistration);
    return () => window.removeEventListener("load", handleRegistration);
  }, []);

  return null;
}
