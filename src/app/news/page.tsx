"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface NewsItem {
    id: string;
    title: string;
    category: "training" | "testing" | "general";
    categoryLabel: string;
    date: string;
    summary: string;
    content: string;
    image: string;
    badgeColor: string;
}

const mockNews: NewsItem[] = [
    {
        id: "1",
        title: "เปิดรับสมัครฝึกอบรมยกระดับฝีมือแรงงาน สาขาช่างติดตั้งแผงโซลาร์เซลล์",
        category: "training",
        categoryLabel: "ข่าวฝึกอบรม",
        date: "25 กรกฎาคม 2026",
        summary: "สพร.24 ยะลา เปิดรับสมัครผู้สนใจเข้าร่วมการฝึกอบรมฟรี! หลักสูตรการติดตั้งและบำรุงรักษาระบบโซลาร์เซลล์สำหรับที่อยู่อาศัย",
        content: `สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา ประกาศเปิดรับสมัครบุคคลทั่วไปและช่างไฟฟ้า เข้าร่วมโครงการฝึกอบรมยกระดับฝีมือแรงงาน สาขา "การติดตั้งและบำรุงรักษาระบบโซลาร์เซลล์" ระดับ 1

ระยะเวลาฝึกอบรม: 30 ชั่วโมง (5 วัน)
สถานที่ฝึกอบรม: อาคารฝึกอบรมเทคโนโลยีพลังงาน สพร.24 ยะลา
คุณสมบัติผู้สมัคร:
1. อายุ 18 ปีขึ้นไป
2. มีความรู้พื้นฐานงานไฟฟ้าหรือผ่านการทดสอบมาตรฐานฝีมือแรงงานไฟฟ้าในอาคาร
3. ไม่เสียค่าใช้จ่ายใดๆ ทั้งสิ้น พร้อมเบี้ยเลี้ยงตามเกณฑ์โครงการ

เอกสารที่ต้องใช้:
- สำเนาบัตรประชาชน 1 ชุด
- สำเนาวุฒิการศึกษา 1 ชุด
- รูปถ่าย 1 นิ้ว จำนวน 2 รูป`,
        image: "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&q=80&w=800",
        badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    },
    {
        id: "2",
        title: "กำหนดการทดสอบมาตรฐานฝีมือแรงงานแห่งชาติ สาขาช่างไฟฟ้าภายในอาคาร ระดับ 1",
        category: "testing",
        categoryLabel: "ข่าวทดสอบมาตรฐาน",
        date: "20 กรกฎาคม 2026",
        summary: "แจ้งกำหนดการทดสอบภาคความรู้และภาคความสามารถ สำหรับผู้ที่ลงทะเบียนรอบเดือนสิงหาคม 2026",
        content: `สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา ขอแจ้งกำหนดการทดสอบมาตรฐานฝีมือแรงงานแห่งชาติ สาขาช่างไฟฟ้าภายในอาคาร ระดับ 1 ประจำรอบเดือนสิงหาคม 2026

กำหนดการทดสอบ:
- ภาคความรู้ (ข้อเขียนระบบ E-Testing): วันเสาร์ที่ 10 สิงหาคม 2026 เวลา 09.00 - 10.30 น.
- ภาคความสามารถ (ปฏิบัติจริง): วันอาทิตย์ที่ 11 สิงหาคม 2026 เวลา 08.30 - 16.30 น.

สถานที่ทดสอบ: ศูนย์ทดสอบมาตรฐานฝีมือแรงงาน อาคารช่างไฟฟ้า สพร.24 ยะลา

ข้อปฏิบัติตนในการเข้าสอบ:
1. แต่งกายด้วยชุดแต่งกายสุภาพเรียบร้อย รองเท้าหุ้มส้น
2. นำบัตรประจำตัวประชาชนตัวจริงมาแสดงในวันสอบ
3. เตรียมอุปกรณ์เครื่องมือช่างส่วนตัวตามที่ศูนย์ทดสอบระบุ`,
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800",
        badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20"
    },
    {
        id: "3",
        title: "สพร.24 ยะลา จัดกิจกรรมส่งเสริมโอกาสการมีงานทำในพื้นที่จังหวัดชายแดนภาคใต้",
        category: "general",
        categoryLabel: "ข่าวประชาสัมพันธ์",
        date: "15 กรกฎาคม 2026",
        summary: "บูรณาการร่วมกับสถานประกอบการในพื้นที่จังหวัดยะลา ปัตตานี และนราธิวาส เพื่อรองรับแรงงานฝีมือที่ผ่านการทดสอบมาตรฐาน",
        content: `สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา เดินหน้าสร้างความร่วมมือกับสภาอุตสาหกรรม และหอการค้ากลุ่มจังหวัดภาคใต้ชายแดน จัดกิจกรรมนัดพบแรงงานฝีมือ (Skill Matching)

การบูรณาการในครั้งนี้มุ่งเน้นการจับคู่แรงงานที่ผ่านการประเมินรับรองความรู้ความสามารถเข้าสู่ตำแหน่งงานในกลุ่มอุตสาหกรรมแปรรูปอาหาร ก่อสร้าง และบริการ ซึ่งมีอัตราค่าจ้างสูงกว่าค่าจ้างขั้นต่ำตามประกาศมาตรฐานฝีมือแรงงาน`,
        image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800",
        badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20"
    }
];

