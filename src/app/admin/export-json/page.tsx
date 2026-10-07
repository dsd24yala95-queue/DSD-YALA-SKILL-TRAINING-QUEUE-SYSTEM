"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface MasterItem {
    id: string;
    name: string;
    type: "training" | "test";
    date?: string;
    dateEnd?: string;
    location?: string;
    currentQueue: number;
    maxLimit: number;
    status: string;
    levels?: string;
    durationDays?: number;
}

export default function AdminExportJsonPage() {
    const [courses, setCourses] = useState<MasterItem[]>([]);
    const [branches, setBranches] = useState<MasterItem[]>([]);
    const [totalMembers, setTotalMembers] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"training" | "test" | "all">("training");
    const [searchQuery, setSearchQuery] = useState("");
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // Preview Modal State
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewItem, setPreviewItem] = useState<{ id: string; name: string; type: string } | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [courseRes, branchRes, memberRes] = await Promise.all([
                fetch("/api/master/courses"),
                fetch("/api/master/branches"),
                fetch("/api/admin/stats"),
            ]);

            if (courseRes.ok) {
                const cData = await courseRes.json();
                setCourses(
                    cData.map((c: any) => ({
                        id: c.id,
                        name: c.courseName,
                        type: "training",
                        date: c.Date,
                        dateEnd: c.DateEnd,
                        location: c.LocationName,
                        currentQueue: c.currentQueue || 0,
                        maxLimit: c.maxSeats || 0,
                        status: c.status || "active",
                        durationDays: c.durationDays,
                    }))
                );
            }

            if (branchRes.ok) {
                const bData = await branchRes.json();
                setBranches(
                    bData.map((b: any) => ({
                        id: b.id,
                        name: b.branchName,
                        type: "test",
                        date: b.Date,
                        dateEnd: b.DateEnd,
                        location: b.LocationName,
                        currentQueue: b.currentQueue || 0,
                        maxLimit: b.maxQueue || 0,
                        status: b.status || "active",
                        levels: b.levels,
                    }))
                );
            }

            if (memberRes.ok) {
                const sData = await memberRes.json();
                setTotalMembers(sData.totalMembers || sData.membersCount || 0);
            }
        } catch (error) {
            console.error("Error loading master data:", error);
            toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลหลักสูตรและสาขา");
        } finally {
            setLoading(false);
        }
    };

    // Filter items based on active tab and search query
    const displayedItems = useMemo(() => {
        let list = activeTab === "training" ? courses : activeTab === "test" ? branches : [];
        if (!searchQuery.trim()) return list;
        const q = searchQuery.toLowerCase().trim();
        return list.filter(
            (item) =>
                item.name.toLowerCase().includes(q) ||
                (item.location && item.location.toLowerCase().includes(q))
        );
    }, [activeTab, courses, branches, searchQuery]);

    // Handle Download JSON or CSV
    const handleDownload = async (
        item: { id: string; name: string; type: string } | null,
        format: "json" | "csv" = "json"
    ) => {
        const downloadKey = item ? `${item.id}_${format}` : `all_${format}`;
        setDownloadingId(downloadKey);
        const toastId = toast.loading(
            `กำลังสร้างไฟล์ ${format.toUpperCase()} (${item ? item.name : "สมาชิกทั้งหมด"})...`
        );

        try {
            const params = new URLSearchParams();
            if (item) {
                params.set("courseId", item.id);
                params.set("courseName", item.name);
                params.set("mode", item.type);
            } else {
                params.set("courseName", "DSD_YALA_ALL_MEMBERS");
                params.set("mode", "all");
            }
            if (format === "csv") {
                params.set("format", "csv");
            }

            const res = await fetch(`/api/admin/export-json?${params.toString()}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (res.status === 401 || res.status === 403) {
                    throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบแอดมินใหม่อีกครั้ง");
                }
                throw new Error(err.error || "ไม่สามารถดาวน์โหลดไฟล์ได้");
            }

            const disposition = res.headers.get("Content-Disposition") || "";
            let filename = item
                ? `${item.name.replace(/[^ก-๙a-zA-Z0-9_ ]/g, "").trim().replace(/ /g, "_")}.${format}`
                : `DSD_YALA_ALL_MEMBERS.${format}`;

            const match = disposition.match(/filename\*=UTF-8''(.+)/);
            if (match) {
                filename = decodeURIComponent(match[1]);
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success(`ดาวน์โหลดไฟล์ ${format.toUpperCase()} สำเร็จ: ${filename}`, { id: toastId });
        } catch (error: any) {
            console.error("Export error:", error);
            toast.error(error.message || "เกิดข้อผิดพลาดในการดาวน์โหลด", { id: toastId });
        } finally {
            setDownloadingId(null);
        }
    };

    // Open JSON Preview Modal
    const handleOpenPreview = async (item: { id: string; name: string; type: string } | null) => {
        setPreviewItem(item);
        setPreviewModalOpen(true);
        setPreviewLoading(true);
        setPreviewData([]);

        try {
            const params = new URLSearchParams();
            if (item) {
                params.set("courseId", item.id);
                params.set("courseName", item.name);
                params.set("mode", item.type);
            } else {
                params.set("courseName", "DSD_YALA_ALL_MEMBERS");
                params.set("mode", "all");
            }

            const res = await fetch(`/api/admin/export-json?${params.toString()}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "ดึงข้อมูลตัวอย่างไม่สำเร็จ");
            }
            const data = await res.json();
            setPreviewData(data);
        } catch (error: any) {
            toast.error(error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลตัวอย่าง");
        } finally {
            setPreviewLoading(false);
        }
    };

    // Copy JSON to clipboard
    const handleCopyJson = () => {
        if (!previewData || previewData.length === 0) return;
        navigator.clipboard.writeText(JSON.stringify(previewData, null, 2));
        toast.success("คัดลอกโค้ด JSON ลง Clipboard เรียบร้อยแล้ว!");
    };

    const totalTrainingQueues = courses.reduce((sum, c) => sum + c.currentQueue, 0);
    const totalTestQueues = branches.reduce((sum, b) => sum + b.currentQueue, 0);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
                            <i className="fa-solid fa-check-double text-xs"></i>
                            มาตรฐานกรมพัฒนาฝีมือแรงงาน 50 ฟิลด์แท้จริง (Strict DSD Schema)
                        </div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            <i className="fa-solid fa-file-code text-indigo-400"></i>
                            ส่งออกข้อมูล DSD JSON (สำหรับระบบส่วนกลาง)
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                            ศูนย์กลางส่งออกไฟล์ JSON และ CSV ที่ผ่านการจัดระเบียบโครงสร้าง 50 ฟิลด์ตามมาตรฐานระบบสารสนเทศกรมพัฒนาฝีมือแรงงาน พร้อมนำเข้า (Import) สู่ระบบส่วนกลางได้ทันที
                        </p>
                    </div>

                    {/* Quick Full Export Button */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                        <button
                            onClick={() => handleOpenPreview(null)}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all border border-white/20 backdrop-blur-md flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-eye text-indigo-300"></i>
                            พรีวิวสมาชิกทั้งหมด
                        </button>
                        <button
                            onClick={() => handleDownload(null, "json")}
                            disabled={downloadingId === "all_json"}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {downloadingId === "all_json" ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <i className="fa-solid fa-download"></i>
                            )}
                            ดาวน์โหลดสมาชิกทั้งหมด (.json)
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                    onClick={() => setActiveTab("training")}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                        activeTab === "training"
                            ? "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-300 shadow-md ring-2 ring-indigo-500/20"
                            : "bg-white/80 hover:bg-slate-50 border-slate-200/80 shadow-sm"
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                            <i className="fa-solid fa-graduation-cap text-indigo-500"></i>
                            1. ฝ่ายฝึกอบรม
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700">
                            {courses.length} หลักสูตร
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800">{totalTrainingQueues}</span>
                        <span className="text-xs text-slate-500 font-semibold">ผู้สมัครในระบบ</span>
                    </div>
                </div>

                <div
                    onClick={() => setActiveTab("test")}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                        activeTab === "test"
                            ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300 shadow-md ring-2 ring-purple-500/20"
                            : "bg-white/80 hover:bg-slate-50 border-slate-200/80 shadow-sm"
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                            <i className="fa-solid fa-clipboard-check text-purple-500"></i>
                            2. ฝ่ายทดสอบมาตรฐาน
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">
                            {branches.length} สาขา
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800">{totalTestQueues}</span>
                        <span className="text-xs text-slate-500 font-semibold">ผู้สมัครในระบบ</span>
                    </div>
                </div>

                <div
                    onClick={() => setActiveTab("all")}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                        activeTab === "all"
                            ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 shadow-md ring-2 ring-emerald-500/20"
                            : "bg-white/80 hover:bg-slate-50 border-slate-200/80 shadow-sm"
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                            <i className="fa-solid fa-users text-emerald-500"></i>
                            3. สมาชิกประชาชนทั้งหมด
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                            ฐานข้อมูลรวม
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800">{totalMembers}</span>
                        <span className="text-xs text-slate-500 font-semibold">บัญชีสมาชิก</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs & Search Controls */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl shrink-0 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("training")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                            activeTab === "training"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <i className="fa-solid fa-graduation-cap"></i>
                        1. งานฝึกอบรม ({courses.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("test")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                            activeTab === "test"
                                ? "bg-white text-purple-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <i className="fa-solid fa-clipboard-check"></i>
                        2. งานทดสอบมาตรฐาน ({branches.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                            activeTab === "all"
                                ? "bg-white text-emerald-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <i className="fa-solid fa-users"></i>
                        3. สมาชิกทั้งหมด
                    </button>
                </div>

                {/* Search Input (For training and test tabs) */}
                {activeTab !== "all" && (
                    <div className="relative flex-1 max-w-md">
                        <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                        <input
                            type="text"
                            placeholder={`ค้นหา${activeTab === "training" ? "หลักสูตรฝึกอบรม" : "สาขาทดสอบมาตรฐาน"}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content Section */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <span className="loading loading-spinner loading-lg text-indigo-600"></span>
                    <p className="text-xs text-slate-500 font-bold">กำลังโหลดรายการหลักสูตรและสาขาทดสอบ...</p>
                </div>
            ) : activeTab === "all" ? (
                /* All Members Tab */
                <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center max-w-2xl mx-auto my-6 space-y-5">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto shadow-inner">
                        <i className="fa-solid fa-users"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800">ส่งออกข้อมูลสมาชิกทั้งหมดในระบบ</h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            ระบบจะรวบรวมสมาชิกประชาชนทุกคนที่ลงทะเบียนในระบบ (รวม {totalMembers} ราย) และแปลงเป็นโครงสร้าง 50 ฟิลด์มาตรฐานตามแบบฟอร์ม DSD อัตโนมัติ
                        </p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            onClick={() => handleOpenPreview(null)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-eye text-slate-500"></i>
                            พรีวิวข้อมูล JSON
                        </button>
                        <button
                            onClick={() => handleDownload(null, "json")}
                            disabled={downloadingId === "all_json"}
                            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {downloadingId === "all_json" ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <i className="fa-solid fa-file-code"></i>
                            )}
                            ดาวน์โหลดไฟล์ JSON (50 ฟิลด์)
                        </button>
                        <button
                            onClick={() => handleDownload(null, "csv")}
                            disabled={downloadingId === "all_csv"}
                            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {downloadingId === "all_csv" ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <i className="fa-solid fa-file-excel"></i>
                            )}
                            ดาวน์โหลดไฟล์ CSV (สำหรับ Excel)
                        </button>
                    </div>
                </div>
            ) : displayedItems.length === 0 ? (
                /* Empty State */
                <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
                    <i className="fa-solid fa-folder-open text-4xl text-slate-300 mb-3"></i>
                    <h4 className="text-sm font-bold text-slate-700">ไม่พบรายการที่ค้นหา</h4>
                    <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือตรวจสอบการตั้งค่าหลักสูตร/สาขา</p>
                </div>
            ) : (
                /* Grid of Courses / Branches */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedItems.map((item) => {
                        const isTraining = item.type === "training";
                        const jsonKey = `${item.id}_json`;
                        const csvKey = `${item.id}_csv`;

                        return (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                            >
                                <div>
                                    {/* Top Row: Type Badge + Applicant Count */}
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                                                isTraining
                                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                                    : "bg-purple-50 text-purple-700 border border-purple-100"
                                            }`}
                                        >
                                            <i
                                                className={`fa-solid ${
                                                    isTraining ? "fa-graduation-cap" : "fa-clipboard-check"
                                                }`}
                                            ></i>
                                            {isTraining ? "หลักสูตรฝึกอบรม" : "สาขาทดสอบมาตรฐาน"}
                                            {item.levels ? ` (ระดับ ${item.levels})` : ""}
                                        </span>

                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                                                item.currentQueue > 0
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}
                                        >
                                            <i className="fa-solid fa-users text-[10px]"></i>
                                            {item.currentQueue} ผู้สมัคร
                                        </span>
                                    </div>

                                    {/* Item Title */}
                                    <h3 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">
                                        {item.name}
                                    </h3>

                                    {/* Metadata Details */}
                                    <div className="mt-2.5 space-y-1 text-[11px] text-slate-500 font-medium">
                                        {item.date && (
                                            <div className="flex items-center gap-2">
                                                <i className="fa-regular fa-calendar text-slate-400 w-3.5"></i>
                                                <span>
                                                    ช่วงเวลา: {item.date} {item.dateEnd ? `- ${item.dateEnd}` : ""}
                                                </span>
                                            </div>
                                        )}
                                        {item.location && (
                                            <div className="flex items-center gap-2 truncate">
                                                <i className="fa-solid fa-location-dot text-slate-400 w-3.5"></i>
                                                <span className="truncate">{item.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => handleOpenPreview(item)}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5"
                                        title="ดูโค้ด JSON ตัวอย่างก่อนดาวน์โหลด"
                                    >
                                        <i className="fa-solid fa-eye text-slate-500"></i>
                                        พรีวิว
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => handleDownload(item, "csv")}
                                            disabled={downloadingId === csvKey}
                                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                                            title="ดาวน์โหลดเป็นไฟล์ CSV (สำหรับเปิดใน Excel)"
                                        >
                                            {downloadingId === csvKey ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : (
                                                <i className="fa-solid fa-file-excel text-emerald-600"></i>
                                            )}
                                            CSV
                                        </button>

                                        <button
                                            onClick={() => handleDownload(item, "json")}
                                            disabled={downloadingId === jsonKey}
                                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                                            title="ดาวน์โหลดเป็นไฟล์ DSD JSON มาตรฐาน 50 ฟิลด์"
                                        >
                                            {downloadingId === jsonKey ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : (
                                                <i className="fa-solid fa-file-code"></i>
                                            )}
                                            ดาวน์โหลด JSON
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ─── JSON Preview Modal ────────────────────────────────────── */}
            <AnimatePresence>
                {previewModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-lg">
                                        <i className="fa-solid fa-file-code"></i>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-300">
                                                DSD Standard JSON Inspector
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                50 Fields
                                            </span>
                                        </div>
                                        <h3 className="text-base font-black text-white">
                                            {previewItem ? previewItem.name : "สมาชิกประชาชนทั้งหมด"}
                                        </h3>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setPreviewModalOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                                >
                                    <i className="fa-solid fa-xmark text-base"></i>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-hidden p-5 sm:p-6 flex flex-col">
                                {previewLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                                        <span className="loading loading-spinner loading-lg text-indigo-600"></span>
                                        <p className="text-xs text-slate-500 font-bold">กำลังสร้างตัวอย่าง JSON 50 ฟิลด์...</p>
                                    </div>
                                ) : previewData.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <i className="fa-solid fa-users-slash text-3xl text-slate-300 mb-2"></i>
                                        <p className="text-xs font-bold text-slate-600">ไม่มีผู้สมัครในรายการนี้</p>
                                        <p className="text-[11px] text-slate-400 mt-1">ไฟล์ JSON จะเป็นอาร์เรย์ว่าง []</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        {/* Status Header inside Modal */}
                                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2 shrink-0">
                                            <span>
                                                พบผู้สมัคร: <strong className="text-indigo-600">{previewData.length}</strong> คน (โครงสร้าง 50 ฟิลด์ต่อคน)
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                ลำดับฟิลด์: [1] register_type ... [50] info_findjob_detail_industry_desc
                                            </span>
                                        </div>

                                        {/* JSON Code Box */}
                                        <div className="flex-1 overflow-auto bg-slate-900 rounded-2xl p-4 font-mono text-[11px] text-emerald-400 border border-slate-800 shadow-inner">
                                            <pre>{JSON.stringify(previewData, null, 2)}</pre>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
                                <button
                                    onClick={handleCopyJson}
                                    disabled={previewLoading || previewData.length === 0}
                                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-40"
                                >
                                    <i className="fa-solid fa-copy text-indigo-500"></i>
                                    คัดลอก JSON
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPreviewModalOpen(false)}
                                        className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold"
                                    >
                                        ปิดหน้าต่าง
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDownload(previewItem, "json");
                                            setPreviewModalOpen(false);
                                        }}
                                        disabled={previewLoading || previewData.length === 0}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-40"
                                    >
                                        <i className="fa-solid fa-download"></i>
                                        ดาวน์โหลดไฟล์ .json ทันที
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
