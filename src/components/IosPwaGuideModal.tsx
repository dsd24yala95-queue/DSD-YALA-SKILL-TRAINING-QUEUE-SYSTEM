"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Smart iOS PWA & LINE In-App Browser Guide Component
 *
 * Provides tailored installation instructions for Apple iOS users:
 * 1. LINE In-App Browser Detector: Instructs users to tap "Open in Safari".
 * 2. iOS Safari Add to Home Screen Guide: Shows a 2-step visual prompt for iOS Safari.
 */
export default function IosPwaGuideModal() {
    const [isIos, setIsIos] = useState(false);
    const [isLineApp, setIsLineApp] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [showLineAlert, setShowLineAlert] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
        const isAppleDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        const isLine = /Line/i.test(ua);
        const inStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;

        setIsIos(isAppleDevice);
        setIsLineApp(isLine);
        setIsStandalone(inStandaloneMode);

        // Show LINE In-App Browser alert if on iOS inside LINE
        if (isAppleDevice && isLine) {
            setShowLineAlert(true);
            return;
        }

        // Show iOS PWA installation guide if on iOS Safari, not standalone, and not dismissed within last 7 days
        if (isAppleDevice && !inStandaloneMode && !isLine) {
            const dismissedStr = localStorage.getItem("dsd_ios_pwa_guide_dismissed");
            let shouldShow = true;
            if (dismissedStr) {
                const dismissedDate = new Date(dismissedStr).getTime();
                const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                if (Date.now() - dismissedDate < sevenDaysMs) {
                    shouldShow = false;
                }
            }

            if (shouldShow) {
                // Delay showing by 2.5 seconds so user isn't immediately spammed
                const timer = setTimeout(() => setShowBanner(true), 2500);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const dismissGuide = () => {
        setShowBanner(false);
        localStorage.setItem("dsd_ios_pwa_guide_dismissed", new Date().toISOString());
    };

    if (isStandalone) return null;

    return (
        <>
            {/* 🚨 LINE In-App Browser Alert on iOS */}
            <AnimatePresence>
                {showLineAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-3.5 shadow-lg border-b border-amber-400"
                    >
                        <div className="max-w-md mx-auto flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                    <i className="fa-solid fa-triangle-exclamation text-white text-sm"></i>
                                </div>
                                <div>
                                    <p className="font-bold leading-tight">เปิดจากแอป LINE บน iPhone / iPad</p>
                                    <p className="text-[11px] text-amber-100 mt-0.5 leading-tight">
                                        กด <strong>••• (มุมขวาบน)</strong> ➔ เลือก <strong>"เปิดด้วย Safari"</strong> เพื่อติดตั้งแอปและรับแจ้งเตือน
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLineAlert(false)}
                                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs shrink-0"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 📱 iOS Safari Add to Home Screen Floating Guide */}
            <AnimatePresence>
                {showBanner && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed bottom-4 inset-x-4 max-w-sm mx-auto z-50 bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-3xl shadow-2xl border border-white/10"
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                    <i className="fa-brands fa-apple text-white text-xl"></i>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black tracking-tight">ติดตั้งแอป สพร.24 ยะลา</h4>
                                    <p className="text-[11px] text-slate-300">เพิ่มไว้หน้าโฮมเพื่อรับคิวและแจ้งเตือน</p>
                                </div>
                            </div>
                            <button
                                onClick={dismissGuide}
                                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all text-xs"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        {/* Step-by-Step Instructions */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5 mb-4 text-xs">
                            <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                                <p className="text-slate-200">
                                    กดปุ่ม <strong className="text-blue-400">แชร์ (Share)</strong> <i className="fa-solid fa-arrow-up-from-bracket text-blue-400 mx-1"></i> ที่แถบด้านล่าง Safari
                                </p>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                                <p className="text-slate-200">
                                    เลื่อนลงมาแล้วเลือก <strong className="text-indigo-300">"เพิ่มไปยังหน้าโฮม"</strong> <i className="fa-regular fa-square-plus text-indigo-300 mx-1"></i>
                                </p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={dismissGuide}
                                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                            >
                                รับทราบ / ปิดคำแนะนำ
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
