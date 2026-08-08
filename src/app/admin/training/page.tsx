"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MapLocationPickerModal from "@/components/MapLocationPickerModal";
import ApplicantListModal from "@/components/admin/ApplicantListModal";
import { formatDateRangeTh } from "@/lib/dateFormatter";

interface MasterCourse {
    id: string;
    courseName: string;
    durationDays: number;
    maxSeats: number;
    currentQueue: number;
    Date: string;
    DateEnd: string;
    LocationName?: string;
    LocationGPS?: string;
    status: "active" | "inactive";
}

const emptyCourse: Omit<MasterCourse, "id"> = {
    courseName: "",
    durationDays: 5,
    maxSeats: 20,
    currentQueue: 0,
    Date: "",
    DateEnd: "",
    LocationName: "สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา",
    LocationGPS: "6.541094, 101.280388",
    status: "active",
};

export default function AdminTrainingPage() {
    const [courses, setCourses] = useState<MasterCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [modalOpen, setModalOpen] = useState(false);
    const [mapPickerOpen, setMapPickerOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<MasterCourse | null>(null);
    const [form, setForm] = useState<any>({ ...emptyCourse });
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [applicantModalTarget, setApplicantModalTarget] = useState<{ id: string; name: string } | null>(null);

    const loadCourses = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/master/courses");
            if (!res.ok) throw new Error("Failed to load courses");
            const data = await res.json();
            setCourses(data);
        } catch {
            toast.error("ไม่สามารถโหลดข้อมูลหลักสูตรอบรมได้");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    const openAdd = () => {
        setEditTarget(null);
        setForm({ ...emptyCourse });
        setModalOpen(true);
    };

    const openEdit = (course: MasterCourse) => {
        setEditTarget(course);
        setForm({ ...course });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.courseName?.trim()) {
            toast.error("กรุณากรอกชื่อหลักสูตรการฝึกอบรม");
            return;
        }

        setSaving(true);
        try {
            const method = editTarget ? "PUT" : "POST";
            const payload = editTarget ? { ...form, id: editTarget.id } : form;

            const res = await fetch("/api/master/courses", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save course");

            toast.success(editTarget ? "บันทึกการแก้ไขหลักสูตรแล้ว" : "เพิ่มหลักสูตรอบรมใหม่เรียบร้อย");
            setModalOpen(false);
            loadCourses();
        } catch {
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/master/courses?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("ลบหลักสูตรเรียบร้อยแล้ว");
            setDeleteConfirm(null);
            loadCourses();
        } catch {
            toast.error("เกิดข้อผิดพลาดในการลบหลักสูตร");
        }
    };

    const handleUseCurrentGPS = () => {
        if (!navigator.geolocation) {
            toast.error("อุปกรณ์นี้ไม่รองรับ GPS");
            return;
        }
        toast.loading("กำลังดึงพิกัด GPS...", { id: "gps-quick" });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
                setForm((p: any) => ({ ...p, LocationGPS: coords }));
                toast.success(`ดึงพิกัด GPS สำเร็จ: ${coords}`, { id: "gps-quick" });
            },
            (err) => {
                console.error(err);
                toast.error("ไม่สามารถดึงตำแหน่ง GPS ได้ กรุณาเปิด Location", { id: "gps-quick" });
            },
            { enableHighAccuracy: true }
        );
    };

    const formatDateRange = (startDate?: string, endDate?: string) => {
        return formatDateRangeTh(startDate, endDate);
    };

    const filteredCourses = courses.filter((c) => {
        const matchSearch =
            c.courseName.toLowerCase().includes(search.toLowerCase()) ||
            (c.LocationName || "").toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const activeCount = courses.filter((c) => c.status === "active").length;
    const totalSeats = courses.reduce((acc, c) => acc + (c.maxSeats || 0), 0);
    const bookedSeats = courses.reduce((acc, c) => acc + (c.currentQueue || 0), 0);

    return (
        <div className="p-4 sm:p-6 bg-[#f8fafc] min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <i className="fa-solid fa-graduation-cap text-indigo-600"></i>
                        การฝึกอบรม (Skill Training Management)
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        จัดการข้อมูลหลักสูตรอบรมยกระดับและเปลี่ยนสายอาชีพ สพร.24 ยะลา
                    </p>
                </div>

                <button
                    onClick={openAdd}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 shrink-0"
                >
                    <i className="fa-solid fa-plus"></i> เพิ่มหลักสูตรอบรมใหม่
                </button>
            </div>

            {/* Summary Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
                {[
                    { label: "หลักสูตรทั้งหมด", value: courses.length, icon: "fa-book-open", color: "from-purple-500 to-indigo-600" },
                    { label: "เปิดรับสมัครอยู่", value: activeCount, icon: "fa-[#6366F1]", iconClass: "fa-solid fa-circle-check", color: "from-emerald-500 to-teal-600" },
                    { label: "ที่นั่งรวมทั้งหมด", value: totalSeats, iconClass: "fa-solid fa-users", color: "from-blue-500 to-cyan-600" },
                    { label: "ที่นั่งจองแล้ว", value: bookedSeats, iconClass: "fa-solid fa-user-check", color: "from-indigo-500 to-purple-600" },
                ].map((c, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-sm text-white text-sm shrink-0`}>
                            <i className={c.iconClass || `fa-solid ${c.icon}`}></i>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl font-black text-slate-800">{c.value}</p>
                            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 leading-tight">{c.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อหลักสูตร, สถานที่อบรม..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <span className="text-xs font-bold text-slate-500 shrink-0">สถานะ:</span>
                    {[
                        { id: "all", label: "ทั้งหมด" },
                        { id: "active", label: "🟢 เปิดรับสมัคร" },
                        { id: "inactive", label: "🔴 ปิดรับสมัคร" },
                    ].map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setStatusFilter(s.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                statusFilter === s.id
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Courses Card Grid */}
            {loading ? (
                <div className="py-24 flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg text-indigo-600"></span>
                    <p className="text-xs text-slate-400 font-medium">กำลังโหลดข้อมูลหลักสูตรการฝึกอบรม...</p>
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 py-16 text-center text-slate-400 p-4">
                    <i className="fa-solid fa-graduation-cap text-4xl mb-3 block opacity-30"></i>
                    <p className="text-sm font-semibold mb-3">ยังไม่มีข้อมูลหลักสูตรการฝึกอบรมตามเงื่อนไข</p>
                    <button onClick={openAdd} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm">
                        + เพิ่มหลักสูตรอบรมแรก
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filteredCourses.map((c, i) => {
                            const max = c.maxSeats || 20;
                            const current = c.currentQueue || 0;
                            const percent = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;

                            return (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm text-white text-sm">
                                                <i className="fa-solid fa-book"></i>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-400/20" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                                                {c.status === "active" ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug mb-2">{c.courseName}</h3>

                                        <div className="space-y-2 mt-3">
                                            {/* Thai Date Range */}
                                            <p className="text-xs font-semibold text-slate-600 flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                <i className="fa-regular fa-calendar-days text-purple-500 shrink-0"></i>
                                                <span>{formatDateRangeTh(c.Date, c.DateEnd)}</span>
                                            </p>

                                            <p className="text-[11px] text-slate-500 flex items-center gap-2">
                                                <i className="fa-solid fa-clock w-4 text-purple-400"></i>
                                                <span>ระยะเวลาอบรม {c.durationDays} วัน</span>
                                            </p>

                                            {c.LocationName && (
                                                <p className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                                                    <i className="fa-solid fa-location-dot w-4 text-rose-400"></i>
                                                    <span className="truncate">{c.LocationName}</span>
                                                </p>
                                            )}

                                            {/* GPS Map Button */}
                                            <div>
                                                <a
                                                    href={
                                                        c.LocationGPS?.startsWith("http")
                                                            ? c.LocationGPS
                                                            : c.LocationGPS
                                                                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.LocationGPS)}`
                                                                : "https://maps.app.goo.gl/brFvnbXxdL2M5cdk9"
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 text-[11px] font-bold transition-all"
                                                >
                                                    <i className="fa-solid fa-map-location-dot text-purple-500"></i>
                                                    <span>📍 เปิดแผนที่ (GPS)</span>
                                                    <i className="fa-solid fa-arrow-up-right-from-square text-[9px] opacity-70"></i>
                                                </a>
                                            </div>

                                            {/* Dynamic Capacity Progress Bar (Green -> Orange -> Red) */}
                                            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 mt-2">
                                                <div className="flex justify-between text-[11px] font-bold mb-1">
                                                    <span className="text-slate-500">ที่นั่งผู้สมัครอบรม:</span>
                                                    <span className={
                                                        percent >= 100
                                                            ? "text-rose-600 font-extrabold"
                                                            : percent >= 70
                                                                ? "text-amber-600 font-extrabold"
                                                                : "text-emerald-600 font-extrabold"
                                                    }>
                                                        {current} / {max} คน ({percent}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            percent >= 100
                                                                ? "bg-gradient-to-r from-red-500 to-rose-600"
                                                                : percent >= 70
                                                                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                                                    : "bg-gradient-to-r from-emerald-500 to-teal-400"
                                                        }`}
                                                        style={{ width: `${Math.max(5, percent)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
                                    <button
                                        type="button"
                                        onClick={() => setApplicantModalTarget({ id: c.id, name: c.courseName })}
                                        className="py-2 px-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200/60 shadow-sm"
                                        title="ดูรายชื่อผู้สมัครและพิมพ์ใบเซ็นชื่อ"
                                    >
                                        <i className="fa-solid fa-[#6366F1] fa-users text-indigo-600"></i>
                                        <span>ใบเซ็นชื่อ / รายชื่อ</span>
                                    </button>
                                    <button onClick={() => openEdit(c)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                        <i className="fa-solid fa-pen mr-1"></i> แก้ไข
                                    </button>
                                    {deleteConfirm === c.id ? (
                                        <div className="flex gap-1.5">
                                            <button onClick={() => handleDelete(c.id)} className="py-2 px-3 rounded-xl bg-red-600 text-white text-xs font-bold shadow-sm">ยืนยัน</button>
                                            <button onClick={() => setDeleteConfirm(null)} className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500">ยกเลิก</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(c.id)} className="py-2 px-3 rounded-xl border border-red-100 text-xs font-bold text-red-400 hover:bg-red-50 transition-all">
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                    </AnimatePresence>
                </div>
            )}

            {/* Add / Edit Course Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto my-8">
                            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                                <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                                    <i className="fa-solid fa-graduation-cap text-indigo-600"></i>
                                    {editTarget ? "✏️ แก้ไขหลักสูตรอบรม" : "➕ เพิ่มหลักสูตรอบรมใหม่"}
                                </h2>
                                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <label className="font-bold text-slate-600 block mb-1">ชื่อหลักสูตรการฝึกอบรม <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="เช่น การซ่อมบำรุงรถจักรยานยนต์ไฟฟ้า"
                                        value={form.courseName || ""}
                                        onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="font-bold text-slate-600 block mb-1">ระยะเวลาอบรม (วัน)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={form.durationDays || 5}
                                            onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-600 block mb-1">จำนวนที่นั่งสูงสุด</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={form.maxSeats || 20}
                                            onChange={(e) => setForm({ ...form, maxSeats: Number(e.target.value) })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="font-bold text-slate-600 block mb-1">
                                            <i className="fa-regular fa-calendar-check text-indigo-500 mr-1"></i>
                                            วันที่เริ่มอบรม
                                        </label>
                                        <input
                                            type="date"
                                            value={form.Date || ""}
                                            onChange={(e) => setForm({ ...form, Date: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 font-sans"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-600 block mb-1">
                                            <i className="fa-regular fa-calendar-xmark text-indigo-500 mr-1"></i>
                                            วันที่สิ้นสุดอบรม
                                        </label>
                                        <input
                                            type="date"
                                            value={form.DateEnd || ""}
                                            onChange={(e) => setForm({ ...form, DateEnd: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 font-sans"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-600 block mb-1">สถานที่จัดอบรม</label>
                                    <input
                                        type="text"
                                        placeholder="เช่น สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา"
                                        value={form.LocationName || ""}
                                        onChange={(e) => setForm({ ...form, LocationName: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    />
                                </div>

                                {/* Location GPS Picker Field */}
                                <div>
                                    <label className="font-bold text-slate-600 block mb-1">
                                        <i className="fa-solid fa-location-crosshairs mr-1 text-indigo-500"></i>
                                        พิกัดแผนที่ (Lat, Long)
                                    </label>

                                    <div className="flex gap-2 mb-1.5">
                                        <input
                                            type="text"
                                            placeholder="เช่น 6.541094, 101.280388"
                                            value={form.LocationGPS || ""}
                                            onChange={(e) => setForm({ ...form, LocationGPS: e.target.value })}
                                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 font-mono text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMapPickerOpen(true)}
                                            className="px-3.5 py-2.5 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95"
                                        >
                                            <i className="fa-solid fa-map-location-dot"></i>
                                            <span>ปักหมุดแผนที่</span>
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, LocationGPS: "6.541094, 101.280388" })}
                                            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[10px] font-bold border border-indigo-200/60 transition-all flex items-center gap-1"
                                        >
                                            <i className="fa-solid fa-building text-indigo-500"></i>
                                            📍 สพร.24 ยะลา
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleUseCurrentGPS}
                                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold border border-emerald-200/60 transition-all flex items-center gap-1"
                                        >
                                            <i className="fa-solid fa-location-crosshairs text-emerald-600"></i>
                                            🎯 พิกัด GPS ปัจจุบัน
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-600 block mb-1">สถานะเปิดรับสมัคร</label>
                                    <select
                                        value={form.status || "active"}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    >
                                        <option value="active">🟢 เปิดรับสมัคร</option>
                                        <option value="inactive">🔴 ปิดรับสมัคร</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                    ยกเลิก
                                </button>
                                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20 active:scale-95">
                                    {saving ? "กำลังบันทึก..." : "💾 บันทึกข้อมูลหลักสูตร"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interactive Map Picker Modal */}
            <MapLocationPickerModal
                isOpen={mapPickerOpen}
                initialCoords={form.LocationGPS}
                onClose={() => setMapPickerOpen(false)}
                onSelectCoords={(coords) => setForm((prev: any) => ({ ...prev, LocationGPS: coords }))}
            />

            {/* Applicant List Modal */}
            <ApplicantListModal
                isOpen={!!applicantModalTarget}
                onClose={() => setApplicantModalTarget(null)}
                itemId={applicantModalTarget?.id || ""}
                itemName={applicantModalTarget?.name || ""}
                itemType="training"
            />
        </div>
    );
}
