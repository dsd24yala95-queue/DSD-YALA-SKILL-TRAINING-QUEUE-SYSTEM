"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Set initial status
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm px-4"
        >
          <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-xl text-red-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/30 flex items-center justify-center animate-pulse">
                <i className="fa-solid fa-wifi-slash text-red-300"></i>
              </div>
              <div>
                <p className="text-sm font-bold">โหมดออฟไลน์</p>
                <p className="text-xs text-red-300/80">กำลังแสดงข้อมูลจากประวัติล่าสุด</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-bold text-red-300 hover:text-white bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20"
            >
              รีเฟรช
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
