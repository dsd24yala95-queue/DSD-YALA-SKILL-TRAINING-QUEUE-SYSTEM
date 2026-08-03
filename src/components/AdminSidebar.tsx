"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
    { href: "/admin", icon: "fa-chart-pie", label: "แดชบอร์ด" },
    { href: "/admin/queue", icon: "fa-list-check", label: "จัดการคิว" },
    { href: "/admin/master", icon: "fa-book", label: "หลักสูตร/สาขา" },
    { href: "/admin/members", icon: "fa-users", label: "สมาชิก" },
    { href: "/admin/report", icon: "fa-file-chart-column", label: "รายงาน" },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

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

            {/* 💻 Desktop Fixed Sidebar (Visible on screens >= lg) */}
            <aside className="hidden lg:flex w-64 bg-gradient-to-b from-[#0f172a] to-[#1e293b] min-h-screen flex-col shrink-0 border-r border-white/5">
                {/* Logo */}
                <div className="px-6 py-6 border-b border-white/10">
                    <Link href="/admin" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm">ส</span>
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm leading-tight">DSD YALA</h2>
                            <p className="text-[10px] text-gray-400">ระบบจัดการหลังบ้าน</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">เมนู</p>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isActive
                                        ? "bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-md"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <i className={`fa-solid ${item.icon} w-5 text-center text-sm`}></i>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="px-3 py-4 border-t border-white/10">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <i className="fa-solid fa-arrow-left w-5 text-center text-sm"></i>
                        กลับหน้าแรก
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all mt-1"
                    >
                        <i className="fa-solid fa-right-from-bracket w-5 text-center text-sm"></i>
                        ออกจากระบบ
                    </button>
                </div>
            </aside>
        </>
    );
}