"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { createQueueBooking, getActiveCourses, MasterCourse } from "@/lib/services/db-service";
import { toast } from "sonner";
import { formatDateRangeTh } from "@/lib/dateFormatter";

export default function TrainingCoursesPage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [courses, setCourses] = useState<MasterCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingId, setBookingId] = useState<string | null>(null);

    useEffect(() => {
        async function loadCourses() {
            try {
                const data = await getActiveCourses();
                setCourses(data);
            } catch (error) {
                console.error("Failed to load training courses:", error);
                toast.error("ไม่สามารถโหลดข้อมูลหลักสูตรฝึกอบรมได้");
            } finally {
                setLoading(false);
            }
        }
        loadCourses();
    }, []);

    const handleBooking = async (courseId: string, courseName: string) => {
        if (!user) {
            toast.info("กรุณาเข้าสู่ระบบก่อนดำเนินการจองคิวฝึกอบรม");
            const targetUrl = `/training`;
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
            setBookingId(courseId);
            toastId = toast.loading(`กำลังส่งคำขอสมัครฝึกอบรม "${courseName}"...`);
            await createQueueBooking(targetUserId, "training", courseId, courseName);
            toast.success(`สมัครฝึกอบรม "${courseName}" สำเร็จแล้ว! กรุณารอการตรวจสอบ`, { id: toastId });
            router.push("/profile");
        } catch (error: any) {
            console.error("Booking error:", error);
            toast.error(error.message || "เกิดข้อผิดพลาดในการสมัครฝึกอบรม", { id: toastId });
        } finally {
            setBookingId(null);
        }
    };

    const usedSeatsPercent = (course: MasterCourse) =>
        course.maxSeats > 0 ? Math.min(100, Math.round((course.currentQueue / course.maxSeats) * 100)) : 0;

    const isFull = (course: MasterCourse) => course.currentQueue >= course.maxSeats;

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
                    <span className="text-emerald-400 font-bold">ฝึกอบรมพัฒนาทักษะอาชีพ</span>
                </div>

                {/* Hero Title Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-3xl mx-auto mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold mb-4 backdrop-blur-md shadow-lg shadow-emerald-500/10">
                        <i className="fa-solid fa-graduation-cap text-sm"></i>
                        DSD YALA TRAINING COURSES
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-3">
                        หลักสูตรฝึกอบรมพัฒนาทักษะอาชีพ
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                        เลือกหลักสูตรที่สนใจ เพื่อยกระดับความรู้ เพิ่มพูนทักษะฝีมือ และขยายโอกาสในการประกอบอาชีพยุคใหม่
                    </p>
                </motion.div>

                {/* Courses List */}
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3">
                        <span className="loading loading-spinner loading-lg text-emerald-400"></span>
                        <p className="text-sm font-semibold text-slate-400">กำลังโหลดรายการหลักสูตรฝึกอบรม...</p>
                    </div>
                ) : courses.length === 0 ? (
                    <div className="bg-slate-900/70 border border-slate-700/60 rounded-3xl p-12 text-center max-w-xl mx-auto backdrop-blur-xl">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-2xl">
                            <i className="fa-solid fa-calendar-xmark"></i>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">ยังไม่มีหลักสูตรฝึกอบรมที่เปิดรับสมัครขณะนี้</h3>
                        <p className="text-xs text-slate-400 mb-6">โปรดติดตามประกาศตารางการฝึกอบรมรอบถัดไปจาก สพร.24 ยะลา</p>
                        <Link href="/" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-600">
                            <i className="fa-solid fa-arrow-left mr-1.5"></i> กลับหน้าหลัก
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course, index) => {
                            const percent = usedSeatsPercent(course);
                            const full = isFull(course);
                            const isSubmittingThis = bookingId === course.id;

                            return (
                                <motion.div
                                    key={course.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                    className="bg-slate-900/70 backdrop-blur-2xl border border-slate-700/60 hover:border-emerald-500/60 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] group"
                                >
                                    <div>
                                        {/* Card Top Badges */}
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                                                <i className="fa-solid fa-clock text-[10px]"></i>
                                                ระยะเวลา {course.durationDays} วัน
                                            </span>
                                            {full ? (
                                                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold border border-rose-500/30">
                                                    เต็มแล้ว
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                                                    เปิดรับสมัคร
                                                </span>
                                            )}
                                        </div>

                                        {/* Course Icon & Name */}
                                        <div className="flex items-start gap-3.5 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-xl shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                                                <i className="fa-solid fa-graduation-cap"></i>
                                            </div>
                                            <div>
                                                <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug group-hover:text-emerald-300 transition-colors">
                                                    {course.courseName}
                                                </h3>
                                                <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1">
                                                    <i className="fa-solid fa-building-columns text-[10px] text-emerald-400"></i>
                                                    {course.LocationName || "สพร.24 ยะลา"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Date Range Display */}
                                        <div className="flex items-center gap-2 text-xs text-slate-300 font-medium mb-3 bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-700/40">
                                            <i className="fa-regular fa-calendar-days text-emerald-400 text-sm"></i>
                                            <span>{formatDateRangeTh(course.Date, course.DateEnd)}</span>
                                        </div>

                                        {/* GPS Location Button */}
                                        <div className="mb-4">
                                            <a
                                                href={
                                                    course.LocationGPS?.startsWith("http")
                                                        ? course.LocationGPS
                                                        : course.LocationGPS
                                                            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(course.LocationGPS)}`
                                                            : "https://maps.app.goo.gl/brFvnbXxdL2M5cdk9"
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 hover:text-white border border-emerald-500/20 text-xs font-semibold transition-all active:scale-95"
                                            >
                                                <i className="fa-solid fa-map-location-dot text-emerald-400"></i>
                                                <span>📍 เปิดแผนที่ (GPS)</span>
                                                <i className="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-70"></i>
                                            </a>
                                        </div>

                                        {/* Dynamic Quota Progress Info (Green -> Orange -> Red) */}
                                        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/50 mb-5">
                                            <div className="flex justify-between text-xs font-bold mb-1.5">
                                                <span className="text-slate-400">จำนวนที่นั่งผู้สมัคร:</span>
                                                <span className={
                                                    percent >= 100
                                                        ? "text-rose-400 font-extrabold"
                                                        : percent >= 70
                                                            ? "text-amber-400 font-extrabold"
                                                            : "text-emerald-400 font-extrabold"
                                                }>
                                                    {course.currentQueue} / {course.maxSeats} คน ({percent}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        percent >= 100
                                                            ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_10px_#ef4444]"
                                                            : percent >= 70
                                                                ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_10px_#f59e0b]"
                                                                : "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_#10b981]"
                                                    }`}
                                                    style={{ width: `${Math.max(5, percent)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        type="button"
                                        disabled={full || isSubmittingThis}
                                        onClick={() => handleBooking(course.id, course.courseName)}
                                        className={`w-full py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                                            full
                                                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                                                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 hover:shadow-emerald-500/30"
                                        }`}
                                    >
                                        {isSubmittingThis ? (
                                            <><span className="loading loading-spinner loading-xs"></span> กำลังส่งคำขอ...</>
                                        ) : full ? (
                                            <><i className="fa-solid fa-lock"></i> ที่นั่งเต็มแล้ว</>
                                        ) : (
                                            <><i className="fa-solid fa-paper-plane"></i> จองคิว / สมัครฝึกอบรม</>
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
