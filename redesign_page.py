import os

page_content = """"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            
            {/* --- HERO SECTION --- */}
            <div className="relative bg-white overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#0B3C74 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
                
                {/* Decorative Shapes */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 z-0"></div>
                <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50 z-0"></div>

                <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center">
                    
                    {/* Left Content */}
                    <div className="w-full lg:w-1/2 pt-16 pb-12 px-6 lg:px-8 lg:py-32 flex flex-col justify-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#0B3C74] leading-tight tracking-tight mb-4 drop-shadow-sm">
                            DSD YALA
                            <br />
                            <span className="text-[#1E4D94]">SKILL QUEUE SYSTEM</span>
                        </h1>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                            <div className="w-10 h-1 bg-[#FBBF24] rounded-full"></div>
                            สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา
                        </h2>
                        <p className="text-base md:text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
                            ระบบรับสมัครและจองคิวการพัฒนาฝีมือแรงงาน 
                            เพื่อยกระดับทักษะและมาตรฐานแรงงานไทย 
                            สะดวกรวดเร็ว ผ่านระบบออนไลน์
                        </p>
                        
                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/booking?type=training" className="group relative flex items-center bg-[#0B3C74] text-white rounded-2xl overflow-hidden shadow-xl shadow-[#0B3C74]/20 hover:shadow-2xl hover:shadow-[#0B3C74]/30 hover:-translate-y-1 transition-all duration-300">
                                <div className="p-4 bg-white/10 group-hover:bg-white/20 transition-colors">
                                    <i className="fa-solid fa-graduation-cap text-3xl"></i>
                                </div>
                                <div className="px-6 py-3 flex-1 flex items-center justify-between">
                                    <div className="text-left">
                                        <div className="font-black text-lg">ฝึกอบรม</div>
                                        <div className="text-xs text-blue-200">หลักสูตรพัฒนาฝีมือ</div>
                                    </div>
                                    <i className="fa-solid fa-arrow-right ml-4 text-white/70 group-hover:text-white transition-colors group-hover:translate-x-1"></i>
                                </div>
                            </Link>

                            <Link href="/booking?type=test" className="group relative flex items-center bg-white text-[#0B3C74] border-2 border-[#0B3C74]/10 hover:border-[#0B3C74] rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="p-4 bg-blue-50 group-hover:bg-blue-100 transition-colors text-[#1E4D94]">
                                    <i className="fa-solid fa-clipboard-check text-3xl"></i>
                                </div>
                                <div className="px-6 py-3 flex-1 flex items-center justify-between">
                                    <div className="text-left">
                                        <div className="font-black text-lg text-slate-800">ทดสอบมาตรฐาน</div>
                                        <div className="text-xs text-slate-500">ตรวจสอบมาตรฐานฝีมือ</div>
                                    </div>
                                    <i className="fa-solid fa-arrow-right ml-4 text-slate-400 group-hover:text-[#0B3C74] transition-colors group-hover:translate-x-1"></i>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Right Image (Building) */}
                    <div className="w-full lg:w-1/2 h-[400px] lg:h-[700px] relative hidden md:block">
                        <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent z-10 w-32"></div>
                        <div className="h-full w-full relative" style={{ clipPath: 'polygon(15% 0, 100% 0%, 100% 100%, 0 100%)' }}>
                            <Image 
                                src="/bg1.png" 
                                alt="DSD Yala Building" 
                                fill 
                                className="object-cover object-center"
                                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1541888049876-2e8c25fba0b9?auto=format&fit=crop&q=80&w=2000' }}
                            />
                            {/* Blue overlay tint */}
                            <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SERVICES SECTION --- */}
            <div className="bg-slate-50 py-20 relative z-20 -mt-10 lg:-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center mb-10">
                        <span className="bg-white px-6 py-2 rounded-full shadow-sm text-sm font-bold text-[#0B3C74] border border-blue-100 uppercase tracking-widest">
                            บริการของเรา
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Card 1 */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col group">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1E4D94] flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:bg-[#1E4D94] group-hover:text-white transition-all">
                                <i className="fa-solid fa-graduation-cap"></i>
                            </div>
                            <h3 className="font-black text-xl text-slate-800 mb-3">ฝึกอบรม</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                                ค้นหาหลักสูตรและสมัครเข้าร่วมการฝึกอบรมพัฒนาฝีมือ เพื่อต่อยอดอาชีพ
                            </p>
                            <Link href="/booking?type=training" className="text-[#1E4D94] font-bold text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                                ดูหลักสูตรทั้งหมด <i className="fa-solid fa-arrow-right text-xs"></i>
                            </Link>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col group">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <i className="fa-solid fa-clipboard-list"></i>
                            </div>
                            <h3 className="font-black text-xl text-slate-800 mb-3">ทดสอบมาตรฐาน</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                                ตรวจสอบและจองคิวการทดสอบมาตรฐานฝีมือแรงงาน ตามสาขาอาชีพ
                            </p>
                            <Link href="/booking?type=test" className="text-indigo-600 font-bold text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                                ดูประเภทการทดสอบ <i className="fa-solid fa-arrow-right text-xs"></i>
                            </Link>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col group">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <i className="fa-regular fa-newspaper"></i>
                            </div>
                            <h3 className="font-black text-xl text-slate-800 mb-3">ข่าวสาร</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                                ติดตามข่าวสารและประกาศสำคัญจาก สพร.24 ยะลา ได้ที่นี่
                            </p>
                            <Link href="#" className="text-emerald-600 font-bold text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                                อ่านข่าวทั้งหมด <i className="fa-solid fa-arrow-right text-xs"></i>
                            </Link>
                        </div>

                        {/* Card 4 */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col group">
                            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all">
                                <i className="fa-solid fa-headset"></i>
                            </div>
                            <h3 className="font-black text-xl text-slate-800 mb-3">ติดต่อเรา</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                                ช่องทางการติดต่อและสอบถามข้อมูลเพิ่มเติม กับเจ้าหน้าที่โดยตรง
                            </p>
                            <Link href="#footer" className="text-rose-600 font-bold text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                                ดูข้อมูลการติดต่อ <i className="fa-solid fa-arrow-right text-xs"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- STATS BANNER --- */}
            <div className="bg-[#153e75] text-white py-12 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-16"></div>
                <div className="absolute top-0 left-0 w-32 h-full bg-white/5 -skew-x-12 -translate-x-16"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
                        
                        <div className="text-center px-4">
                            <div className="flex justify-center items-center gap-3 mb-2">
                                <i className="fa-solid fa-users text-3xl text-blue-300"></i>
                                <span className="text-4xl md:text-5xl font-black">500+</span>
                            </div>
                            <div className="text-blue-100 text-sm font-semibold">ผู้เข้ารับการฝึกอบรม</div>
                        </div>
                        
                        <div className="text-center px-4">
                            <div className="flex justify-center items-center gap-3 mb-2">
                                <i className="fa-solid fa-award text-3xl text-blue-300"></i>
                                <span className="text-4xl md:text-5xl font-black">200+</span>
                            </div>
                            <div className="text-blue-100 text-sm font-semibold">ผู้ผ่านการทดสอบ</div>
                        </div>

                        <div className="text-center px-4">
                            <div className="flex justify-center items-center gap-3 mb-2">
                                <i className="fa-solid fa-book-open text-3xl text-blue-300"></i>
                                <span className="text-4xl md:text-5xl font-black">50+</span>
                            </div>
                            <div className="text-blue-100 text-sm font-semibold">หลักสูตรฝึกอบรม</div>
                        </div>

                        <div className="text-center px-4">
                            <div className="flex justify-center items-center gap-3 mb-2">
                                <i className="fa-solid fa-building-columns text-3xl text-blue-300"></i>
                                <span className="text-4xl md:text-5xl font-black">20+</span>
                            </div>
                            <div className="text-blue-100 text-sm font-semibold">ปีแห่งการพัฒนา</div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    );
}
"""

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(page_content)

print("Landing page updated")
