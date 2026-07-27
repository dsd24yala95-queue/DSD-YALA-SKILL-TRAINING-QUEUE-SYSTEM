"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[url('/bg.png')] bg-cover bg-center py-12 md:py-20">
            {/* Transparent Glass Curtain (ม่านใส) for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/30 to-transparent dark:from-[#0B3C74]/85 dark:via-[#0B3C74]/40 dark:to-transparent backdrop-blur-[1.5px] transition-colors duration-500 z-0"></div>
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.01] bg-grid-pattern bg-repeat z-0" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left Content */}
                    <div className="lg:col-span-7 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B3C74]/5 dark:bg-white/5 border border-[#0B3C74]/10 dark:border-white/10 text-[#0B3C74] dark:text-white/90 text-xs sm:text-sm mb-6 shadow-inner backdrop-blur-md">
                                <i className="fa-solid fa-wand-magic-sparkles text-yellow-500 dark:text-yellow-300 animate-pulse"></i>
                                <span className="font-semibold tracking-wider text-[10px] sm:text-xs">DSD YALA SKILL QUEUE SYSTEM</span>
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#0B3C74] dark:text-white leading-tight mb-4 tracking-tight"
                        >
                            สถาบันพัฒนาฝีมือแรงงาน
                            <br />
                            <span className="text-[#2563EB] dark:text-gradient-gold">24 ยะลา</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-base sm:text-lg text-slate-700 dark:text-blue-200/80 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed font-sans"
                        >
                            ระบบรับสมัครและจองคิวการพัฒนาฝีมือแรงงาน เพื่อยกระดับทักษะและมาตรฐานแรงงานไทยสู่ระดับสากลด้วยเทคโนโลยีดิจิทัลอัจฉริยะ
                        </motion.p>


                        {/* Core CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 mb-8"
                        >
                            <Link
                                href="/booking"
                                className="group p-4 rounded-2xl bg-[#0B3C74] hover:bg-[#002244] text-white hover:shadow-[0_0_20px_rgba(11,60,116,0.3)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 border border-white/10 text-left flex flex-col justify-between h-28"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <i className="fa-solid fa-chalkboard-user text-yellow-300 text-sm"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm sm:text-base">ฝึกอบรม</h4>
                                    <p className="text-[10px] text-blue-200/80">หลักสูตรพัฒนาฝีมือ</p>
                                </div>
                            </Link>

                            <Link
                                href="/booking"
                                className="group p-4 rounded-2xl bg-white/20 dark:bg-white/5 hover:bg-white/30 border border-[#0B3C74]/20 dark:border-white/10 text-[#0B3C74] dark:text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-95 text-left flex flex-col justify-between h-28 backdrop-blur-md shadow-sm"
                            >
                                <div className="w-8 h-8 rounded-lg bg-[#0B3C74]/10 dark:bg-white/10 flex items-center justify-center">
                                    <i className="fa-solid fa-certificate text-yellow-600 dark:text-yellow-300 text-sm"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm sm:text-base">ทดสอบมาตรฐาน</h4>
                                    <p className="text-[10px] text-slate-500 dark:text-blue-200/80">ตรวจสอบมาตรฐานฝีมือ</p>
                                </div>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Right Content: Floating Queue Widget overlaying the building in the background image */}
                    <div className="lg:col-span-5 flex items-center justify-center lg:justify-end perspective-1000">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, rotateY: 5 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ duration: 0.8, type: "spring" }}
                            className="relative w-full max-w-sm transform-style-3d hover:rotate-y-[-8deg] hover:rotate-x-[5deg] transition-all duration-700 mt-10 lg:mt-0"
                        >
                            {/* Floating Glassmorphism Queue Dashboard */}
                            <div className="p-6 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 shadow-2xl backdrop-blur-xl text-[#0B3C74] dark:text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                                        </span>
                                        <span className="text-[10px] tracking-widest text-emerald-600 dark:text-emerald-400 font-bold uppercase">LIVE QUEUE</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 dark:text-blue-200">สพร.24 ยะลา</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl">
                                        <span className="text-[10px] text-slate-500 dark:text-blue-200 block mb-0.5">คิวรอทดสอบ</span>
                                        <span className="text-xl font-bold font-heading">12 <span className="text-xs font-normal text-slate-500 dark:text-blue-300">คิว</span></span>
                                    </div>
                                    <div className="p-3 bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl">
                                        <span className="text-[10px] text-slate-500 dark:text-blue-200 block mb-0.5">เวลารอเฉลี่ย</span>
                                        <span className="text-xl font-bold font-heading">15 <span className="text-xs font-normal text-slate-500 dark:text-blue-300">นาที</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative badge */}
                            <div className="absolute -top-6 -right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg border border-white/20">
                                <i className="fa-solid fa-bell text-white text-xl animate-bounce"></i>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Bottom wave */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 120V60C240 20 480 0 720 20C960 40 1200 60 1440 40V120H0Z" fill="currentColor" className="text-base-200 dark:text-base-300" />
                </svg>
            </div>
        </section>
    );
}