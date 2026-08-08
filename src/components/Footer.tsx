"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer id="footer" className="bg-[#0B3C74] text-white pt-16 pb-8 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
                    
                    {/* Column 1: Logo */}
                    <div className="flex flex-col items-start">
                        <Link href="/" className="flex items-center gap-4 group mb-6">
                            <div className="w-12 h-12 bg-white flex items-center justify-center rounded overflow-hidden">
                                <Image src="/logo-seal.png" alt="Seal Logo" width={40} height={40} className="object-contain" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-wider">
                                    DSD YALA
                                </h1>
                                <p className="text-[11px] font-semibold tracking-widest text-blue-200">
                                    SKILL QUEUE SYSTEM
                                </p>
                            </div>
                        </Link>
                        <p className="text-sm text-blue-100/70 leading-relaxed max-w-xs">
                            ระบบรับสมัครและจองคิวออนไลน์ เพื่อยกระดับทักษะแรงงานไทย สู่มาตรฐานสากล
                        </p>
                    </div>

                    {/* Column 2: Address */}
                    <div>
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[#FBBF24] rounded-full"></div>
                            สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา
                        </h3>
                        <div className="space-y-3 text-sm text-blue-100/80">
                            <p>กรมพัฒนาฝีมือแรงงาน กระทรวงแรงงาน</p>
                            <p>111 ม.5 ตำบลวังพญา อำเภอรามัน จังหวัดยะลา 95140</p>
                            <p className="flex items-center gap-2 mt-4"><i className="fa-solid fa-phone w-4"></i> โทรศัพท์ 073-203222 , 073-203223</p>
                            <p className="flex items-center gap-2"><i className="fa-solid fa-globe w-4"></i> เว็บไซต์ www.dsd.go.th/yala</p>
                        </div>
                    </div>

                    {/* Column 3: Quick Links */}
                    <div>
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[#FBBF24] rounded-full"></div>
                            ลิงก์ด่วน
                        </h3>
                        <ul className="space-y-3 text-sm text-blue-100/80">
                            <li><Link href="/" className="hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-chevron-right text-[10px]"></i> หน้าหลัก</Link></li>
                            <li><Link href="/booking?type=training" className="hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-chevron-right text-[10px]"></i> ฝึกอบรม</Link></li>
                            <li><Link href="/booking?type=test" className="hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-chevron-right text-[10px]"></i> ทดสอบมาตรฐาน</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-chevron-right text-[10px]"></i> ข่าวสาร</Link></li>
                            <li><Link href="#footer" className="hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-chevron-right text-[10px]"></i> ติดต่อเรา</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Social */}
                    <div>
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[#FBBF24] rounded-full"></div>
                            ติดตามเรา
                        </h3>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://www.facebook.com/profile.php?id=100069260137622"
                                target="_blank"
                                rel="noreferrer"
                                className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                title="Facebook สพร.24 ยะลา"
                            >
                                <i className="fa-brands fa-facebook-f text-lg"></i>
                            </a>
                            <a
                                href="https://line.me/R/ti/p/@522kafif"
                                target="_blank"
                                rel="noreferrer"
                                className="w-10 h-10 rounded-full bg-[#00B900] flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                title="LINE Official Account (@522kafif)"
                            >
                                <i className="fa-brands fa-line text-lg"></i>
                            </a>
                            <a
                                href="https://www.youtube.com/@สพร24ยะลา"
                                target="_blank"
                                rel="noreferrer"
                                className="w-10 h-10 rounded-full bg-[#FF0000] flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                title="YouTube สพร.24 ยะลา"
                            >
                                <i className="fa-brands fa-youtube text-lg"></i>
                            </a>
                        </div>
                    </div>

                </div>

                {/* Bottom Copyright */}
                <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-200/60 font-medium">
                    <p>© 2024 - 2026 สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา | สงวนลิขสิทธิ์</p>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-900/80 border border-blue-400/30 text-blue-200 text-[10px] font-mono font-bold tracking-wide">
                            PWA v1.0
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
