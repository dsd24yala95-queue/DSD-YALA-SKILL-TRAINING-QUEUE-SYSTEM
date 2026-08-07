"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface LineConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    phoneNumber: string;
    userId: string;
    onStatusRefresh: () => void;
}

export default function LineConnectModal({
    isOpen,
    onClose,
    phoneNumber,
    userId,
    onStatusRefresh,
}: LineConnectModalProps) {
    const [copied, setCopied] = useState(false);
    const [checking, setChecking] = useState(false);

    if (!isOpen) return null;

    const formattedPhone = phoneNumber ? phoneNumber.trim() : "";

    const handleCopyPhone = () => {
        if (!formattedPhone) {
            toast.error("ไม่พบข้อมูลเบอร์โทรศัพท์");
            return;
        }
        navigator.clipboard.writeText(formattedPhone);
        setCopied(true);
        toast.success(`คัดลอกเบอร์โทรศัพท์ (${formattedPhone}) แล้ว!`);
        setTimeout(() => setCopied(false), 3000);
    };

    const handleCheckStatus = async () => {
        setChecking(true);
        try {
            const res = await fetch(`/api/users/line-status?userId=${userId}&_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data.isLinked) {
                    toast.success("🎉 เชื่อมต่อ LINE OA เรียบร้อยแล้ว!");
                    onStatusRefresh();
                    onClose();
                } else {
                    toast.info("ยังไม่พบข้อมูลการพิมพ์เบอร์ในแชท LINE OA กรุณาพิมพ์เบอร์ส่งในแชทอีกครั้งครับ");
                }
            } else {
                toast.error("ไม่สามารถตรวจสอบสถานะได้ กรุณาลองอีกครั้ง");
            }
        } catch (err) {
            console.error("Check status error:", err);
            toast.error("เกิดข้อผิดพลาดในการตรวจสอบสถานะ");
        } finally {
            setChecking(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-md bg-gradient-to-b from-[#0B1528] to-[#0F172A] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl text-white overflow-hidden"
                >
                    {/* Background Decorative Glow */}
                    <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#06C755]/20 rounded-full blur-3xl pointer-events-none"></div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all z-10"
                        title="ปิด"
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-[#06C755] text-white flex items-center justify-center text-2xl shadow-lg shadow-[#06C755]/30">
                            <i className="fa-brands fa-line"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white leading-tight">เชื่อมต่อ LINE Official Account</h2>
                            <p className="text-xs text-emerald-400 font-semibold mt-0.5">สพร.24 ยะลา (@522kafif)</p>
                        </div>
                    </div>

                    {/* Instruction Box */}
                    <div className="space-y-4">
                        {/* Step Cards */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#06C755]"></span> ขั้นตอนการเชื่อมต่อ 3 สเต็ปง่ายๆ
                            </h3>

                            <div className="space-y-2.5 text-xs">
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-[#06C755]/20 text-[#06C755] font-black flex items-center justify-center shrink-0 text-[11px]">
                                        1
                                    </span>
                                    <p className="text-slate-200 pt-0.5">
                                        แอดไลน์ <strong className="text-[#06C755] font-mono">@522kafif</strong> หรือ กดปุ่ม <strong className="text-[#06C755]">"เพิ่มเพื่อน LINE OA"</strong> ด้านล่าง
                                    </p>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-[#06C755]/20 text-[#06C755] font-black flex items-center justify-center shrink-0 text-[11px]">
                                        2
                                    </span>
                                    <p className="text-slate-200 pt-0.5">
                                        พิมพ์เบอร์โทรศัพท์ของคุณ <span className="font-mono text-emerald-300 font-bold">{formattedPhone || "10 หลัก"}</span> ลงในแชท LINE
                                    </p>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-[#06C755]/20 text-[#06C755] font-black flex items-center justify-center shrink-0 text-[11px]">
                                        3
                                    </span>
                                    <p className="text-slate-200 pt-0.5">
                                        ระบบจะผูกบัญชีและส่งข้อความยืนยัน <span className="text-emerald-400 font-bold">✅ เชื่อมต่อสำเร็จ</span> ใน LINE ทันที
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Phone Copy Pill */}
                        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">เบอร์โทรศัพท์สำหรับพิมพ์ในแชท</p>
                                <p className="text-base font-black font-mono text-white tracking-widest">{formattedPhone || "-"}</p>
                            </div>
                            <button
                                onClick={handleCopyPhone}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                                    copied
                                        ? "bg-emerald-500 text-white"
                                        : "bg-[#06C755] hover:bg-[#05b34c] text-white"
                                }`}
                            >
                                <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"}`}></i>
                                {copied ? "คัดลอกแล้ว!" : "คัดลอกเบอร์"}
                            </button>
                        </div>

                        {/* External LINE Add Friend Link (@522kafif) */}
                        <a
                            href="https://line.me/R/ti/p/@522kafif"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3.5 rounded-2xl bg-[#06C755] hover:bg-[#05b34c] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#06C755]/30 active:scale-95 border border-emerald-400/40"
                        >
                            <i className="fa-brands fa-line text-xl"></i>
                            <span>เพิ่มเพื่อน LINE OA (@522kafif)</span>
                            <i className="fa-solid fa-arrow-up-right-from-square text-xs opacity-80"></i>
                        </a>

                        {/* Re-check Status Button */}
                        <button
                            onClick={handleCheckStatus}
                            disabled={checking}
                            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 disabled:opacity-50"
                        >
                            <i className={`fa-solid fa-rotate ${checking ? "animate-spin text-emerald-400" : ""}`}></i>
                            <span>{checking ? "กำลังตรวจสอบสถานะ..." : "ฉันพิมพ์เบอร์ใน LINE แล้ว (ตรวจสอบสถานะ)"}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
