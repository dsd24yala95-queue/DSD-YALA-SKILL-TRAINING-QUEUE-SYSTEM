"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Tab = "courses" | "branches";

interface MasterCourse {
    id: string;
    courseName: string;
    durationDays: number;
    maxSeats: number;
    currentQueue: number;
    Date: string;
    LocationName?: string;
    LocationGPS?: string;
    status: "active" | "inactive";
}

interface MasterBranch {
    id: string;
    branchName: string;
    levels: string;
    maxQueue: number;
    LocationName?: string;
    LocationGPS?: string;
    status: "active" | "inactive";
}

const emptyC: Omit<MasterCourse, "id"> = { courseName: "", durationDays: 5, maxSeats: 20, currentQueue: 0, Date: "", LocationName: "", LocationGPS: "", status: "active" };
const emptyB: Omit<MasterBranch, "id"> = { branchName: "", levels: "1,2,3", maxQueue: 20, LocationName: "", LocationGPS: "", status: "active" };

export default function AdminMasterPage() {
    const [tab, setTab] = useState<Tab>("courses");
    const [courses, setCourses] = useState<MasterCourse[]>([]);
    const [branches, setBranches] = useState<MasterBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<any>(null);
    const [form, setForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [cRes, bRes] = await Promise.all([
                fetch("/api/master/courses"),
                fetch("/api/master/branches"),
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
        setSaving(true);
        const endpoint = tab === "courses" ? "/api/master/courses" : "/api/master/branches";
        try {
            const method = editTarget?.id ? "PUT" : "POST";
            const payload = { ...form };
            
            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save data");

            toast.success(editTarget?.id ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มข้อมูลสำเร็จ");
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
        const endpoint = tab === "courses" ? "/api/master/courses" : "/api/master/branches";
        try {
            const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            toast.success("ลบข้อมูลสำเร็จ");
            setDeleteConfirm(null);
            loadData();
        } catch {
            toast.error("เกิดข้อผิดพลาดในการลบ");
        }
    };

    const field = (label: string, key: string, type = "text", opts?: { min?: number }) => (
        <div key={key}>
            <label className="text-xs font-bold text-slate-600 block mb-1">{label}</label>
            <input
                type={type}
                value={form[key] ?? ""}
                min={opts?.min}
                onChange={e => setForm((p: any) => ({ ...p, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
        </div>
    );

    const courseFields = [
        field("ชื่อหลักสูตร", "courseName"),
        field("ระยะเวลา (วัน)", "durationDays", "number", { min: 1 }),
        field("จำนวนที่นั่ง", "maxSeats", "number", { min: 1 }),
        field("วันที่จัดอบรม", "Date"),
        field("สถานที่", "LocationName"),
        field("พิกัดแผนที่ (Lat, Long)", "LocationGPS"),
    ];
    const branchFields = [
        field("ชื่อสาขา", "branchName"),
        field("ระดับทักษะ (เช่น 1,2,3)", "levels"),
        field("จำนวนคิวสูงสุด", "maxQueue", "number", { min: 1 }),
        field("สถานที่สอบ", "LocationName"),
        field("พิกัดแผนที่ (Lat, Long)", "LocationGPS"),
    ];

    const items = tab === "courses" ? courses : branches;

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">หลักสูตร / สาขา</h1>
                    <p className="text-xs text-slate-400 mt-0.5">จัดการข้อมูลหลักสูตรอบรมและสาขาทดสอบมาตรฐาน</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-indigo-500/20">
                    <i className="fa-solid fa-plus"></i> เพิ่มข้อมูล
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {(["courses", "branches"] as Tab[]).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${tab === t ? "bg-white border border-slate-200 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                        <i className={`fa-solid ${t === "courses" ? "fa-book" : "fa-wrench"} mr-2`}></i>
                        {t === "courses" ? `หลักสูตร (${courses.length})` : `สาขาทดสอบ (${branches.length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 py-20 text-center text-slate-400">
                    <i className="fa-solid fa-folder-open text-4xl mb-3 block opacity-30"></i>
                    <p className="text-sm mb-4">ยังไม่มีข้อมูล</p>
                    <button onClick={openAdd} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">+ เพิ่มข้อมูลแรก</button>
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
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${tab === "courses" ? "bg-gradient-to-br from-purple-400 to-pink-500" : "bg-gradient-to-br from-blue-400 to-indigo-600"}`}>
                                        <i className={`fa-solid ${tab === "courses" ? "fa-book" : "fa-tools"} text-white text-sm`}></i>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${item.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-400/20" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                                        {item.status === "active" ? "เปิดรับ" : "ปิด"}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm leading-snug mb-1">{item.courseName || item.branchName}</h3>
                                <div className="space-y-1 mt-2">
                                    {tab === "courses" ? (
                                        <>
                                            <p className="text-[11px] text-slate-500"><i className="fa-regular fa-calendar w-4"></i> {item.Date || "—"}</p>
                                            <p className="text-[11px] text-slate-500"><i className="fa-solid fa-users w-4"></i> {item.currentQueue}/{item.maxSeats} ที่นั่ง</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-[11px] text-slate-500"><i className="fa-solid fa-layer-group w-4"></i> ระดับ {item.levels}</p>
                                            <p className="text-[11px] text-slate-500"><i className="fa-solid fa-users w-4"></i> คิวสูงสุด {item.maxQueue}</p>
                                        </>
                                    )}
                                    {item.LocationName && <p className="text-[11px] text-slate-500"><i className="fa-solid fa-location-dot w-4"></i> {item.LocationName}</p>}
                                </div>
                                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
                                    <button onClick={() => openEdit(item)} className="flex-1 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                        <i className="fa-solid fa-pen mr-1"></i> แก้ไข
                                    </button>
                                    {deleteConfirm === item.id ? (
                                        <div className="flex gap-1.5">
                                            <button onClick={() => handleDelete(item.id)} className="py-1.5 px-3 rounded-xl bg-red-600 text-white text-xs font-bold">ยืนยัน</button>
                                            <button onClick={() => setDeleteConfirm(null)} className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500">ยกเลิก</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(item.id)} className="py-1.5 px-3 rounded-xl border border-red-100 text-xs font-bold text-red-400 hover:bg-red-50 transition-all">
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
                            <h2 className="text-base font-black text-slate-800 mb-5">
                                {editTarget ? "✏️ แก้ไขข้อมูล" : "➕ เพิ่มข้อมูลใหม่"}
                                <span className="ml-2 text-indigo-500 font-bold">{tab === "courses" ? "หลักสูตร" : "สาขาทดสอบ"}</span>
                            </h2>
                            <div className="space-y-3">
                                {(tab === "courses" ? courseFields : branchFields)}
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1">สถานะ</label>
                                    <select
                                        value={form.status ?? "active"}
                                        onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none"
                                    >
                                        <option value="active">เปิดรับ</option>
                                        <option value="inactive">ปิด</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">ยกเลิก</button>
                                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20">
                                    {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
