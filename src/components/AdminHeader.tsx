"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

const PATH_MAP: { [key: string]: { label: string; icon: string; category: string } } = {
    "/admin": { label: "แดชบอร์ดจัดการระบบ", icon: "fa-chart-pie", category: "ภาพรวม" },
    "/admin/queue": { label: "จัดการและเรียกคิวประจำวัน", icon: "fa-list-check", category: "ระบบคิว" },
    "/admin/walkin": { label: "ลงทะเบียน Walk-in หน้างาน", icon: "fa-person-walking-arrow-right", category: "ระบบคิว" },
    "/admin/training": { label: "จัดการหลักสูตรฝึกอบรม", icon: "fa-graduation-cap", category: "การฝึกอบรม" },
    "/admin/testing": { label: "จัดการสาขาทดสอบมาตรฐาน", icon: "fa-clipboard-check", category: "การทดสอบ" },
    "/admin/news": { label: "จัดการข่าวสารและประกาศ", icon: "fa-newspaper", category: "ประชาสัมพันธ์" },
    "/admin/line-oa": { label: "จัดการระบบ LINE OA", icon: "fa-brands fa-line", category: "การสื่อสาร" },
    "/admin/members": { label: "จัดการข้อมูลสมาชิก", icon: "fa-users", category: "ฐานข้อมูล" },
    "/admin/officers": { label: "จัดการบัญชีเจ้าหน้าที่ & สิทธิ์", icon: "fa-user-shield", category: "ผู้ดูแลระบบ" },
    "/admin/report": { label: "รายงานสถิติและส่งออกข้อมูล", icon: "fa-file-chart-column", category: "รายงาน" },
};

export default function AdminHeader() {
    const pathname = usePathname();
    const { user, profile } = useAuth();
    const [currentTime, setCurrentTime] = useState("");
    const [currentDateStr, setCurrentDateStr] = useState("");

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })
            );
            setCurrentDateStr(
                now.toLocaleDateString("th-TH", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                })
            );
        };

        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    const currentPage = PATH_MAP[pathname] || {
        label: "ระบบหลังบ้าน",
        icon: "fa-shield-halved",
        category: "แอดมิน",
    };

    const triggerCommandPalette = () => {
        window.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "k",
                ctrlKey: true,
                bubbles: true,
            })
        );
    };

    const userDisplayName = profile?.fullName || user?.name || user?.phoneNumber || "ผู้ดูแลระบบ";
    const userRoleLabel = user?.role === "admin" ? "Super Admin" : "เจ้าหน้าที่ สพร.24";
    const avatarUrl = profile?.profileJson ? (() => {
        try {
            const p = JSON.parse(profile.profileJson);
            return p.profileImage || p.profileImageUrl || null;
        } catch {
            return null;
        }
    })() : null;

    return (
        <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
            <div className="px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-4">
                
                {/* 🧭 Left Column: Breadcrumb & Title */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs sm:text-base font-black shadow-xs sm:shadow-md shadow-indigo-500/20 shrink-0">
                        <i className={`fa-solid ${currentPage.icon}`}></i>
                    </div>

                    <div className="min-w-0">
                        {/* Breadcrumbs (Hidden on tiny mobile screens to save vertical height) */}
                        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                            <Link href="/admin" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                                <i className="fa-solid fa-house text-[10px]"></i>
                                <span>หน้าหลัก</span>
                            </Link>
                            <span>/</span>
                            <span className="text-indigo-600">{currentPage.category}</span>
                        </div>

                        {/* Page Title */}
                        <h1 className="text-xs sm:text-lg font-black text-slate-800 tracking-tight leading-tight truncate">
                            {currentPage.label}
                        </h1>
                    </div>
                </div>

                {/* ⚡ Right Column: System Status, Cmd+K, Clock & Profile */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    
                    {/* 🟢 Live System Status Badge (Hidden on small mobile) */}
                    <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>ออนไลน์ • สพร.24 ยะลา</span>
                    </div>

                    {/* 🔍 Global Search Trigger (Cmd+K) */}
                    <button
                        onClick={triggerCommandPalette}
                        className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-indigo-400 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-all shadow-xs group"
                        title="เปิดเมนูค้นหาด่วน (Ctrl+K)"
                    >
                        <i className="fa-solid fa-magnifying-glass text-slate-400 group-hover:text-indigo-500 text-xs"></i>
                        <span className="text-[11px]">ค้นหาด่วน...</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-slate-200/70 border border-slate-300/60 text-[9px] font-mono text-slate-600 font-bold group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200">
                            ⌘K
                        </kbd>
                    </button>

                    {/* 🕒 Live Digital Clock */}
                    <div className="hidden md:flex flex-col items-end px-3 py-1 bg-slate-100/70 border border-slate-200/60 rounded-xl text-right">
                        <div className="text-xs font-mono font-bold text-slate-800 tracking-wider flex items-center gap-1.5">
                            <i className="fa-regular fa-clock text-indigo-500 text-[10px]"></i>
                            <span>{currentTime || "--:--:--"}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{currentDateStr}</span>
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                    {/* 👤 Officer Profile Pill */}
                    <div className="flex items-center gap-2 pl-1">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden border border-white shrink-0">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={userDisplayName} className="w-full h-full object-cover" />
                            ) : (
                                <span>{userDisplayName.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                            <span className="text-xs font-extrabold text-slate-800 leading-tight max-w-[120px] lg:max-w-[160px] truncate">
                                {userDisplayName}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-md w-fit mt-0.5">
                                {userRoleLabel}
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </header>
    );
}
