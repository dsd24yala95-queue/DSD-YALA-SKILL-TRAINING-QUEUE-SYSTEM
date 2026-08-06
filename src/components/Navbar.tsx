"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationsMenu from "@/components/NotificationsMenu";

const navLinks = [
    { href: "/", label: "หน้าหลัก", icon: "fa-house", exact: true },
    { href: "/training", label: "ฝึกอบรม", icon: "fa-graduation-cap" },
    { href: "/testing", label: "ทดสอบมาตรฐาน", icon: "fa-clipboard-check" },
    { href: "#news", label: "ข่าวสาร", icon: "fa-newspaper" },
    { href: "#footer", label: "ติดต่อ", icon: "fa-phone" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user, logout } = useAuth();

    const isHome = pathname === "/";

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            if (window.scrollY > 20) setScrolled(true);
            else setScrolled(false);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isLinkActive = (href: string) => {
        if (href === "/") return pathname === href;
        return pathname.startsWith(href.split('?')[0]) && href !== "/";
    };

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isHome
                    ? scrolled
                        ? "bg-[#0B1528]/90 backdrop-blur-xl border-b border-white/10 text-white shadow-xl"
                        : "bg-gradient-to-b from-[#0F172A]/90 via-[#0F172A]/50 to-transparent text-white"
                    : "bg-white border-b border-slate-100 shadow-sm text-slate-700"
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo - Left */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md p-1 border border-white/20 flex-shrink-0 shadow-md">
                                <Image src="/logo-seal.png" alt="Seal Logo" width={36} height={36} className="object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className={`text-sm sm:text-base font-black uppercase tracking-wider leading-tight ${isHome ? "text-white" : "text-[#0B3C74]"}`}>
                                    {isHome ? "DSD YALA" : "สพร.24 ยะลา"}
                                </h1>
                                <p className={`text-[9px] sm:text-[10px] font-semibold tracking-widest leading-tight ${isHome ? "text-slate-300" : "text-slate-500"}`}>
                                    SKILL QUEUE SYSTEM
                                </p>
                            </div>
                        </Link>

                        {/* Desktop Nav - Center */}
                        <div className="hidden md:flex items-center justify-center gap-2 flex-1">
                            {navLinks.map((link) => {
                                const active = isLinkActive(link.href);
                                return (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                                            active
                                                ? isHome
                                                    ? "bg-white/20 text-white backdrop-blur-md"
                                                    : "bg-slate-100 text-[#0B3C74]"
                                                : isHome
                                                    ? "text-slate-300 hover:bg-white/10 hover:text-white"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-[#0B3C74]"
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Mobile Header Buttons (Notification Bell + Glassmorphic Menu) matching Image 2 */}
                        <div className="flex items-center md:hidden gap-3">
                            {/* Notification Bell Icon */}
                            <Link
                                href={user ? "/notifications" : "/login"}
                                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                    isHome
                                        ? "bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md shadow-md"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                                aria-label="Notifications"
                            >
                                <i className="fa-regular fa-bell text-lg"></i>
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-[#0B1528] shadow-sm animate-pulse">
                                    3
                                </span>
                            </Link>

                            {/* Glassmorphic Hamburger Button */}
                            <button
                                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${
                                    isHome
                                        ? "bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md shadow-md"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                }`}
                                onClick={() => setMobileOpen(!mobileOpen)}
                                aria-label="Toggle menu"
                            >
                                <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
                            </button>
                        </div>

                        {/* Right Actions (Desktop) */}
                        <div className="hidden md:flex items-center justify-end gap-3 w-1/4">
                            {mounted && user && <NotificationsMenu />}

                            {mounted && user ? (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href="/profile"
                                        className={`px-4 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
                                            isHome
                                                ? "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                    >
                                        <i className="fa-solid fa-user"></i> โปรไฟล์
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="px-4 py-2 flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-sm hover:bg-red-500/30 transition-all"
                                    >
                                        ออกจากระบบ
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
                                >
                                    <i className="fa-solid fa-user"></i> เข้าสู่ระบบ
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Dropdown */}
            {mobileOpen && (
                <div className={`fixed top-20 left-0 right-0 z-40 md:hidden shadow-2xl transition-all ${
                    isHome 
                        ? "bg-[#0B1528]/95 backdrop-blur-2xl border-b border-white/10 text-white" 
                        : "bg-white border-b border-slate-100 text-slate-700"
                }`}>
                    <div className="flex flex-col p-4 gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                                    isHome 
                                        ? "text-slate-200 hover:bg-white/10 hover:text-white" 
                                        : "text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <i className={`fa-solid ${link.icon} w-5 text-center ${isHome ? "text-blue-400" : "text-[#0B3C74]"}`}></i>
                                {link.label}
                            </Link>
                        ))}
                        <div className="border-t border-slate-700/50 mt-2 pt-4">
                            {mounted && user ? (
                                <div className="flex gap-2">
                                    <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20">
                                        <i className="fa-solid fa-user text-blue-400"></i> โปรไฟล์
                                    </Link>
                                    <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center justify-center px-4 py-3 rounded-xl bg-red-500/20 text-red-300 font-bold text-sm hover:bg-red-500/30 transition-all">
                                        ออกจากระบบ
                                    </button>
                                </div>
                            ) : (
                                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg transition-all">
                                    <i className="fa-solid fa-user"></i> เข้าสู่ระบบ
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Spacer (Only when not home transparent navbar) */}
            {!isHome && <div className="h-20"></div>}
        </>
    );
}

