"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import CommandPaletteModal from "@/components/CommandPaletteModal";

const menuItems = [
    { href: "/admin", icon: "fa-chart-pie", label: "แดชบอร์ด", category: "main" },
    { href: "/admin/queue", icon: "fa-list-check", label: "จัดการคิว", category: "main" },
    { href: "/admin/training", icon: "fa-graduation-cap", label: "การฝึกอบรม", category: "main" },
    { href: "/admin/testing", icon: "fa-clipboard-check", label: "การทดสอบมาตรฐาน", category: "main" },
    { href: "/admin/members", icon: "fa-users", label: "สมาชิก", category: "main" },
    { href: "/admin/officers", icon: "fa-user-shield", label: "จัดการเจ้าหน้าที่", category: "main" },
    { href: "/admin/report", icon: "fa-file-chart-column", label: "รายงาน", category: "main" },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Global Ctrl+K / Cmd+K listener to open Command Palette
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setCommandPaletteOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, []);

    // Restore collapsed preference from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("dsd_admin_sidebar_collapsed");
        if (saved !== null) {
            setIsCollapsed(saved === "true");
        }
    }, []);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem("dsd_admin_sidebar_collapsed", String(next));
            return next;
        });
    };

    const handleLogout = async () => {
        const toastId = toast.loading("กำลังออกจากระบบ...");
        try {
            await logout();
            toast.success("ออกจากระบบสำเร็จ!", { id: toastId });
            router.push("/login/admin");
        } catch (error: any) {
            console.error("Admin logout error:", error);
            toast.error("เกิดข้อผิดพลาดในการออกจากระบบ", { id: toastId });
        }
    };

    const currentItem = menuItems.find((item) => item.href === pathname);
    const filteredMenuItems = menuItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            {/* 📱 Mobile & Tablet Top Bar (Visible on screens < lg) */}
            <div className="lg:hidden bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white px-4 py-3.5 flex items-center justify-between border-b border-white/10 sticky top-0 z-40 shadow-md">
                <Link href="/admin" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-xs">ส</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-xs leading-tight">DSD YALA ADMIN</h2>
                        <p className="text-[10px] text-indigo-300 font-medium">{currentItem?.label || "ระบบหลังบ้าน"}</p>
                    </div>
                </Link>

                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all border border-white/10"
                    aria-label="Toggle menu"
                >
                    <i className={`fa-solid ${mobileOpen ? "fa-xmark" : "fa-bars"} text-base`}></i>
                </button>
            </div>

            {/* 📱 Mobile Drawer Backdrop & Drawer Container */}
            <AnimatePresence>
                {mobileOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 flex">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />

                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative w-72 bg-gradient-to-b from-[#0f172a] to-[#1e293b] h-full flex flex-col z-10 shadow-2xl"
                        >
                            {/* Drawer Header */}
                            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                                <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-sm">ส</span>
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold text-sm leading-tight">DSD YALA</h2>
                                        <p className="text-[10px] text-gray-400">ระบบจัดการหลังบ้าน</p>
                                    </div>
                                </Link>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="text-gray-400 hover:text-white p-1"
                                >
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>

                            {/* Drawer Navigation */}
                            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
                                <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">เมนูการใช้งาน</p>
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                                                isActive
                                                    ? "bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-md shadow-indigo-500/20"
                                                    : "text-gray-300 hover:text-white hover:bg-white/5"
                                            }`}
                                        >
                                            <i className={`fa-solid ${item.icon} w-5 text-center text-sm`}></i>
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Drawer Bottom */}
                            <div className="px-4 py-4 border-t border-white/10 space-y-1">
                                <Link
                                    href="/"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <i className="fa-solid fa-arrow-left w-5 text-center text-sm"></i>
                                    กลับหน้าแรก
                                </Link>
                                <button
                                    onClick={() => {
                                        setMobileOpen(false);
                                        handleLogout();
                                    }}
                                    className="flex items-center gap-3.5 w-full px-4 py-3 rounded-2xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                                >
                                    <i className="fa-solid fa-right-from-bracket w-5 text-center text-sm"></i>
                                    ออกจากระบบ
                                </button>
                            </div>
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

            {/* 💻 Desktop Collapsible DataPulse Style Sidebar (Visible on screens >= lg) */}
            <aside
                className={`hidden lg:flex bg-gradient-to-b from-[#0f172a] to-[#1e293b] min-h-screen flex-col shrink-0 border-r border-white/5 sticky top-0 h-screen transition-all duration-300 ${
                    isCollapsed ? "w-20 px-2.5 py-4" : "w-64 px-4 py-5"
                }`}
            >
                {/* 1. DataPulse Header: Logo + Toggle Expand Button */}
                <div className={`flex items-center justify-between pb-4 mb-3 border-b border-white/10 ${isCollapsed ? "px-1" : "px-2"}`}>
                    <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                            <span className="text-white font-black text-base">ส</span>
                        </div>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="whitespace-nowrap"
                            >
                                <h2 className="text-white font-black text-sm tracking-tight leading-none">DSD YALA</h2>
                                <p className="text-[10px] text-indigo-300 font-semibold mt-1">ระบบจัดการหลังบ้าน</p>
                            </motion.div>
                        )}
                    </Link>

                    {/* Expand/Collapse Toggle Button */}
                    <button
                        onClick={toggleCollapse}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all shrink-0 active:scale-95"
                        title={isCollapsed ? "ขยายเมนู (256px)" : "ย่อเมนู (80px)"}
                    >
                        <i className={`fa-solid ${isCollapsed ? "fa-angles-right text-xs" : "fa-angles-left text-xs"}`}></i>
                    </button>
                </div>

                {/* 2. Quick Search Input (DataPulse Search Bar + Ctrl+K Command Palette Trigger) */}
                <div className="mb-4 relative">
                    <div
                        onClick={() => setCommandPaletteOpen(true)}
                        className={`flex items-center justify-between gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 transition-all cursor-pointer hover:bg-white/10 hover:border-indigo-500/40 group ${
                            isCollapsed ? "justify-center" : ""
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <i className="fa-solid fa-magnifying-glass text-indigo-400 shrink-0 group-hover:scale-110 transition-transform"></i>
                            {!isCollapsed && <span className="text-gray-400 text-xs truncate">ค้นหาด่วน...</span>}
                        </div>
                        {!isCollapsed && (
                            <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] font-mono text-indigo-300 font-bold shrink-0">
                                ⌘K
                            </kbd>
                        )}
                    </div>
                </div>

                {/* 3. Navigation Links & DataPulse Tooltips */}
                <nav className="flex-1 space-y-1.5 overflow-y-auto pr-0.5">
                    {!isCollapsed && (
                        <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">เมนูการใช้งาน</p>
                    )}

                    {filteredMenuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <div key={item.href} className="relative group">
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3.5 rounded-xl transition-all duration-200 ${
                                        isCollapsed
                                            ? "w-12 h-12 justify-center mx-auto"
                                            : "px-3.5 py-2.5 text-xs font-semibold"
                                    } ${
                                        isActive
                                            ? "bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-md shadow-indigo-500/20"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    <i className={`fa-solid ${item.icon} ${isCollapsed ? "text-base" : "text-sm w-5 text-center"}`}></i>
                                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                                </Link>

                                {/* DataPulse Hover Tooltip for Collapsed Mode */}
                                {isCollapsed && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
                                        {/* Left arrow indicator */}
                                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
                                        {item.label}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* 4. DataPulse Profile Menu Trigger & Dropdown at Bottom */}
                <div className="pt-3 border-t border-white/10 relative" ref={profileRef}>
                    {/* Profile Trigger Button */}
                    <button
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className={`w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all text-left group ${
                            isCollapsed ? "justify-center" : ""
                        }`}
                        title={user?.fullName || "แอดมินระบบ"}
                    >
                        {/* Avatar + Online Indicator */}
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-sm text-sm border border-white/20">
                                {user?.fullName ? user.fullName.charAt(0) : "A"}
                            </div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0f172a] absolute -bottom-0.5 -right-0.5 shadow-sm"></div>
                        </div>

                        {/* Name & Email (Expanded mode) */}
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate leading-snug">{user?.fullName || "ผู้ดูแลระบบ"}</p>
                                <p className="text-[10px] text-gray-400 truncate">{user?.phoneNumber || "สพร.24 ยะลา"}</p>
                            </div>
                        )}

                        {/* Chevron */}
                        {!isCollapsed && (
                            <i
                                className={`fa-solid fa-chevron-down text-xs text-gray-400 transition-transform duration-200 ${
                                    profileDropdownOpen ? "rotate-180 text-white" : ""
                                }`}
                            ></i>
                        )}
                    </button>

                    {/* DataPulse Style Profile Dropdown Card */}
                    <AnimatePresence>
                        {profileDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className={`absolute bottom-full mb-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl z-50 text-xs w-60 ${
                                    isCollapsed ? "left-14" : "left-0"
                                }`}
                            >
                                {/* Header */}
                                <div className="flex items-center gap-3 pb-3 mb-2 border-b border-white/10">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                                        {user?.fullName ? user.fullName.charAt(0) : "A"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-white truncate">{user?.fullName || "แอดมินระบบ"}</p>
                                        <p className="text-[10px] text-indigo-300 font-semibold">{user?.role === "admin" ? "Super Admin" : "ผู้ดูแลระบบ"}</p>
                                    </div>
                                </div>

                                {/* Menu items */}
                                <div className="space-y-1">
                                    <Link
                                        href="/profile"
                                        onClick={() => setProfileDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all font-medium"
                                    >
                                        <i className="fa-solid fa-user-gear text-indigo-400 w-4"></i>
                                        โปรไฟล์ของฉัน
                                    </Link>
                                    <Link
                                        href="/"
                                        onClick={() => setProfileDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all font-medium"
                                    >
                                        <i className="fa-solid fa-house text-blue-400 w-4"></i>
                                        กลับหน้าแรก
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setProfileDropdownOpen(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all font-semibold"
                                    >
                                        <i className="fa-solid fa-right-from-bracket text-rose-400 w-4"></i>
                                        ออกจากระบบ
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            {/* Command Palette Modal (Ctrl+K) */}
            <CommandPaletteModal
                isOpen={commandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
            />
        </>
    );
}