"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { createQueueBooking, getActiveBranches, MasterBranch } from "@/lib/services/db-service";
import { toast } from "sonner";

export default function SkillTestingPage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [branches, setBranches] = useState<MasterBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingId, setBookingId] = useState<string | null>(null);

    useEffect(() => {
        async function loadBranches() {
            try {
                const data = await getActiveBranches();
                setBranches(data);
            } catch (error) {
                console.error("Failed to load skill test branches:", error);
                toast.error("ไม่สามารถโหลดข้อมูลสาขาทดสอบมาตรฐานได้");
            } finally {
                setLoading(false);
            }
        }
        loadBranches();
    }, []);

    const handleBooking = async (branchId: string, branchName: string) => {
        if (!user) {
            toast.info("กรุณาเข้าสู่ระบบก่อนดำเนินการจองคิวทดสอบมาตรฐาน");
            const targetUrl = `/testing`;
            router.push(`/login?callbackUrl=${encodeURIComponent(targetUrl)}`);
            return;
        }

        const targetUserId = profile?.uid || profile?.memberId || user?.id;
        if (!targetUserId) {
            toast.error("ข้อมูลโปรไฟล์ของคุณยังไม่สมบูรณ์ กรุณาอัปเดตโปรไฟล์ก่อนจองคิว");
            router.push("/profile/edit");
            return;
        }

        let toastId;
        try {
            setBookingId(branchId);
            toastId = toast.loading(`กำลังส่งคำขอสมัครทดสอบมาตรฐาน "${branchName}"...`);
            await createQueueBooking(targetUserId, "test", branchId, branchName);
            toast.success(`สมัครทดสอบมาตรฐาน "${branchName}" สำเร็จแล้ว! กรุณารอการตรวจสอบ`, { id: toastId });
            router.push("/profile");
        } catch (error: any) {
            console.error("Booking error:", error);
            toast.error(error.message || "เกิดข้อผิดพลาดในการสมัครทดสอบมาตรฐาน", { id: toastId });
        } finally {
            setBookingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-white font-sans relative overflow-hidden flex flex-col justify-between">

            {/* --- HERO BACKGROUND SECTION MATCHING HOMEPAGE --- */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/bg1.png"
                    alt="DSD Yala Background"
                    fill
                    className="object-cover object-center opacity-40"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/90 via-[#0F172A]/80 to-[#0F172A]"></div>
                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                ></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 w-full">

                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 font-medium">
                    <Link href="/" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                        <i className="fa-solid fa-house"></i> หน้าหลัก
                    </Link>
                    <span>/</span>
                    <span className="text-blue-400 font-bold">ทดสอบมาตรฐานฝีมือแรงงาน</span>
                </div>

                {/* Hero Title Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-3xl mx-auto mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-extrabold mb-4 backdrop-blur-md shadow-lg shadow-blue-500/10">
                        <i className="fa-solid fa-clipboard-check text-sm"></i>
                        NATIONAL SKILL TESTING BRANCHES
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-3">
                        สาขาทดสอบมาตรฐานฝีมือแรงงาน
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                        ประเมินและรับรองทักษะฝีมือแรงงานแห่งชาติ เพื่อเพิ่มศักยภาพสายอาชีพและโอกาสรับอัตราค่าจ้างตามมาตรฐานฝีมือแรงงาน
                    </p>
                </motion.div>

                {/* Branch Cards List */}
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3">
                        <span className="loading loading-spinner loading-lg text-blue-400"></span>
                        <p className="text-sm font-semibold text-slate-400">กำลังโหลดรายการสาขาทดสอบมาตรฐาน...</p>
                    </div>
                ) : branches.length === 0 ? (
                    <div className="bg-slate-900/70 border border-slate-700/60 rounded-3xl p-12 text-center max-w-xl mx-auto backdrop-blur-xl">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4 text-2xl">
                            <i className="fa-solid fa-clipboard-xmark"></i>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">ยังไม่มีสาขาทดสอบมาตรฐานที่เปิดรับสมัครขณะนี้</h3>
                        <p className="text-xs text-slate-400 mb-6">โปรดติดตามประกาศกำหนดการทดสอบมาตรฐานฝีมือแรงงานรอบถัดไป</p>
                        <Link href="/" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-600">
                            <i className="fa-solid fa-arrow-left mr-1.5"></i> กลับหน้าหลัก
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {branches.map((branch, index) => {
                            const isSubmittingThis = bookingId === branch.id;

                            return (
                                <motion.div
                                    key={branch.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                    className="bg-slate-900/70 backdrop-blur-2xl border border-slate-700/60 hover:border-blue-500/60 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] group"
                                >
                                    <div>
                                        {/* Card Top Badges */}
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-1.5">
                                                <i className="fa-solid fa-layer-group text-[10px]"></i>
                                                ระดับมาตรฐาน {branch.levels || "ระดับ 1"}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold border border-blue-500/30">
                                                เปิดรับสมัคร
                                            </span>
                                        </div>

                                        {/* Branch Icon & Name */}
                                        <div className="flex items-start gap-3.5 mb-5">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white flex items-center justify-center text-xl shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                                <i className="fa-solid fa-certificate"></i>
                                            </div>
                                            <div>
                                                <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug group-hover:text-blue-300 transition-colors">
                                                    {branch.branchName}
                                                </h3>
                                                <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1">
                                                    <i className="fa-solid fa-building-columns text-[10px] text-blue-400"></i>
                                                    สนามทดสอบ สพร.24 ยะลา
                                                </p>
                                            </div>
                                        </div>

                                        {/* Max Queue Info */}
                                        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/50 mb-5 flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-bold">โควต้ารับสมัครต่อรอบ:</span>
                                            <span className="text-blue-400 font-extrabold">{branch.maxQueue || 20} คน/รอบ</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        type="button"
                                        disabled={isSubmittingThis}
                                        onClick={() => handleBooking(branch.id, branch.branchName)}
                                        className="w-full py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-95"
                                    >
                                        {isSubmittingThis ? (
                                            <><span className="loading loading-spinner loading-xs"></span> กำลังส่งคำขอ...</>
                                        ) : (
                                            <><i className="fa-solid fa-paper-plane"></i> จองคิว / สมัครทดสอบมาตรฐาน</>
                                        )}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom Wave decoration matching homepage */}
            <div className="relative w-full overflow-hidden leading-none z-10 opacity-30">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 block">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C50.93,81.42,102.5,68,154.6,56.7,210.37,44.6,266.6,41,321.39,56.44Z" fill="#ffffff"></path>
                </svg>
            </div>
        </div>
    );
}
