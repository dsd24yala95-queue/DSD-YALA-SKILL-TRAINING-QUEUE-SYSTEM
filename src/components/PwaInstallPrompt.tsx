"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PwaInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    // 1. Check if running in standalone mode (already installed & opened as PWA)
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (navigator as any).standalone === true;

    if (isStandalone) return;

    // 2. Check if user dismissed it recently (within 7 days)
    const dismissedTime = localStorage.getItem("pwa_install_prompt_dismissed");
    if (dismissedTime) {
      const now = new Date().getTime();
      const diff = now - parseInt(dismissedTime, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (diff < sevenDays) {
        return; // Still in cooldown
      }
    }

    // 3. Detect Platform
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua);

    if (isIos) {
      setPlatform("ios");
      // For iOS, show prompt automatically if not standalone
      // Delay showing to not startle the user immediately
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // 4. Android/Chrome Custom Prompt Interceptor
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform("android");
      
      // Delay prompt display slightly
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install user choice: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_install_prompt_dismissed", new Date().getTime().toString());
    setShowPrompt(false);
  };

  if (!mounted || !showPrompt || !platform) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[100] p-5 rounded-2xl bg-white/80 dark:bg-[#001a33]/85 border border-white/20 dark:border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.15)] backdrop-blur-2xl text-slate-800 dark:text-white"
      >
        <div className="flex items-start gap-4">
          {/* Logo icon inside banner */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] flex items-center justify-center shadow-md relative overflow-hidden shrink-0">
            <span className="text-white font-bold text-lg">สพร</span>
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-sm leading-tight text-[#0B3C74] dark:text-white mb-1">
              ติดตั้งแอป DSD YALA
            </h3>
            
            {platform === "android" ? (
              <p className="text-xs text-slate-600 dark:text-blue-200/80 leading-normal">
                เพื่อการจองคิวออนไลน์ที่สะดวกรวดเร็ว ติดตามข่าวสารได้ทันที และรองรับระบบแจ้งเตือนคิวจอง
              </p>
            ) : (
              <p className="text-xs text-slate-600 dark:text-blue-200/80 leading-normal">
                ติดตั้งง่ายๆ บนหน้าจอโฮม: กดปุ่ม <i className="fa-solid fa-share-nodes text-blue-500 mx-1"></i> (ปุ่มแชร์) ด้านล่าง แล้วเลือก <span className="font-bold text-[#2563EB] dark:text-[#60A5FA]">“เพิ่มไปยังหน้าจอโฮม” (Add to Home Screen)</span> <i className="fa-regular fa-square-plus text-blue-500 mx-1"></i>
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={handleDismiss}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            ภายหลัง
          </button>
          
          {platform === "android" ? (
            <button
              onClick={handleInstallAndroid}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0B3C74] dark:bg-[#2563EB] text-white hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all"
            >
              ติดตั้งแอป
            </button>
          ) : (
            <button
              onClick={handleDismiss}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0B3C74] dark:bg-[#2563EB] text-white active:scale-95 transition-all"
            >
              รับทราบ
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
