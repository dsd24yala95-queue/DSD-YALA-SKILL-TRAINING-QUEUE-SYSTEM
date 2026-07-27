import os

navbar_content = """"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationsMenu from "@/components/NotificationsMenu";

const navLinks = [
    { href: "/", label: "หน้าหลัก", icon: "fa-house" },
    { href: "/booking?type=training", label: "ฝึกอบรม", icon: "fa-graduation-cap" },
    { href: "/booking?type=test", label: "ทดสอบมาตรฐาน", icon: "fa-clipboard-check" },
    { href: "#", label: "ข่าวสาร", icon: "fa-newspaper" },
    { href: "#", label: "ติดต่อ", icon: "fa-phone" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const { user, logout } = useAuth();

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B3C74] text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-white flex items-center justify-center rounded overflow-hidden">
                                <Image src="/logo-seal.png" alt="Seal Logo" width={40} height={40} className="object-contain" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-xl font-black uppercase tracking-wider">
                                    DSD YALA
                                </h1>
                                <p className="text-[11px] font-semibold tracking-widest text-blue-200">
                                    SKILL QUEUE SYSTEM
                                </p>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href.split('?')[0]) && (typeof window !== 'undefined' && window.location.search === link.href.split('?')[1]));
                                // Simplified active check for layout
                                const isHomeActive = pathname === "/" && link.href === "/";
                                
                                return (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                                            isHomeActive
                                                ? "bg-[#1E4D94] text-white shadow-inner"
                                                : "text-white/80 hover:bg-[#1E4D94]/50 hover:text-white"
                                        }`}
                                    >
                                        {isHomeActive && <i className={`fa-solid ${link.icon} text-xs`}></i>}
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            {mounted && user && <NotificationsMenu />}

                            {/* User Profile / Logout Button */}
                            {mounted && user ? (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href="/profile"
                                        className="px-4 py-2 rounded-lg border border-white/20 text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2"
                                    >
                                        <i className="fa-solid fa-user"></i> โปรไฟล์
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white transition-all"
                                        title="ออกจากระบบ"
                                    >
                                        <i className="fa-solid fa-right-from-bracket"></i>
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-5 py-2 rounded-lg border border-white/30 text-white font-bold text-sm hover:bg-white hover:text-[#0B3C74] transition-all flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-user"></i> เข้าสู่ระบบ
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Spacer */}
            <div className="h-20"></div>
        </>
    );
}
"""

with open("src/components/Navbar.tsx", "w", encoding="utf-8") as f:
    f.write(navbar_content)

print("Navbar updated")
