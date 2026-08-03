"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface CommandPaletteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const COMMAND_ITEMS = [
    { title: "แดชบอร์ดสรุปผล", href: "/admin", category: "เมนูหลัก", icon: "fa-chart-pie", desc: "ภาพรวมสถิติคิว สมัคร สมาชิก" },
    { title: "จัดการคิว / เรียกคิว", href: "/admin/queue", category: "เมนูหลัก", icon: "fa-list-check", desc: "เรียกคิว เช็กอิน เพิ่ม Walk-in" },
    { title: "จัดการการฝึกอบรม", href: "/admin/training", category: "เมนูหลัก", icon: "fa-graduation-cap", desc: "เพิ่ม/แก้ไขหลักสูตรอบรม" },
    { title: "จัดการการทดสอบมาตรฐาน", href: "/admin/testing", category: "เมนูหลัก", icon: "fa-clipboard-check", desc: "เพิ่ม/แก้ไขสาขาทดสอบ" },
    { title: "จัดการข้อมูลสมาชิก", href: "/admin/members", category: "เมนูหลัก", icon: "fa-users", desc: "ดูประวัติ ตรวจสอบสมาชิก" },
    { title: "จัดการเจ้าหน้าที่ & สิทธิ์", href: "/admin/officers", category: "ระบบ", icon: "fa-user-shield", desc: "กำหนดสิทธิ์ผู้ดูแลระบบ" },
    { title: "ออกรายงาน & Export", href: "/admin/report", category: "รายงาน", icon: "fa-file-chart-column", desc: "ดาวน์โหลดรายงานสถิติ" },
    { title: "หน้าหลักบริการประชาชน", href: "/", category: "ภายนอก", icon: "fa-house", desc: "สลับไปยังหน้าหลักของระบบ" },
];

export default function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps) {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = COMMAND_ITEMS.filter(
        (item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.desc.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
    );

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Keyboard Listener (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                if (isOpen) onClose();
            }

            if (!isOpen) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
            } else if (e.key === "Enter" && filtered[selectedIndex]) {
                e.preventDefault();
                handleSelect(filtered[selectedIndex].href);
            } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, filtered, selectedIndex]);

    const handleSelect = (href: string) => {
        onClose();
        router.push(href);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-md font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Search Input Box */}
                    <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/90 gap-3">
                        <i className="fa-solid fa-magnifying-glass text-indigo-400 text-sm shrink-0"></i>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="พิมพ์คำค้นหาเมนู, หน้าจอ หรือกดลูกศรเลือก..."
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            className="w-full bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
                        />
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
                            <span>ESC</span>
                        </kbd>
                    </div>

                    {/* Results List */}
                    <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                        {filtered.length === 0 ? (
                            <div className="py-10 text-center text-slate-500 text-xs">
                                <i className="fa-solid fa-ghost text-2xl mb-2 block opacity-40"></i>
                                ไม่พบเมนูที่ค้นหา "{query}"
                            </div>
                        ) : (
                            filtered.map((item, idx) => {
                                const isSelected = idx === selectedIndex;
                                return (
                                    <div
                                        key={item.href}
                                        onClick={() => handleSelect(item.href)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                                            isSelected
                                                ? "bg-indigo-600/90 text-white shadow-md shadow-indigo-500/20"
                                                : "text-slate-300 hover:bg-slate-800/60"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                                                    isSelected
                                                        ? "bg-white/20 text-white"
                                                        : "bg-slate-800 text-indigo-400 border border-slate-700"
                                                }`}
                                            >
                                                <i className={`fa-solid ${item.icon}`}></i>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-xs truncate leading-snug">{item.title}</p>
                                                    <span
                                                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                                                            isSelected
                                                                ? "bg-white/20 text-white"
                                                                : "bg-slate-800 text-slate-400 border border-slate-700"
                                                        }`}
                                                    >
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <p
                                                    className={`text-[11px] truncate mt-0.5 ${
                                                        isSelected ? "text-indigo-100" : "text-slate-400"
                                                    }`}
                                                >
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>

                                        <i
                                            className={`fa-solid fa-chevron-right text-xs transition-transform ${
                                                isSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                                            }`}
                                        ></i>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer Tip */}
                    <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">
                                ↑↓
                            </kbd>{" "}
                            เพื่อเลือก
                            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300 ml-1">
                                ↵
                            </kbd>{" "}
                            เพื่อไปยังหน้า
                        </span>
                        <span className="hidden sm:inline-block text-[10px] text-indigo-400 font-semibold">
                            DSD YALA Fast Command
                        </span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
