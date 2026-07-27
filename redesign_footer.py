import os

footer_content = """"use client";

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
                            <p>77 หมู่ 4 ตำบลสะเตง อำเภอเมืองยะลา จังหวัดยะลา 95000</p>
                            <p className="flex items-center gap-2 mt-4"><i className="fa-solid fa-phone w-4"></i> โทรศัพท์ 073-203-298</p>
                            <p className="flex items-center gap-2"><i className="fa-solid fa-envelope w-4"></i> อีเมล dsdyala24@dsd.go.th</p>
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
                            <a href="#" className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                <i className="fa-brands fa-facebook-f text-lg"></i>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-[#00B900] flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                <i className="fa-brands fa-line text-lg"></i>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-[#FF0000] flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                <i className="fa-brands fa-youtube text-lg"></i>
                            </a>
                        </div>
                    </div>

                </div>

                {/* Bottom Copyright */}
                <div className="pt-8 border-t border-white/10 text-center text-xs text-blue-200/50">
                    <p>© 2024 สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา | สงวนลิขสิทธิ์</p>
                </div>
            </div>
        </footer>
    );
}
"""

with open("src/components/Footer.tsx", "w", encoding="utf-8") as f:
    f.write(footer_content)

print("Footer updated")
