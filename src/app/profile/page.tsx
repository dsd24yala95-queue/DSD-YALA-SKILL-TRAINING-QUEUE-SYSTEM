"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserQueues, QueueItem } from "@/lib/services/db-service";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { parseProfileJson } from "@/lib/jsonEngine";
import { toast } from "sonner";

const educationLevels: { [key: string]: string } = {
    "00": "ต่ำกว่าประถมศึกษา",
    "01": "ประถมศึกษา",
    "02": "มัธยมศึกษาตอนต้น (ม.3)",
    "03": "มัธยมศึกษาตอนปลาย (ม.6)",
    "04": "ปวช.",
    "05": "ปวส. / อนุปริญญา",
    "06": "ปริญญาตรี",
    "07": "สูงกว่าปริญญาตรี",
};

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
    // End time = start + 2 hours default
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
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

export default function ProfilePage() {
    const { user, profile, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [queues, setQueues] = useState<QueueItem[]>([]);
    const [queuesLoading, setQueuesLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"info" | "history">("info");
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [notiLoading, setNotiLoading] = useState(false);
    const [calendarLoading, setCalendarLoading] = useState<string | null>(null);
    const [clearingCache, setClearingCache] = useState(false);

    const handleClearPwaCache = async () => {
        setClearingCache(true);
        try {
            // 1. Unregister active Service Workers
            if (typeof window !== "undefined" && "serviceWorker" in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }

            // 2. Clear all PWA CacheStorage caches
            if (typeof window !== "undefined" && "caches" in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map((key) => caches.delete(key)));
            }

            // 3. Clear Session Storage
            if (typeof window !== "undefined" && window.sessionStorage) {
                window.sessionStorage.clear();
            }

            toast.success("ล้างแคชและอัปเดตระบบ PWA เรียบร้อยแล้ว! กำลังโหลดเวอร์ชันใหม่...");
            setTimeout(() => {
                window.location.reload();
            }, 1200);
        } catch (err) {
            console.error("Clear PWA cache error:", err);
            toast.error("เกิดข้อผิดพลาดในการล้างแคช กรุณาลองใหม่อีกครั้ง");
        } finally {
            setClearingCache(false);
        }
    };

    // Auto-redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    // Fetch user queues
    useEffect(() => {
        async function fetchQueues() {
            if (profile?.uid) {
                try {
                    const data = await getUserQueues(profile.uid);
                    // Sort by createdAt descending
                    data.sort((a, b) => {
                        const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                        const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
                        return dateB - dateA;
                    });
                    setQueues(data);
                } catch (error) {
                    console.error("Error fetching queues:", error);
                    toast.error("ไม่สามารถดึงข้อมูลประวัติการจองคิวได้");
                } finally {
                    setQueuesLoading(false);
                }
            } else if (!authLoading && !profile?.uid) {
                setQueuesLoading(false);
            }
        }

        if (profile?.uid) {
            fetchQueues();
        }
    }, [profile?.uid, authLoading]);

    // Fetch notifications when switching to history tab
    useEffect(() => {
        if (activeTab === "history" && user?.id) {
            setNotiLoading(true);
            fetch(`/api/notifications?userId=${user.id}`)
                .then(res => res.json())
                .then(data => setNotifications(Array.isArray(data) ? data : []))
                .catch(() => {})
                .finally(() => setNotiLoading(false));
        }
    }, [activeTab, user?.id]);

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

            // Update QueueBooking status to 'confirmed' and isAcknowledged to true
            if (meta.queueId) {
                await fetch("/api/bookings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        id: meta.queueId, 
                        status: "confirmed",
                        isAcknowledged: true 
                    })
                });
            }

            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
            window.open(url, "_blank");
            toast.success("ยืนยันนัดหมายและเปิดปฏิทินเรียบร้อย!");
        } catch (e) {
            toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setCalendarLoading(null);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#001a33] to-[#002244]">
                <div className="flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg text-blue-500"></span>
                    <p className="text-blue-200/50 text-sm font-sans">กำลังโหลดข้อมูลโปรไฟล์...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const pData: any = profile || {};

    // Parse nested profileJson if available
    let detail: any = {};
    if (pData.profileJson) {
        detail = parseProfileJson(pData.profileJson, { createdAt: pData.createdAt });
    }

    const titleTH = pData.titleTH || (detail.reg_title === "001" ? "นาย" : detail.reg_title === "002" ? "นาง" : detail.reg_title === "003" ? "นางสาว" : "-");
    const firstName = detail.reg_firstname || pData.fullName?.split(" ")[0] || "-";
    const lastName = detail.reg_lastname || pData.fullName?.split(" ")[1] || "";
    const phone = detail.reg_telephone || pData.phoneNumber || "-";
    const idCard = detail.reg_citizenid || pData.idCard || "-";
    const birthDate = detail.reg_birth || pData.birthDate || "-";
    const rawEdu = detail.reg_education || pData.education || "";
    const education = educationLevels[rawEdu] || rawEdu || "-";

    // Format address string
    const addressString = pData.address
        ? [
            pData.address ? `เลขที่ ${pData.address}` : "",
            pData.moo ? `หมู่ ${pData.moo}` : "",
            pData.subDistrict ? `ต. ${pData.subDistrict}` : "",
            pData.district ? `อ. ${pData.district}` : "",
            pData.province ? `จ. ${pData.province === "95" ? "ยะลา" : pData.province === "94" ? "ปัตตานี" : pData.province === "96" ? "นราธิวาส" : pData.province === "90" ? "สงขลา" : pData.province}` : "",
            pData.postalCode ? pData.postalCode : ""
        ].filter(Boolean).join(" ")
        : [
            detail.reg_address_no ? `เลขที่ ${detail.reg_address_no}` : "",
            detail.reg_address_moo ? `หมู่ ${detail.reg_address_moo}` : "",
            detail.reg_address_soi ? `ซอย ${detail.reg_address_soi}` : "",
            detail.reg_address_street ? `ถนน ${detail.reg_address_street}` : "",
            detail.reg_address_subdistrict ? `ต. ${detail.reg_address_subdistrict}` : "",
            detail.reg_address_district ? `อ. ${detail.reg_address_district}` : "",
            detail.reg_address_province ? `จ. ${detail.reg_address_province === "95" ? "ยะลา" : detail.reg_address_province === "94" ? "ปัตตานี" : detail.reg_address_province === "96" ? "นราธิวาส" : detail.reg_address_province === "90" ? "สงขลา" : detail.reg_address_province}` : "",
            detail.postcode ? detail.postcode : ""
        ].filter(Boolean).join(" ");

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">รอตรวจสอบ</span>;
            case "approved":
            case "confirmed":
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ยืนยันแล้ว</span>;
            case "training":
            case "testing":
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">กำลังดำเนินการ</span>;
            case "completed":
            case "passed":
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">ผ่านการประเมิน</span>;
            case "failed":
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">ไม่ผ่าน</span>;
            case "cancelled":
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">ยกเลิกแล้ว</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#001a33] via-[#003366] to-[#002244] py-12 px-4 overflow-hidden relative">
            <div className="absolute inset-0 overflow-hidden -z-10">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#2563EB]/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto relative z-10"
            >
                {/* Profile Header */}
                <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-2xl bg-white/5 backdrop-blur-2xl p-8 mb-8">
                    <div className="absolute inset-0 opacity-[0.02] bg-noise mix-blend-overlay"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        {(() => {
                            const rawUrl = user?.profileImage || pData.profileImageUrl || detail.profileImage;
                            const isValidUrl = rawUrl && typeof rawUrl === "string" && (rawUrl.startsWith("http") || rawUrl.startsWith("/"));
                            const displayName = `${titleTH} ${firstName} ${lastName}`.trim() || user?.name || "สมาชิก";
                            const initialChar = displayName.replace(/^(นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.)\s*/, "").charAt(0) || "ส";

                            return (
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center border-2 border-white/20 overflow-hidden relative shadow-xl shrink-0">
                                    {isValidUrl ? (
                                        <img
                                            src={rawUrl}
                                            alt={displayName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <span className="text-white font-black text-3xl sm:text-4xl drop-shadow-md">
                                            {initialChar}
                                        </span>
                                    )}
                                </div>
                            );
                        })()}
                        <div className="text-center md:text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <h1 className="text-2xl font-bold text-gradient-gold">
                                    {titleTH} {firstName} {lastName}
                                </h1>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 self-center">
                                    {pData.memberId || "MEMBER"}
                                </span>
                            </div>
                            <p className="text-blue-200/50 text-xs sm:text-sm mt-1">ประเภทสิทธิ์: สมาชิกผู้ขอรับบริการของโครงการ</p>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-3 text-xs sm:text-sm text-blue-200/60">
                                <span><i className="fa-solid fa-phone mr-1.5 text-blue-400"></i> {phone}</span>
                                <span><i className="fa-solid fa-envelope mr-1.5 text-indigo-400"></i> {user.email || "-"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-2 backdrop-blur-md">
                            <button
                                onClick={() => setActiveTab("info")}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === "info"
                                        ? "bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-lg shadow-blue-500/20"
                                        : "text-blue-200/60 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <i className="fa-solid fa-user w-5 text-center"></i>
                                ข้อมูลส่วนตัว
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === "history"
                                        ? "bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-lg shadow-blue-500/20"
                                        : "text-blue-200/60 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <i className="fa-solid fa-clock w-5 text-center"></i>
                                ประวัติการจองคิว ({queues.length})
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mt-4 space-y-3 backdrop-blur-md">
                             <Link href="/profile/edit" className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all text-xs sm:text-sm">
                                 <i className="fa-solid fa-pen-to-square"></i>
                                 แก้ไขข้อมูลส่วนตัว
                             </Link>
                             <button
                                 onClick={handleClearPwaCache}
                                 disabled={clearingCache}
                                 className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold hover:bg-emerald-500/20 hover:text-emerald-200 transition-all text-xs sm:text-sm disabled:opacity-50"
                                 title="อัปเดตแอป PWA เป็นเวอร์ชันล่าสุดและล้างแคชชั่วคราว"
                             >
                                 {clearingCache ? (
                                     <span className="loading loading-spinner loading-xs text-emerald-300"></span>
                                 ) : (
                                     <i className="fa-solid fa-rotate text-emerald-400"></i>
                                 )}
                                 ⚡ อัปเดตแอป &amp; ล้างแคช PWA
                             </button>
                             <button onClick={async () => { await logout(); router.push('/login'); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/10 hover:text-red-300 transition-all text-xs sm:text-sm">
                                 <i className="fa-solid fa-right-from-bracket"></i>
                                 ออกจากระบบ
                             </button>
                        </div>
                    </div>

                    {/* Content Display */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {activeTab === "info" ? (
                                <motion.div
                                    key="info"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md"
                                >
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <i className="fa-solid fa-address-card text-blue-400"></i>
                                        ข้อมูลส่วนตัวผู้สมัคร
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: "คำนำหน้า", value: titleTH },
                                            { label: "ชื่อจริง", value: firstName },
                                            { label: "นามสกุล", value: lastName },
                                            { label: "เลขบัตรประชาชน", value: idCard },
                                            { label: "วันเดือนปีเกิด", value: birthDate },
                                            { label: "ระดับการศึกษาสูงสุด", value: education },
                                            { label: "เบอร์โทรศัพท์มือถือ", value: phone },
                                        ].map((field, i) => (
                                            <div key={i} className="flex flex-col gap-1 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                                <span className="text-blue-200/40 text-xs font-semibold">{field.label}</span>
                                                <span className="font-bold text-white text-sm sm:text-base">{field.value}</span>
                                            </div>
                                        ))}

                                        {/* Full width Address */}
                                        <div className="sm:col-span-2 flex flex-col gap-1 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                            <span className="text-blue-200/40 text-xs font-semibold">ที่อยู่ตามภูมิลำเนา</span>
                                            <span className="font-bold text-white text-sm sm:text-base leading-relaxed">{addressString || "-"}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md"
                                >
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <i className="fa-solid fa-list-check text-purple-400"></i>
                                        ประวัติคิวจองและสถานะการสมัคร
                                    </h2>

                                    {/* ── Appointment Notifications ── */}
                                    {notiLoading ? (
                                        <div className="py-4 flex justify-center mb-4">
                                            <span className="loading loading-dots loading-sm text-blue-400"></span>
                                        </div>
                                    ) : notifications.filter(n => n.type === "appointment" && !n.read).length > 0 && (
                                        <div className="mb-6 space-y-3">
                                            <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                                                <i className="fa-solid fa-bell animate-bounce"></i>
                                                การแจ้งเตือนนัดหมายใหม่ ({notifications.filter(n => n.type === "appointment" && !n.read).length})
                                            </h3>
                                            {notifications
                                                .filter(n => n.type === "appointment" && !n.read)
                                                .map(notif => {
                                                    let meta: any = {};
                                                    if (notif.metadata) { try { meta = JSON.parse(notif.metadata); } catch (e) {} }
                                                    const aptDate = meta.appointedDate
                                                        ? new Date(meta.appointedDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
                                                        : "-";
                                                    return (
                                                        <div key={notif.id} className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 border border-blue-400/30 flex flex-col gap-3">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                                                                    <i className="fa-solid fa-calendar-check text-blue-400 text-lg"></i>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="font-bold text-white text-sm">{notif.title}</p>
                                                                    <div className="mt-1.5 text-xs text-blue-200/70 space-y-0.5">
                                                                        <p><i className="fa-solid fa-book-open mr-1.5 text-blue-400"></i>{meta.itemName || "-"}</p>
                                                                        <p><i className="fa-regular fa-clock mr-1.5 text-blue-400"></i>{aptDate}</p>
                                                                        <p><i className="fa-solid fa-location-dot mr-1.5 text-red-400"></i>{meta.location || "สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา"}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleAddToCalendar(notif)}
                                                                disabled={calendarLoading === notif.id || !meta.appointedDate}
                                                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                                                            >
                                                                {calendarLoading === notif.id ? (
                                                                    <span className="loading loading-spinner loading-xs"></span>
                                                                ) : (
                                                                    <i className="fa-brands fa-google"></i>
                                                                )}
                                                                รับนัดหมาย &amp; บันทึก Google Calendar
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}

                                    {queuesLoading ? (
                                        <div className="py-12 flex justify-center">
                                            <span className="loading loading-spinner loading-md text-purple-500"></span>
                                        </div>
                                    ) : queues.length > 0 ? (
                                        <div className="space-y-4">
                                            {queues.map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                                                >
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${item.type === "test"
                                                                    ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                                                                    : "border-purple-500/30 bg-purple-500/10 text-purple-300"
                                                                }`}>
                                                                {item.type === "test" ? "ทดสอบมาตรฐาน" : "ฝึกอบรม"}
                                                            </span>
                                                            <span className="text-[11px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-lg border border-white/20">
                                                                รหัสการจอง: {item.id?.substring(0, 8).toUpperCase() || "N/A"}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-white text-base leading-snug">{item.itemName}</h4>
                                                        
                                                        {item.queueNumber && (
                                                            <p className="text-sm font-bold text-blue-300 mt-1">คิวที่จอง: {item.queueNumber}</p>
                                                        )}
                                                        <p className="text-[10px] text-slate-400 mt-1">
                                                            <i className="fa-regular fa-id-card mr-1"></i>
                                                            กรุณาแสดงบัตรประชาชน ({idCard}) เพื่อรายงานตัว
                                                        </p>

                                                        {item.appointedDate && (
                                                            <p className="text-xs text-emerald-400/80 mt-1 flex items-center gap-1.5">
                                                                <i className="fa-regular fa-calendar-check"></i>
                                                                วันนัดหมาย: {new Date(item.appointedDate).toLocaleDateString("th-TH", {
                                                                    year: "numeric",
                                                                    month: "long",
                                                                    day: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit"
                                                                })} น.
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="self-stretch sm:self-center flex sm:flex-col items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t border-white/5 sm:border-0">
                                                        {getStatusBadge(item.status)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-blue-200/40">
                                            <i className="fa-solid fa-calendar-xmark text-4xl mb-3"></i>
                                            <p className="text-sm font-sans">ยังไม่มีรายการจองคิวหรือสมัครอบรมในประวัติของท่าน</p>
                                            <Link
                                                href="/booking"
                                                className="btn btn-primary mt-5 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] border-0 text-white font-bold px-6"
                                            >
                                                จองคิวอบรมตอนนี้
                                            </Link>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}