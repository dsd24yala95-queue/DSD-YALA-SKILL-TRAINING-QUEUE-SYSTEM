"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

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

    return (
        <aside className="w-64 bg-gradient-to-b from-[#0f172a] to-[#1e293b] min-h-screen flex flex-col shrink-0">
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
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
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
    );
}