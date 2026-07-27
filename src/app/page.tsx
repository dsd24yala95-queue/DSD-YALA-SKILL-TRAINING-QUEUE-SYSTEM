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
        <div className="min-h-screen bg-white font-sans flex flex-col">
            
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
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white mb-6 w-max backdrop-blur-sm shadow-lg shadow-black/20">
                            <div className="w-2 h-2 bg-[#FBBF24] rounded-full shadow-[0_0_8px_#fbbf24]"></div>
                            DSD YALA SKILL QUEUE SYSTEM
                        </div>

                        {/* Headings */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-2 drop-shadow-md">
                            สถาบันพัฒนาฝีมือแรงงาน
                        </h1>
                        <h2 className="text-5xl lg:text-7xl font-black text-[#3B82F6] mb-6 drop-shadow-lg">
                            24 ยะลา
                        </h2>

                        <p className="text-sm md:text-base text-slate-300 mb-10 max-w-lg leading-relaxed drop-shadow">
                            ระบบรับสมัครและจองคิวการพัฒนาฝีมือแรงงาน เพื่อยกระดับทักษะและมาตรฐานแรงงานไทยสู่ระดับสากลด้วยเทคโนโลยีดิจิทัลอัจฉริยะ
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-col gap-4 w-full max-w-md">
                            <Link href="/login" className="group relative flex items-center bg-slate-900/70 backdrop-blur-2xl border border-slate-700/60 hover:border-blue-500/60 text-white rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] hover:-translate-y-0.5">
                                <div className="p-4 bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                                    <i className="fa-solid fa-clipboard-check text-2xl text-blue-100 group-hover:scale-110 transition-transform duration-300"></i>
                                </div>
                                <div className="px-6 py-4 flex-1 flex items-center justify-between">
                                    <div className="text-left">
                                        <div className="font-bold text-sm md:text-base flex items-center gap-2 text-white group-hover:text-blue-200 transition-colors">
                                            ทดสอบมาตรฐานฝีมือ <span className="bg-red-500/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full leading-none uppercase shadow-sm shadow-red-500/50 animate-pulse">HOT</span>
                                        </div>
                                        <div className="text-[10px] md:text-xs text-slate-400 font-semibold tracking-wider uppercase mt-1">Skills Testing</div>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-slate-500 group-hover:text-blue-400 transition-all duration-300 group-hover:translate-x-1.5 text-lg"></i>
                                </div>
                            </Link>

                            <Link href="/login" className="group relative flex items-center bg-slate-900/70 backdrop-blur-2xl border border-slate-700/60 hover:border-emerald-500/60 text-white rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:-translate-y-0.5">
                                <div className="p-4 bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                                    <i className="fa-solid fa-graduation-cap text-2xl text-emerald-100 group-hover:scale-110 transition-transform duration-300"></i>
                                </div>
                                <div className="px-6 py-4 flex-1 flex items-center justify-between">
                                    <div className="text-left">
                                        <div className="font-bold text-sm md:text-base flex items-center gap-2 text-white group-hover:text-emerald-200 transition-colors">
                                            สมัครฝึกอบรมอาชีพ <span className="bg-emerald-500/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full leading-none uppercase shadow-sm shadow-emerald-500/50 animate-pulse">AVAILABLE</span>
                                        </div>
                                        <div className="text-[10px] md:text-xs text-slate-400 font-semibold tracking-wider uppercase mt-1">Training Courses</div>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-slate-500 group-hover:text-emerald-400 transition-all duration-300 group-hover:translate-x-1.5 text-lg"></i>
                                </div>
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
            <div className="relative z-30 flex justify-center -mt-24 px-4">
                <div className="bg-white rounded-[2rem] md:rounded-full shadow-2xl shadow-slate-200/50 p-6 md:p-8 w-full max-w-5xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Card 1: ฝึกอบรม -> Login */}
                        <Link href="/login" className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-graduation-cap"></i>
                            </div>
                            <h3 className="font-black text-xl text-slate-800 mb-3 flex items-center justify-between">
                                ฝึกอบรม
                                <i className="fa-solid fa-arrow-right text-sm text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"></i>
                            </h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                                ค้นหาหลักสูตรและสมัครเข้าร่วมการฝึกอบรมพัฒนาฝีมือ
                            </p>
                        </Link>

                        {/* Card 2: ทดสอบมาตรฐาน -> Login */}
                        <Link href="/login" className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-2xl mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-clipboard-check"></i>
                            </div>
                            <h3 className="font-black text-xl text-slate-800 mb-3 flex items-center justify-between">
                                ทดสอบมาตรฐาน
                                <i className="fa-solid fa-arrow-right text-sm text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"></i>
                            </h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                                ตรวจสอบและจองคิวการทดสอบมาตรฐานฝีมือแรงงาน
                            </p>
                        </Link>

                        {/* Card 3: ข่าวสาร -> /news */}
                        <Link href="/news" className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500 text-white flex items-center justify-center text-2xl mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                                <i className="fa-regular fa-newspaper"></i>
                            </div>
                            <h3 className="font-black text-xl text-slate-800 mb-3 flex items-center justify-between">
                                ข่าวสาร
                                <i className="fa-solid fa-arrow-right text-sm text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all"></i>
                            </h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                                ติดตามข่าวสารและประกาศสำคัญจาก สพร.24 ยะลา
                            </p>
                        </Link>

                        {/* Card 4: ติดต่อเรา -> /contact */}
                        <Link href="/contact" className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer">
                            <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-2xl mb-6 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-headset"></i>
                            </div>
                            <h3 className="font-black text-xl text-slate-800 mb-3 flex items-center justify-between">
                                ติดต่อเรา
                                <i className="fa-solid fa-arrow-right text-sm text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"></i>
                            </h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                                ช่องทางการติดต่อและสอบถามข้อมูลเพิ่มเติม
                            </p>
                        </Link>
                    </div>
                </div>
            </div>

            {/* --- FLOATING LIVE QUEUE WIDGET (Top Stacking Layer z-[9999]) --- */}
            {showLiveQueue && (
                <motion.div 
                    drag
                    className="fixed z-[9999] bottom-6 right-6 bg-[#1e293b]/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.6)] w-full max-w-[320px] cursor-grab active:cursor-grabbing"
                >
                    {/* Bell Icon overlapping top right */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#FBBF24] rounded-full flex items-center justify-center shadow-lg text-[#0F172A] text-xl z-[10000] animate-bounce shadow-[#FBBF24]/40">
                        <i className="fa-solid fa-bell"></i>
                    </div>

                    <button 
                        onClick={() => setShowLiveQueue(false)}
                        className="absolute top-4 right-4 w-8 h-8 text-slate-400 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white transition-all z-[10000]"
                        aria-label="Close"
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                    
                    <div className="flex items-center justify-between mb-6 pr-8 cursor-move">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                            <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">LIVE QUEUE</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 divide-x divide-white/10">
                        <div>
                            <div className="text-xs text-slate-400 mb-2 font-medium">คิวรอทดสอบ</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white">{queueData.count}</span>
                                <span className="text-sm text-slate-400">คน</span>
                            </div>
                        </div>
                        <div className="pl-6">
                            <div className="text-xs text-slate-400 mb-2 font-medium">เวลาคิวเฉลี่ย</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white">{queueData.waitTime}</span>
                                <span className="text-sm text-slate-400">นาที</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10 text-right">
                        <span className="text-[10px] text-slate-400 font-medium tracking-widest">สพร.24 ยะลา</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
