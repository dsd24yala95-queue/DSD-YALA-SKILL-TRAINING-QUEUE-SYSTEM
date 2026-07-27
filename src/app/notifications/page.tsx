"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: string;
    metadata?: string;
    read: boolean;
    createdAt: string;
}

// Build Google Calendar add event URL
function buildGoogleCalendarUrl(opts: {
    title: string;
    startDate: string;
    location?: string;
    description?: string;
}): string {
    const start = new Date(opts.startDate);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours default
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: opts.title,
        dates: `${fmt(start)}/${fmt(end)}`,
        location: opts.location || "",
        details: opts.description || "",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function NotificationsPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [calendarLoading, setCalendarLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const fetchNotifications = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/notifications?userId=${user.id}&_t=${Date.now()}`);
            const data = await res.json();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
        }
    }, [user?.id]);

    const handleMarkAsRead = async (id: string, currentRead: boolean) => {
        if (currentRead) return;
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

    const handleAddToCalendar = async (notif: AppNotification) => {
        setCalendarLoading(notif.id);
        try {
            let meta: any = {};
            if (notif.metadata) { try { meta = JSON.parse(notif.metadata); } catch (e) {} }

            const url = buildGoogleCalendarUrl({
                title: meta.itemName || notif.title,
                startDate: meta.appointedDate,
                location: meta.location || "สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา",
                description: `นัดหมายจากระบบ สพร.24 ยะลา | ประเภท: ${meta.bookingType === "test" ? "ทดสอบมาตรฐาน" : "ฝึกอบรม"}`,
            });

            // Mark as read
            await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: notif.id, read: true })
            });

            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
            window.open(url, "_blank");
            toast.success("เปิด Google Calendar เรียบร้อย! กรุณากด Save ใน Calendar ครับ");
        } catch (e) {
            toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setCalendarLoading(null);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <span className="loading loading-spinner loading-lg text-blue-500"></span>
            </div>
        );
    }

    if (!user) return null;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            <Navbar />
            
            <div className="pt-24 px-4 max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <i className="fa-solid fa-bell text-blue-500"></i>
                            การแจ้งเตือน
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">อัปเดตสถานะคิวและการนัดหมาย</p>
                    </div>
                    {unreadCount > 0 && (
                        <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            {unreadCount} รายการใหม่
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center">
                        <span className="loading loading-spinner loading-lg text-blue-500"></span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fa-regular fa-bell-slash text-2xl text-slate-300"></i>
                        </div>
                        <p className="font-semibold text-sm">ไม่มีการแจ้งเตือน</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {notifications.map((notif, index) => {
                                let meta: any = {};
                                if (notif.metadata) { try { meta = JSON.parse(notif.metadata); } catch (e) {} }
                                const isUnread = !notif.read;
                                const isAppointment = notif.type === "appointment";

                                return (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleMarkAsRead(notif.id, notif.read)}
                                        className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                                            isUnread 
                                                ? isAppointment 
                                                    ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-md shadow-blue-500/5" 
                                                    : "bg-white border-blue-100 shadow-sm"
                                                : "bg-white border-slate-100 opacity-75"
                                        }`}
                                    >
                                        <div className="flex gap-4">
                                            {/* Icon */}
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                                isAppointment 
                                                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20" 
                                                    : isUnread ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                                            }`}>
                                                <i className={`fa-solid ${isAppointment ? 'fa-calendar-check' : 'fa-bell'} text-lg`}></i>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <h3 className={`font-bold text-sm ${isUnread ? 'text-slate-800' : 'text-slate-600'}`}>
                                                        {notif.title}
                                                    </h3>
                                                    <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                                                        {new Date(notif.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                                
                                                <p className={`text-xs leading-relaxed ${isUnread ? 'text-slate-600' : 'text-slate-500'}`}>
                                                    {notif.message}
                                                </p>

                                                {/* Appointment Extras */}
                                                {isAppointment && (
                                                    <div className="mt-4 pt-4 border-t border-blue-200/50">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAddToCalendar(notif); }}
                                                            disabled={calendarLoading === notif.id || !meta.appointedDate}
                                                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                                                        >
                                                            {calendarLoading === notif.id ? (
                                                                <span className="loading loading-spinner loading-xs"></span>
                                                            ) : (
                                                                <i className="fa-brands fa-google"></i>
                                                            )}
                                                            รับนัดหมาย &amp; บันทึก Google Calendar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
