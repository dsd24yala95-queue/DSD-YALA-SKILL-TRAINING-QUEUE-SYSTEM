"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

interface NotificationItem {
    id: string;
    memberId: string;
    type: string;
    queueId: string;
    message: string;
    read: boolean;
    date: string;
}

export default function NotificationsMenu() {
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!profile?.uid) return;

        const fetchNotifications = async () => {
            try {
                const res = await fetch(`/api/notifications?userId=${profile.uid}&_t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 10000); // Poll every 10 seconds

        return () => clearInterval(intervalId);
    }, [profile?.uid]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = async (id: string, read: boolean) => {
        if (read) return;
        try {
            await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, read: true })
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error("Error marking notification as read", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        for (const id of unreadIds) {
            try {
                await fetch("/api/notifications", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, read: true })
                });
            } catch (error) {}
        }
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    if (!profile || profile.role === "admin") return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 hover:bg-white/30 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 transition-all duration-300 active:scale-95 border border-white/20"
                aria-label="Notifications"
            >
                <i className="fa-regular fa-bell text-gray-700 dark:text-gray-200"></i>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm animate-pulse"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50"
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <i className="fa-solid fa-bell text-indigo-500"></i>
                                การแจ้งเตือน
                                {unreadCount > 0 && (
                                    <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-0.5 rounded-full font-bold ml-1">
                                        {unreadCount} ใหม่
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                                >
                                    อ่านทั้งหมด
                                </button>
                            )}
                        </div>

                        <div className="max-h-[350px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                                        <i className="fa-regular fa-bell-slash text-xl"></i>
                                    </div>
                                    <p className="text-sm font-medium">ไม่มีการแจ้งเตือน</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleMarkAsRead(n.id, n.read)}
                                            className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                                                !n.read ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                                            }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                    n.type === "approved" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                                    n.type === "completed" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                    n.type === "failed" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                                                    n.type === "cancelled" ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" :
                                                    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                                                }`}>
                                                    <i className={`fa-solid ${
                                                        n.type === "approved" ? "fa-calendar-check" :
                                                        n.type === "completed" ? "fa-trophy" :
                                                        n.type === "failed" ? "fa-circle-xmark" :
                                                        "fa-bell"
                                                    } text-xs`}></i>
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${!n.read ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                                                        {n.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                        {new Date(n.date).toLocaleString("th-TH", {
                                                            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
