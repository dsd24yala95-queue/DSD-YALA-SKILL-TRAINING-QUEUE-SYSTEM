"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createQueueBooking, getActiveCourses, getActiveBranches, MasterCourse, MasterBranch } from "@/lib/services/db-service";
import { toast } from "sonner";

type BookingType = "test" | "training" | null;

export default function BookingPage() {
    const searchParams = useSearchParams();
    const initialTypeParam = searchParams.get("type");
    const [selectedType, setSelectedType] = useState<BookingType>(
        initialTypeParam === "test" || initialTypeParam === "training" ? initialTypeParam : null
    );
    const router = useRouter();
    const { user, profile } = useAuth();
    const [bookingInProgress, setBookingInProgress] = useState(false);

    const [courses, setCourses] = useState<MasterCourse[]>([]);
    const [branches, setBranches] = useState<MasterBranch[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        const typeInUrl = searchParams.get("type");
        if (typeInUrl === "test" || typeInUrl === "training") {
            setSelectedType(typeInUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        async function loadMasterData() {
            try {
                const [c, b] = await Promise.all([getActiveCourses(), getActiveBranches()]);
                setCourses(c);
                setBranches(b);
            } catch {
                toast.error("ไม่สามารถโหลดข้อมูลบริการได้");
            } finally {
                setDataLoading(false);
            }
        }
        loadMasterData();
    }, []);

    const handleBooking = async (type: "test" | "training", itemId: string, itemName: string) => {
        if (!user) {
            toast.info("กรุณาเข้าสู่ระบบก่อนดำเนินการจองคิว");
            const targetUrl = `/booking?type=${type}&id=${itemId}`;
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
            setBookingInProgress(true);
            toastId = toast.loading("กำลังดำเนินการส่งคำขอจองคิว...");
            await createQueueBooking(targetUserId, type, itemId, itemName);
            toast.success("บันทึกคำขอจองคิวสำเร็จแล้ว! กรุณารอการตรวจสอบ", { id: toastId });
            router.push("/profile");
        } catch (error: any) {
            console.error("Booking error:", error);
            toast.error(error.message || "เกิดข้อผิดพลาดในการจองคิว กรุณาลองใหม่อีกครั้ง", { id: toastId });
        } finally {
            setBookingInProgress(false);
        }
    };

    const usedSeatsPercent = (course: MasterCourse) =>
        course.maxSeats > 0 ? Math.round((course.currentQueue / course.maxSeats) * 100) : 0;

    const isFull = (course: MasterCourse) => course.currentQueue >= course.maxSeats;

    return (
        <div className="relative min-h-screen bg-[#0F172A] text-white py-12 px-4 overflow-hidden">
            {/* Background elements */}
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

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-white/20 animate-pulse-glow">
                        <i className="fa-solid fa-calendar-check text-white text-3xl"></i>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gradient-gold">จองคิว / สมัครบริการ</h1>
                    <p className="text-blue-200/60 mt-2 text-sm sm:text-base">เลือกประเภทบริการที่สอดคล้องกับความต้องการพัฒนาฝีมือของคุณ</p>
                </div>

                {/* Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`relative p-8 rounded-3xl border cursor-pointer transition-all duration-500 overflow-hidden group ${selectedType === "test"
                                ? "border-[#2563EB] bg-[#2563EB]/15 shadow-[0_0_30px_rgba(37,99,235,0.25)]"
                                : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10 backdrop-blur-md"
                            }`}
                        onClick={() => setSelectedType("test")}
                    >
                        <div className="absolute inset-0 opacity-[0.02] bg-noise mix-blend-overlay"></div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform">
                            <i className="fa-solid fa-certificate text-white text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">ทดสอบมาตรฐานฝีมือ</h3>
                        <p className="text-sm text-blue-200/70 leading-relaxed">
                            ทดสอบมาตรฐานฝีมือแรงงานแห่งชาติ รับรองทักษะอาชีพของท่านตามเกณฑ์ระดับสากล
                        </p>
                        {selectedType === "test" && (
                            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center shadow-md">
                                <i className="fa-solid fa-check text-white text-xs"></i>
                            </div>
                        )}
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-400/20">
                                {branches.length} สาขาเปิดรับ
                            </span>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`relative p-8 rounded-3xl border cursor-pointer transition-all duration-500 overflow-hidden group ${selectedType === "training"
                                ? "border-purple-500 bg-purple-500/15 shadow-[0_0_30px_rgba(168,85,247,0.25)]"
                                : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10 backdrop-blur-md"
                            }`}
                        onClick={() => setSelectedType("training")}
                    >
                        <div className="absolute inset-0 opacity-[0.02] bg-noise mix-blend-overlay"></div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform">
                            <i className="fa-solid fa-chalkboard-user text-white text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">ฝึกอบรมพัฒนาทักษะ</h3>
                        <p className="text-sm text-blue-200/70 leading-relaxed">
                            เรียนรู้ทักษะเพิ่มความรู้ใหม่ๆ เพื่อนำไปพัฒนาอาชีพและเพิ่มรายได้ในยุค 2026
                        </p>
                        {selectedType === "training" && (
                            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shadow-md">
                                <i className="fa-solid fa-check text-white text-xs"></i>
                            </div>
                        )}
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-400/20">
                                {courses.length} หลักสูตรเปิดรับ
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Content area with transitions */}
                <AnimatePresence mode="wait">
                    {dataLoading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
                            <span className="loading loading-spinner loading-md text-blue-400"></span>
                            <p className="text-blue-200/60 text-sm mt-3">กำลังโหลดข้อมูลบริการ...</p>
                        </motion.div>
                    ) : selectedType === "test" && (
                        <motion.div
                            key="test"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <i className="fa-solid fa-square-poll-horizontal text-blue-400"></i>
                                เลือกสาขาที่ต้องการทดสอบมาตรฐาน
                            </h2>
                            {branches.length === 0 ? (
                                <div className="text-center py-10 text-blue-200/50">
                                    <i className="fa-solid fa-folder-open text-3xl mb-3 block"></i>
                                    <p className="text-sm">ยังไม่มีสาขาทดสอบที่เปิดรับในขณะนี้</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {branches.map((branch) => (
                                        <div
                                            key={branch.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white/5 hover:bg-[#2563EB]/10 border border-white/5 hover:border-[#2563EB]/30 transition-all gap-4 group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10">
                                                    <i className="fa-solid fa-wrench text-blue-300"></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-base group-hover:text-blue-300 transition-colors">{branch.branchName}</h4>
                                                    <p className="text-xs text-blue-200/50 flex flex-wrap items-center gap-1">
                                                        <span>ระดับ {branch.levels}</span>
                                                        <span>• คิวสูงสุด {branch.maxQueue}</span>
                                                        {branch.LocationName && <span>• {branch.LocationName}</span>}
                                                        {branch.LocationGPS && (
                                                            <a href={`https://www.google.com/maps/search/?api=1&query=${branch.LocationGPS}`} target="_blank" rel="noreferrer" className="ml-1 text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 font-semibold" onClick={(e) => e.stopPropagation()}>
                                                                <i className="fa-solid fa-map-location-dot"></i> แผนที่
                                                            </a>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleBooking("test", branch.id, branch.branchName)}
                                                disabled={bookingInProgress}
                                                className="btn rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 border-0 text-white font-bold px-6 py-2.5 shadow-md hover:shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all text-sm w-full sm:w-auto"
                                            >
                                                {bookingInProgress ? "กำลังส่ง..." : "จองคิวสอบ"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {!dataLoading && selectedType === "training" && (
                        <motion.div
                            key="training"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <i className="fa-solid fa-book-bookmark text-purple-400"></i>
                                เลือกหลักสูตรฝึกอบรมที่เปิดรับสมัคร
                            </h2>
                            {courses.length === 0 ? (
                                <div className="text-center py-10 text-blue-200/50">
                                    <i className="fa-solid fa-folder-open text-3xl mb-3 block"></i>
                                    <p className="text-sm">ยังไม่มีหลักสูตรที่เปิดรับสมัครในขณะนี้</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {courses.map((course) => {
                                        const pct = usedSeatsPercent(course);
                                        const full = isFull(course);
                                        return (
                                            <div
                                                key={course.id}
                                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all gap-4 group ${full ? "bg-white/3 border-white/5 opacity-60" : "bg-white/5 hover:bg-purple-500/10 border-white/5 hover:border-purple-500/30"}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                                                        <i className="fa-solid fa-book text-purple-300"></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">{course.courseName}</h4>
                                                        <p className="text-xs text-blue-200/50 flex flex-wrap items-center gap-1">
                                                            <span>{course.durationDays} วัน</span>
                                                            {course.Date && <span>• {course.Date}</span>}
                                                            {course.LocationName && <span>• {course.LocationName}</span>}
                                                            {course.LocationGPS && (
                                                                <a href={`https://www.google.com/maps/search/?api=1&query=${course.LocationGPS}`} target="_blank" rel="noreferrer" className="ml-1 text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1 font-semibold" onClick={(e) => e.stopPropagation()}>
                                                                    <i className="fa-solid fa-map-location-dot"></i> แผนที่
                                                                </a>
                                                            )}
                                                        </p>
                                                        {/* Seat progress */}
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${full ? "bg-red-500" : pct >= 80 ? "bg-amber-400" : "bg-emerald-400"}`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] text-blue-200/50">
                                                                {course.currentQueue}/{course.maxSeats} ที่นั่ง
                                                                {full && " (เต็ม)"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => !full && handleBooking("training", course.id, course.courseName)}
                                                    disabled={bookingInProgress || full}
                                                    className={`btn rounded-xl border-0 text-white font-bold px-6 py-2.5 shadow-md transition-all text-sm w-full sm:w-auto ${full ? "bg-white/10 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-purple-500/20 hover:scale-105 active:scale-95"}`}
                                                >
                                                    {full ? "เต็มแล้ว" : bookingInProgress ? "กำลังส่ง..." : "สมัครอบรม"}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {!dataLoading && !selectedType && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl"
                        >
                            <div className="text-5xl mb-4 animate-bounce">👆</div>
                            <p className="text-blue-200/60 text-sm sm:text-base font-sans">กรุณากดเลือกบริการด้านบนเพื่อแสดงสาขาหลักสูตร</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}