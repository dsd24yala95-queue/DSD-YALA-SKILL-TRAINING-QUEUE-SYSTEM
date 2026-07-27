"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface ActiveCall {
    id: string;
    queueNumber: number | string;
    itemName: string;
    callCount: number;
    calledAt: string;
}

// Generate a "ding" bell sound using Web Audio API — no file needed
function playDing() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        o1.connect(g1);
        g1.connect(ctx.destination);
        o1.type = "sine";
        o1.frequency.setValueAtTime(880, ctx.currentTime);
        o1.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.4);
        g1.gain.setValueAtTime(0.9, ctx.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
        o1.start(ctx.currentTime);
        o1.stop(ctx.currentTime + 1.0);

        // Second ding slightly after
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2);
        g2.connect(ctx.destination);
        o2.type = "sine";
        o2.frequency.setValueAtTime(1100, ctx.currentTime + 0.3);
        o2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.8);
        g2.gain.setValueAtTime(0.6, ctx.currentTime + 0.3);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
        o2.start(ctx.currentTime + 0.3);
        o2.stop(ctx.currentTime + 1.1);
    } catch (e) {
        console.warn("Audio not available", e);
    }
}

export default function QueueAlertModal() {
    const { user, profile } = useAuth();
    const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
    const [acknowledging, setAcknowledging] = useState(false);
    const soundIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const prevCallIdRef = useRef<string | null>(null);

    const stopSounds = useCallback(() => {
        if (soundIntervalRef.current) {
            clearInterval(soundIntervalRef.current);
            soundIntervalRef.current = null;
        }
    }, []);

    const startSounds = useCallback(() => {
        stopSounds();
        // Play immediately then every 4.5 seconds
        playDing();
        if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
        soundIntervalRef.current = setInterval(() => {
            playDing();
            if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
        }, 4500);
    }, [stopSounds]);

    const pollActiveCall = useCallback(async () => {
        const userId = profile?.uid || user?.id;
        if (!userId || profile?.role === "admin") return;

        try {
            const res = await fetch(`/api/notifications/active-call?userId=${userId}&_t=${Date.now()}`);
            const data = await res.json();

            if (data.call) {
                // If it's a new call (different id) or same call but callCount increased → re-trigger sounds
                const isNew = prevCallIdRef.current !== data.call.id;
                const prevCount = activeCall?.callCount ?? 0;
                const countIncreased = data.call.callCount > prevCount;

                if (isNew || countIncreased) {
                    startSounds();
                    prevCallIdRef.current = data.call.id;
                }
                setActiveCall(data.call);
            } else {
                if (activeCall) {
                    setActiveCall(null);
                    stopSounds();
                    prevCallIdRef.current = null;
                }
            }
        } catch (e) {
            // silently ignore polling errors
        }
    }, [profile, user, activeCall, startSounds, stopSounds]);

    useEffect(() => {
        const userId = profile?.uid || user?.id;
        if (!userId || profile?.role === "admin") return;

        pollingRef.current = setInterval(pollActiveCall, 3000);
        pollActiveCall(); // immediate first check

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
            stopSounds();
        };
    }, [profile?.uid, user?.id, profile?.role]);

    const handleAcknowledge = async () => {
        if (!activeCall || acknowledging) return;
        setAcknowledging(true);
        stopSounds();

        try {
            await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: activeCall.id, read: true })
            });
        } catch (e) {}

        setActiveCall(null);
        prevCallIdRef.current = null;
        setAcknowledging(false);
    };

    if (!activeCall) return null;

    const isRepeat = activeCall.callCount > 1;
    // Format queue number to look like "A-015"
    const queueDisplay = activeCall.queueNumber
        ? `A-${String(activeCall.queueNumber).padStart(3, "0")}`
        : "---";

    return (
        <AnimatePresence>
            <motion.div
                key="queue-alert-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
                style={{
                    backdropFilter: "blur(20px)",
                    background: "rgba(0,0,0,0.82)"
                }}
            >
                {/* Animated red pulsing background rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 2.5], opacity: [0.15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute w-64 h-64 rounded-full bg-red-500"
                    />
                    <motion.div
                        animate={{ scale: [1, 2.5], opacity: [0.12, 0] }}
                        transition={{ duration: 2, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
                        className="absolute w-64 h-64 rounded-full bg-red-500"
                    />
                    <motion.div
                        animate={{ scale: [1, 2.5], opacity: [0.08, 0] }}
                        transition={{ duration: 2, delay: 1.2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute w-64 h-64 rounded-full bg-red-500"
                    />
                </div>

                {/* Main Card */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 40 }}
                    animate={{ scale: [1, 1.02, 1], opacity: 1, y: 0 }}
                    transition={{
                        scale: { duration: 1.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
                        opacity: { duration: 0.4 },
                        y: { duration: 0.4 }
                    }}
                    className="relative w-[92vw] max-w-[600px] flex flex-col items-center text-center px-8 py-10 sm:px-14 sm:py-14"
                    style={{
                        background: "rgba(255,255,255,0.10)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        borderRadius: "40px",
                        boxShadow: "0 0 80px rgba(239,68,68,0.3), 0 30px 80px rgba(0,0,0,0.5)"
                    }}
                >
                    {/* Repeat Badge */}
                    {isRepeat && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-5 right-5 bg-red-500 text-white text-[13px] font-extrabold px-4 py-1.5 rounded-full shadow-lg"
                        >
                            เรียกครั้งที่ {activeCall.callCount}
                        </motion.div>
                    )}

                    {/* Bell Icon */}
                    <motion.div
                        animate={{ rotate: [-18, 18, -14, 14, -8, 8, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
                        className="text-6xl sm:text-7xl mb-5 select-none"
                        style={{ filter: "drop-shadow(0 0 20px rgba(239,68,68,0.9))" }}
                    >
                        🔔
                    </motion.div>

                    {/* Main Title */}
                    <motion.h1
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="font-extrabold text-white leading-tight mb-2 select-none"
                        style={{ fontSize: "clamp(32px,7vw,56px)", fontWeight: 800 }}
                    >
                        ถึงคิวของท่านแล้ว
                    </motion.h1>
                    <p className="text-white/70 mb-8 select-none" style={{ fontSize: "clamp(18px,3.5vw,28px)" }}>
                        กรุณาติดต่อเจ้าหน้าที่
                    </p>

                    {/* Queue Number */}
                    <div
                        className="mb-8 px-10 py-5 rounded-2xl select-none"
                        style={{
                            background: "rgba(0,0,0,0.35)",
                            border: "1px solid rgba(255,255,255,0.15)"
                        }}
                    >
                        <motion.p
                            animate={{ opacity: [1, 0.75, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                            className="font-black text-white tracking-widest select-none"
                            style={{
                                fontSize: "clamp(64px,15vw,120px)",
                                fontWeight: 900,
                                lineHeight: 1,
                                textShadow: "0 0 20px #ef4444, 0 0 40px #ef4444, 0 0 70px #ef4444"
                            }}
                        >
                            {queueDisplay}
                        </motion.p>
                    </div>

                    {/* Service / Item name */}
                    <p className="text-white/60 text-sm sm:text-base mb-3 select-none px-4">
                        {activeCall.itemName}
                    </p>

                    {/* Service Counter */}
                    <motion.div
                        animate={{ opacity: [1, 0.6, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="mb-10 select-none"
                        style={{ fontSize: "clamp(22px,5vw,40px)", fontWeight: 800, color: "#facc15" }}
                    >
                        <i className="fa-solid fa-location-dot mr-2"></i>
                        กรุณาไปที่จุดให้บริการ
                    </motion.div>

                    {/* Acknowledge Button */}
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleAcknowledge}
                        disabled={acknowledging}
                        className="flex items-center justify-center gap-3 rounded-2xl font-bold text-white transition-colors select-none disabled:opacity-70"
                        style={{
                            width: "clamp(200px,80%,320px)",
                            height: "clamp(60px,12vw,80px)",
                            fontSize: "clamp(20px,4vw,30px)",
                            background: acknowledging ? "#dc2626" : "#ef4444",
                            boxShadow: "0 20px 60px rgba(255,0,0,0.4)"
                        }}
                    >
                        {acknowledging ? (
                            <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                            <>
                                <i className="fa-solid fa-check"></i>
                                รับทราบ
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
