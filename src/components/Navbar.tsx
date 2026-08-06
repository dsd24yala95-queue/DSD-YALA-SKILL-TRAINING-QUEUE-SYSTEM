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
    const { user, logout } = useAuth();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isLinkActive = (href: string) => {
        if (href === "/") return pathname === href;
        return pathname.startsWith(href.split('?')[0]) && href !== "/";
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 shadow-sm text-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo - Left */}
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-10 h-10 flex items-center justify-center rounded overflow-hidden flex-shrink-0">
                                <Image src="/logo-seal.png" alt="Seal Logo" width={40} height={40} className="object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0B3C74] leading-tight">
                                    สพร.24 ยะลา
                                </h1>
                                <p className="text-[9px] sm:text-[10px] font-semibold tracking-widest text-slate-500 leading-tight">
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
                                                ? "bg-slate-100 text-[#0B3C74]"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-[#0B3C74]"
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Mobile Hamburger */}
                        <div className="flex items-center md:hidden gap-3">
                            {mounted && user && <NotificationsMenu />}
                            <button
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                                onClick={() => setMobileOpen(!mobileOpen)}
                                aria-label="Toggle menu"
                            >
                                <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
                            </button>
                        </div>

                        {/* Right Actions */}
                        <div className="hidden md:flex items-center justify-end gap-3 w-1/4">
                            {/* Dark Mode Toggle (Mock) */}
                            <button className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-[#0B3C74] flex items-center justify-center transition-all">
                                <i className="fa-solid fa-moon"></i>
                            </button>
                            
                            {mounted && user && <NotificationsMenu />}

                            {/* User Profile / Logout Button */}
                            {mounted && user ? (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href="/profile"
                                        className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
                                    >
                                        <i className="fa-solid fa-user text-[#0B3C74]"></i> โปรไฟล์
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="px-4 py-2 flex items-center justify-center rounded-full bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all"
                                    >
                                        ออกจากระบบ
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-5 py-2 rounded-full bg-[#0B3C74] text-white font-bold text-sm hover:bg-[#1E4D94] transition-all flex items-center gap-2 shadow-md shadow-[#0B3C74]/20"
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
                <div className="fixed top-20 left-0 right-0 z-40 bg-white border-b border-slate-100 md:hidden shadow-xl">
                    <div className="flex flex-col p-4 gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
                            >
                                <i className={`fa-solid ${link.icon} w-5 text-center text-[#0B3C74]`}></i>
                                {link.label}
                            </Link>
                        ))}
                        <div className="border-t border-slate-100 mt-2 pt-4">
                            {mounted && user ? (
                                <div className="flex gap-2">
                                    <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-bold text-sm hover:bg-slate-100">
                                        <i className="fa-solid fa-user text-[#0B3C74]"></i> โปรไฟล์
                                    </Link>
                                    <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center justify-center px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all">
                                        ออกจากระบบ
                                    </button>
                                </div>
                            ) : (
                                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0B3C74] text-white font-bold text-sm hover:bg-[#1E4D94] shadow-md transition-all">
                                    <i className="fa-solid fa-user"></i> เข้าสู่ระบบ
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Spacer */}
            <div className="h-20"></div>
        </>
    );
}
