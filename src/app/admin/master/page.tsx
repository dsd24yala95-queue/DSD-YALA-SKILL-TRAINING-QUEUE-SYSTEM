"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MapLocationPickerModal from "@/components/MapLocationPickerModal";

type Tab = "courses" | "branches";

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

interface MasterBranch {
    id: string;
    branchName: string;
    levels: string;
    maxQueue: number;
    Date: string;
    DateEnd: string;
    LocationName?: string;
    LocationGPS?: string;
    status: "active" | "inactive";
}

const emptyC: Omit<MasterCourse, "id"> = { courseName: "", durationDays: 5, maxSeats: 20, currentQueue: 0, Date: "", DateEnd: "", LocationName: "", LocationGPS: "", status: "active" };
const emptyB: Omit<MasterBranch, "id"> = { branchName: "", levels: "1,2,3", maxQueue: 20, Date: "", DateEnd: "", LocationName: "", LocationGPS: "", status: "active" };

export default function AdminMasterPage() {
    const [tab, setTab] = useState<Tab>("courses");
    const [courses, setCourses] = useState<MasterCourse[]>([]);
    const [branches, setBranches] = useState<MasterBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [mapPickerOpen, setMapPickerOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<any>(null);
    const [form, setForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [cRes, bRes] = await Promise.all([
                fetch("/api/admin/master/courses"),
                fetch("/api/admin/master/branches"),
            ]);
            
            if (cRes.ok) setCourses(await cRes.json());
            if (bRes.ok) setBranches(await bRes.json());
        } catch {
            toast.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const openAdd = () => {
        setEditTarget(null);
        setForm(tab === "courses" ? { ...emptyC } : { ...emptyB });
        setModalOpen(true);
    };

    const openEdit = (item: any) => {
        setEditTarget(item);
        setForm({ ...item });
        setModalOpen(true);
    };

    const handleSave = async () => {
        const isC = tab === "courses";
        const nameKey = isC ? "courseName" : "branchName";

        if (!form[nameKey]?.trim()) {
            toast.error(`กรุณากรอก${isC ? "ชื่อหลักสูตร" : "ชื่อสาขาทดสอบ"}`);
            return;
        }

        setSaving(true);
        try {
            const endpoint = isC ? "/api/admin/master/courses" : "/api/admin/master/branches";
            const method = editTarget ? "PUT" : "POST";
            const payload = editTarget ? { ...form, id: editTarget.id } : form;
            
            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save data");

            toast.success(editTarget ? "บันทึกการแก้ไขแล้ว" : "เพิ่มข้อมูลใหม่เรียบร้อย");
            setModalOpen(false);
            loadData();
        } catch (e: any) {
            console.error("Save error:", e);
            toast.error("เกิดข้อผิดพลาดในการบันทึก: " + (e.message || "Unknown error"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const isC = tab === "courses";
        const endpoint = isC ? `/api/admin/master/courses?id=${id}` : `/api/admin/master/branches?id=${id}`;
        try {
            const res = await fetch(endpoint, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            toast.success("ลบข้อมูลสำเร็จ");
            setDeleteConfirm(null);
            loadData();
        } catch {
            toast.error("เกิดข้อผิดพลาดในการลบ");
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

    const field = (label: string, key: string, type = "text", opts?: { min?: number; icon?: string }) => {
        if (key === "LocationGPS") {
            return (
                <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-600">
                            <i className="fa-solid fa-location-crosshairs mr-1 text-indigo-500"></i>
                            {label}
                        </label>
                    </div>

                    <div className="flex gap-2 mb-1.5">
                        <input
                            type="text"
                            placeholder="เช่น 6.541094, 101.280388"
                            value={form[key] ?? ""}
                            onChange={e => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all font-mono"
                        />
                        <button
                            type="button"
                            onClick={() => setMapPickerOpen(true)}
                            className="px-3.5 py-2.5 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95"
                            title="เลือกปักหมุดบนแผนที่"
                        >
                            <i className="fa-solid fa-map-location-dot"></i>
                            <span className="hidden sm:inline">ปักหมุดแผนที่</span>
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        <button
                            type="button"
                            onClick={() => setForm((p: any) => ({ ...p, LocationGPS: "6.541094, 101.280388" }))}
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
            );
        }

        return (
            <div key={key}>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                    {opts?.icon && <i className={`${opts.icon} mr-1 text-indigo-500`}></i>}
                    {label}
                </label>
                <input
                    type={type}
                    value={form[key] ?? ""}
                    min={opts?.min}
                    onChange={e => setForm((p: any) => ({ ...p, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all"
                />
            </div>
        );
    };

    const courseFields = [
        field("ชื่อหลักสูตร", "courseName"),
        field("ระยะเวลา (วัน)", "durationDays", "number", { min: 1 }),
        field("จำนวนที่นั่ง", "maxSeats", "number", { min: 1 }),
        field("วันที่เริ่มอบรม", "Date", "date", { icon: "fa-regular fa-calendar-check" }),
        field("วันที่สิ้นสุดอบรม", "DateEnd", "date", { icon: "fa-regular fa-calendar-xmark" }),
        field("สถานที่จัดอบรม", "LocationName"),
        field("พิกัดแผนที่ (Lat, Long)", "LocationGPS"),
    ];
    const branchFields = [
        field("ชื่อสาขาทดสอบ", "branchName"),
        field("ระดับทักษะ (เช่น 1,2,3)", "levels"),
        field("จำนวนคิวสูงสุด", "maxQueue", "number", { min: 1 }),
        field("วันที่เริ่มทดสอบ", "Date", "date", { icon: "fa-regular fa-calendar-check" }),
        field("วันที่สิ้นสุดทดสอบ", "DateEnd", "date", { icon: "fa-regular fa-calendar-xmark" }),
        field("สถานที่สอบ", "LocationName"),
        field("พิกัดแผนที่ (Lat, Long)", "LocationGPS"),
    ];

    const items = tab === "courses" ? courses : branches;

    const formatDateRange = (startDate?: string, endDate?: string) => {
        if (!startDate && !endDate) return "—";
        if (startDate && endDate) return `${startDate} ถึง ${endDate}`;
        return startDate || endDate || "—";
    };

    return (
        <div className="p-4 sm:p-6 bg-[#f8fafc] min-h-screen font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">หลักสูตร / สาขา</h1>
                    <p className="text-xs text-slate-400 mt-0.5">จัดการข้อมูลหลักสูตรอบรมและสาขาทดสอบมาตรฐานฝีมือแรงงาน</p>
                </div>
                <button onClick={openAdd} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95">
                    <i className="fa-solid fa-plus"></i> เพิ่มข้อมูล
                </button>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {(["courses", "branches"] as Tab[]).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${tab === t ? "bg-white border border-slate-200 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                        <i className={`fa-solid ${t === "courses" ? "fa-book" : "fa-wrench"} mr-2`}></i>
                        {t === "courses" ? `หลักสูตร (${courses.length})` : `สาขาทดสอบ (${branches.length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="text-xs text-slate-400">กำลังโหลดข้อมูล...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 py-20 text-center text-slate-400 p-4">
                    <i className="fa-solid fa-folder-open text-4xl mb-3 block opacity-30"></i>
                    <p className="text-sm mb-4">ยังไม่มีข้อมูลในระบบ</p>
                    <button onClick={openAdd} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20">+ เพิ่มข้อมูลแรก</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {items.map((item: any, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${tab === "courses" ? "bg-gradient-to-br from-purple-400 to-pink-500" : "bg-gradient-to-br from-blue-400 to-indigo-600"}`}>
                                            <i className={`fa-solid ${tab === "courses" ? "fa-book" : "fa-tools"} text-white text-sm`}></i>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${item.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-400/20" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                                            {item.status === "active" ? "เปิดรับ" : "ปิด"}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug mb-2">{item.courseName || item.branchName}</h3>

                                    <div className="space-y-1.5 mt-2">
                                        <p className="text-[12px] font-semibold text-slate-600 flex items-center gap-1.5">
                                            <i className="fa-regular fa-calendar text-indigo-500 shrink-0"></i>
                                            <span>{formatDateRange(item.Date, item.DateEnd)}</span>
                                        </p>

                                        {tab === "courses" ? (
                                            <>
                                                <p className="text-[11px] text-slate-500"><i className="fa-solid fa-clock w-4 text-purple-400"></i> ระยะเวลา {item.durationDays} วัน</p>
                                                <p className="text-[11px] text-slate-500"><i className="fa-solid fa-users w-4 text-pink-400"></i> {item.currentQueue}/{item.maxSeats} ที่นั่ง</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-[11px] text-slate-500"><i className="fa-solid fa-layer-group w-4 text-blue-400"></i> ระดับ {item.levels}</p>
                                                <p className="text-[11px] text-slate-500"><i className="fa-solid fa-users w-4 text-indigo-400"></i> คิวสูงสุด {item.maxQueue} ต่อวัน</p>
                                            </>
                                        )}

                                        {item.LocationName && <p className="text-[11px] text-slate-500 truncate"><i className="fa-solid fa-location-dot w-4 text-rose-400"></i> {item.LocationName}</p>}
                                        {item.LocationGPS && (
                                            <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 truncate">
                                                <i className="fa-solid fa-map-pin text-indigo-500 shrink-0"></i>
                                                <span>{item.LocationGPS}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
                                    <button onClick={() => openEdit(item)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                        <i className="fa-solid fa-pen mr-1"></i> แก้ไข
                                    </button>
                                    {deleteConfirm === item.id ? (
                                        <div className="flex gap-1.5">
                                            <button onClick={() => handleDelete(item.id)} className="py-2 px-3 rounded-xl bg-red-600 text-white text-xs font-bold shadow-sm">ยืนยัน</button>
                                            <button onClick={() => setDeleteConfirm(null)} className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500">ยกเลิก</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(item.id)} className="py-2 px-3 rounded-xl border border-red-100 text-xs font-bold text-red-400 hover:bg-red-50 transition-all">
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {modalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                                <h2 className="text-base sm:text-lg font-black text-slate-800">
                                    {editTarget ? "✏️ แก้ไขข้อมูล" : "➕ เพิ่มข้อมูลใหม่"}
                                    <span className="ml-2 text-indigo-600 font-bold">{tab === "courses" ? "หลักสูตรอบรม" : "สาขาทดสอบ"}</span>
                                </h2>
                                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>

                            <div className="space-y-3.5">
                                {(tab === "courses" ? courseFields : branchFields)}
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1">สถานะเปิดรับสมัคร</label>
                                    <select
                                        value={form.status ?? "active"}
                                        onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    >
                                        <option value="active">เปิดรับสมัคร</option>
                                        <option value="inactive">ปิดรับสมัคร</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">ยกเลิก</button>
                                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20 active:scale-95">
                                    {saving ? "กำลังบันทึก..." : "💾 บันทึกข้อมูล"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <MapLocationPickerModal
                isOpen={mapPickerOpen}
                initialCoords={form.LocationGPS}
                onClose={() => setMapPickerOpen(false)}
                onSelectCoords={(coords) => setForm((prev: any) => ({ ...prev, LocationGPS: coords }))}
            />
        </div>
    );
}
