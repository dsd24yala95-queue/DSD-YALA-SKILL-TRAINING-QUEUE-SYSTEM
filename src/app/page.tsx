"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [showLiveQueue, setShowLiveQueue] = useState(true);
    const [isWidgetMinimized, setIsWidgetMinimized] = useState(false);

    const [queueData, setQueueData] = useState({ count: 0, waitTime: 0 });
    const [systemStats, setSystemStats] = useState({ totalBookings: 0, completedTests: 0, activeCourses: 0, totalMembers: 0 });

    useEffect(() => {
        setMounted(true);
        const fetchQueueStats = async () => {
            try {
                const res = await fetch("/api/queues/stats");
                if (res.ok) {
                    const data = await res.json();
                    setQueueData(data);
                }
            } catch (error) {
                console.error("Failed to fetch queue stats", error);
            }
        };

        const fetchSystemStats = async () => {
            try {
                const res = await fetch("/api/system/stats");
                if (res.ok) {
                    const data = await res.json();
                    setSystemStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch system stats", error);
            }
        };

        fetchQueueStats();
        fetchSystemStats();
        // Refresh every 30 seconds
        const interval = setInterval(() => {
            fetchQueueStats();
            fetchSystemStats();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col pb-20 md:pb-0">
            
            {/* --- HERO SECTION --- */}
            <div className="relative bg-[#0F172A] overflow-hidden min-h-[90vh] md:min-h-[85vh] flex items-center pt-10">
                {/* Full Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image 
                        src="/bg1.png" 
                        alt="DSD Yala Building" 
                        fill 
                        className="object-cover object-center"
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1541888049876-2e8c25fba0b9?auto=format&fit=crop&q=80&w=2000' }}
                        priority
                    />
                    {/* Gradient Overlay to ensure text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/60 via-[#0F172A]/20 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/40 via-transparent to-transparent"></div>
                </div>

                {/* Pattern Overlay */}
                <div className="absolute inset-0 z-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                {/* Curved SVG at the bottom */}
                <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10" style={{ transform: 'translateY(1px)' }}>
                    <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 md:h-32 block">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C50.93,81.42,102.5,68,154.6,56.7,210.37,44.6,266.6,41,321.39,56.44Z" fill="#ffffff"></path>
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto w-full relative z-20 flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 pb-32">
                    
                    {/* Left Content */}
                    <div className="w-full md:w-[55%] pt-10 md:pt-0 flex flex-col justify-center text-left">
                        {/* Tag */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white mb-6 w-max backdrop-blur-md shadow-lg shadow-black/20">
                            <div className="w-2.5 h-2.5 bg-[#FBBF24] rounded-full shadow-[0_0_8px_#fbbf24]"></div>
                            ยินดีต้อนรับสู่ระบบ
                        </div>

                        {/* Headings */}
                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-1 drop-shadow-md">
                            สถาบันพัฒนาฝีมือแรงงาน
                        </h1>
                        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-6 drop-shadow-lg flex items-center gap-3">
                            <span className="text-white">24</span>
                            <span className="text-[#2563EB]">ยะลา</span>
                        </h2>

                        <p className="text-xs sm:text-base text-slate-300 mb-8 max-w-lg leading-relaxed drop-shadow">
                            ระบบรับสมัครและจองคิวการพัฒนาฝีมือแรงงาน เพื่อยกระดับทักษะและมาตรฐานแรงงานไทยสู่มาตรฐานสากล
                        </p>

                        {/* Buttons matching Mockup Image 2 */}
                        <div className="flex flex-col gap-3.5 w-full max-w-md">
                            {/* Card 1: สมัครฝึกอบรม */}
                            <Link href="/training" className="group relative flex items-center bg-gradient-to-r from-[#1D4ED8] to-[#1E40AF] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white rounded-2xl p-3.5 sm:p-4 transition-all duration-300 shadow-xl shadow-blue-950/40 hover:-translate-y-0.5 border border-blue-400/30">
                                <div className="w-12 h-12 rounded-xl bg-[#2563EB] text-white flex items-center justify-center text-xl shrink-0 shadow-md">
                                    <i className="fa-solid fa-graduation-cap"></i>
                                </div>
                                <div className="ml-3.5 flex-1 text-left">
                                    <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">สมัครฝึกอบรม</h3>
                                    <p className="text-xs text-blue-200/80 font-medium mt-0.5">หลักสูตรพัฒนาฝีมือ</p>
                                </div>
                                <i className="fa-solid fa-chevron-right text-white/80 text-lg mr-2 group-hover:translate-x-1 transition-transform"></i>
                            </Link>

                            {/* Card 2: ทดสอบมาตรฐานฝีมือ */}
                            <Link href="/testing" className="group relative flex items-center bg-gradient-to-r from-[#065F46] to-[#047857] hover:from-[#059669] hover:to-[#047857] text-white rounded-2xl p-3.5 sm:p-4 transition-all duration-300 shadow-xl shadow-emerald-950/40 hover:-translate-y-0.5 border border-emerald-400/30">
                                <div className="w-12 h-12 rounded-xl bg-[#10B981] text-white flex items-center justify-center text-xl shrink-0 shadow-md">
                                    <i className="fa-solid fa-clipboard-check"></i>
                                </div>
                                <div className="ml-3.5 flex-1 text-left">
                                    <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">ทดสอบมาตรฐานฝีมือ</h3>
                                    <p className="text-xs text-emerald-200/80 font-medium mt-0.5">ตรวจสอบมาตรฐานฝีมือ</p>
                                </div>
                                <i className="fa-solid fa-chevron-right text-white/80 text-lg mr-2 group-hover:translate-x-1 transition-transform"></i>
                            </Link>
                        </div>

                        {/* Admin Link */}
                        <div className="mt-8 flex flex-col items-center max-w-md">
                            <div className="flex items-center gap-4 w-full mb-4 opacity-50">
                                <div className="h-px bg-slate-500 flex-1"></div>
                                <span className="text-xs text-slate-300 uppercase tracking-widest drop-shadow">สำหรับเจ้าหน้าที่</span>
                                <div className="h-px bg-slate-500 flex-1"></div>
                            </div>
                            <Link href="/login/admin" className="text-slate-300 hover:text-white text-sm font-semibold flex items-center gap-2 transition-colors drop-shadow">
                                <i className="fa-solid fa-user-shield"></i> เข้าสู่ระบบ Admin
                            </Link>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="w-full md:w-[40%] flex justify-center md:justify-end mt-12 md:mt-0">
                    </div>
                </div>
            </div>

            {/* --- STATS BANNER (Floating Pill) --- */}
            <div className="relative z-30 flex justify-center -mt-8 md:-mt-24 px-4">
                <div className="bg-white rounded-[2rem] md:rounded-full shadow-2xl shadow-slate-200/50 p-6 md:p-8 w-full max-w-5xl border border-slate-100 grid grid-cols-2 md:flex md:flex-row items-center justify-between gap-6 md:gap-4 divide-y-0 md:divide-y-0 md:divide-x divide-slate-100">
                    
                    <div className="flex flex-col items-center justify-center w-full pt-4 md:pt-0 first:pt-0">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl mb-3">
                            <i className="fa-solid fa-users"></i>
                        </div>
                        <span className="text-3xl font-black text-slate-800">{systemStats.totalBookings}</span>
                        <div className="text-slate-500 text-xs font-semibold mt-1">ผู้มาจองคิวทั้งหมด</div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center w-full pt-4 md:pt-0">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl mb-3">
                            <i className="fa-solid fa-clipboard-check"></i>
                        </div>
                        <span className="text-3xl font-black text-slate-800">{systemStats.completedTests}</span>
                        <div className="text-slate-500 text-xs font-semibold mt-1">ผู้ผ่านการทดสอบ</div>
                    </div>

                    <div className="flex flex-col items-center justify-center w-full pt-4 md:pt-0">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl mb-3">
                            <i className="fa-solid fa-book-open"></i>
                        </div>
                        <span className="text-3xl font-black text-slate-800">{systemStats.activeCourses}</span>
                        <div className="text-slate-500 text-xs font-semibold mt-1">หลักสูตรที่เปิดรับ</div>
                    </div>

                    <div className="flex flex-col items-center justify-center w-full pt-4 md:pt-0">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl mb-3">
                            <i className="fa-solid fa-address-card"></i>
                        </div>
                        <span className="text-3xl font-black text-slate-800">{systemStats.totalMembers}</span>
                        <div className="text-slate-500 text-xs font-semibold mt-1">สมาชิกในระบบ</div>
                    </div>

                </div>
            </div>

            {/* --- SERVICES SECTION --- */}
            <div className="bg-white py-24 relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center mb-16 flex flex-col items-center">
                        <span className="text-[#3B82F6] text-xs font-bold uppercase tracking-widest mb-3">
                            บริการของเรา
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
                            บริการครบครัน ตอบโจทย์ทุกความต้องการ
                        </h2>
                        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
                            เรามุ่งเน้นพัฒนาคุณภาพแรงงานไทย สู่มาตรฐานสากล
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {/* Card 1: ฝึกอบรม -> Login */}
                        <Link href="/login" className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-lg md:text-2xl mb-4 md:mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-graduation-cap"></i>
                            </div>
                            <h3 className="font-black text-base md:text-xl text-slate-800 mb-2 md:mb-3 flex items-center justify-between">
                                ฝึกอบรม
                                <i className="fa-solid fa-arrow-right text-xs md:text-sm text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"></i>
                            </h3>
                            <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-2 md:mb-6 flex-1">
                                ค้นหาหลักสูตรและสมัครเข้าร่วมฝึกอบรม
                            </p>
                        </Link>

                        {/* Card 2: ทดสอบมาตรฐาน -> Login */}
                        <Link href="/login" className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-500 text-white flex items-center justify-center text-lg md:text-2xl mb-4 md:mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-clipboard-check"></i>
                            </div>
                            <h3 className="font-black text-base md:text-xl text-slate-800 mb-2 md:mb-3 flex items-center justify-between">
                                ทดสอบมาตรฐาน
                                <i className="fa-solid fa-arrow-right text-xs md:text-sm text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"></i>
                            </h3>
                            <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-2 md:mb-6 flex-1">
                                ตรวจสอบและจองคิวการทดสอบมาตรฐาน
                            </p>
                        </Link>

                        {/* Card 3: ข่าวสาร -> /news */}
                        <Link href="/news" className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-purple-500 text-white flex items-center justify-center text-lg md:text-2xl mb-4 md:mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                                <i className="fa-regular fa-newspaper"></i>
                            </div>
                            <h3 className="font-black text-base md:text-xl text-slate-800 mb-2 md:mb-3 flex items-center justify-between">
                                ข่าวสาร
                                <i className="fa-solid fa-arrow-right text-xs md:text-sm text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all"></i>
                            </h3>
                            <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-2 md:mb-6 flex-1">
                                ติดตามข่าวสารประกาศสำคัญ สพร.24
                            </p>
                        </Link>

                        {/* Card 4: ติดต่อเรา -> /contact */}
                        <Link href="/contact" className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-orange-500 text-white flex items-center justify-center text-lg md:text-2xl mb-4 md:mb-6 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-headset"></i>
                            </div>
                            <h3 className="font-black text-base md:text-xl text-slate-800 mb-2 md:mb-3 flex items-center justify-between">
                                ติดต่อเรา
                                <i className="fa-solid fa-arrow-right text-xs md:text-sm text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"></i>
                            </h3>
                            <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-2 md:mb-6 flex-1">
                                ช่องทางการติดต่อสอบถามข้อมูล
                            </p>
                        </Link>
                    </div>
                </div>
            </div>

            {/* --- FLOATING LIVE QUEUE WIDGET (Top Stacking Layer z-[9999]) --- */}
            {showLiveQueue && (
                isWidgetMinimized ? (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => setIsWidgetMinimized(false)}
                        className="fixed z-[9999] bottom-20 md:bottom-6 right-4 bg-[#1e293b]/95 backdrop-blur-xl border border-white/20 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 group hover:bg-[#0f172a] transition-all"
                    >
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                        <span className="text-xs font-bold text-emerald-400 tracking-wider">LIVE QUEUE ({queueData.count} คิว)</span>
                        <i className="fa-solid fa-chevron-up text-xs text-slate-400 group-hover:text-white transition-transform"></i>
                    </motion.button>
                ) : (
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="fixed z-[9999] bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 flex items-center justify-between gap-3"
                    >
                        {/* Live Queue Container Box */}
                        <div className="bg-[#0B1528]/95 backdrop-blur-2xl border border-blue-500/30 rounded-3xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex-1 max-w-md">
                            <div className="flex items-center justify-between mb-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]"></div>
                                    <span className="font-extrabold text-emerald-400 tracking-wider">LIVE QUEUE</span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                    อัพเดต {mounted ? new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "14:35"} น.
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Stat 1: คิวรอทดสอบ */}
                                <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center text-lg shrink-0">
                                        <i className="fa-solid fa-users"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold">คิวรอทดสอบ</p>
                                        <p className="text-xl font-black text-white leading-tight">
                                            {queueData.count} <span className="text-xs font-bold text-slate-400">คิว</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Stat 2: เวลารอเฉลี่ย */}
                                <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center text-lg shrink-0">
                                        <i className="fa-regular fa-clock"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold">เวลารอเฉลี่ย</p>
                                        <p className="text-xl font-black text-white leading-tight">
                                            {queueData.waitTime || 15} <span className="text-xs font-bold text-slate-400">นาที</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Action Button: ดูคิวทั้งหมด */}
                        <Link
                            href="/booking"
                            className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] text-white px-5 py-4 sm:py-5 rounded-3xl font-extrabold text-xs sm:text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2.5 transition-all duration-300 active:scale-95 border border-blue-400/40 shrink-0"
                        >
                            <i className="fa-solid fa-ticket text-lg text-amber-300"></i>
                            <span className="whitespace-nowrap">ดูคิวทั้งหมด</span>
                        </Link>
                    </motion.div>
                )
            )}
        </div>
    );
}