export default function NewsPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

    const filteredNews = selectedCategory === "all"
        ? mockNews
        : mockNews.filter(n => n.category === selectedCategory);

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-6 border-b border-slate-200 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
                            <Link href="/" className="hover:underline">หน้าหลัก</Link>
                            <span>/</span>
                            <span>ข่าวสารและประกาศ</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">ข่าวสารและประกาศประชาสัมพันธ์</h1>
                        <p className="text-xs text-slate-500 mt-1">ติดตามข่าวรับสมัครอบรม กำหนดการทดสอบมาตรฐาน และประกาศสำคัญ สพร.24 ยะลา</p>
                    </div>
                    <Link href="/" className="btn btn-sm bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold gap-2">
                        <i className="fa-solid fa-arrow-left"></i> กลับหน้าหลัก
                    </Link>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                    {[
                        { id: "all", label: "ทั้งหมด" },
                        { id: "training", label: "ข่าวฝึกอบรม" },
                        { id: "testing", label: "ข่าวทดสอบมาตรฐาน" },
                        { id: "general", label: "ข่าวประชาสัมพันธ์" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedCategory(tab.id)}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                                selectedCategory === tab.id
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* News Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredNews.map((news) => (
                        <motion.div
                            key={news.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group"
                        >
                            <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                                <img
                                    src={news.image}
                                    alt={news.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <span className={`absolute top-3 left-3 text-[10px] font-bold px-3 py-1 rounded-full border backdrop-blur-md bg-white/90 ${news.badgeColor}`}>
                                    {news.categoryLabel}
                                </span>
                            </div>
                            <div className="p-6 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                                        <i className="fa-regular fa-calendar text-blue-500"></i>
                                        {news.date}
                                    </div>
                                    <h3 className="text-base font-extrabold text-slate-800 mb-2 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {news.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                                        {news.summary}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedNews(news)}
                                    className="btn btn-sm w-full bg-slate-50 hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                                >
                                    อ่านรายละเอียด <i className="fa-solid fa-chevron-right text-[10px]"></i>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* News Detail Modal */}
            <AnimatePresence>
                {selectedNews && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col"
                        >
                            <div className="relative h-56 w-full">
                                <img src={selectedNews.image} alt={selectedNews.title} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                                >
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${selectedNews.badgeColor}`}>
                                        {selectedNews.categoryLabel}
                                    </span>
                                    <span className="text-xs text-slate-400">{selectedNews.date}</span>
                                </div>
                                <h2 className="text-xl font-black text-slate-800 leading-tight">{selectedNews.title}</h2>
                                <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-sans border-t border-slate-100 pt-4">
                                    {selectedNews.content}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="btn btn-sm bg-slate-800 text-white hover:bg-slate-900 px-6 rounded-xl font-bold"
                                >
                                    ปิดหน้าต่าง
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
