"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

interface NewsArticle {
    id: string;
    title: string;
    category: "training" | "testing" | "general";
    categoryLabel: string;
    date: string;
    summary: string;
    content: string;
    image: string;
    badgeColor: string;
    pinned?: boolean;
    status?: string;
}

export default function AdminNewsPage() {
    const [newsList, setNewsList] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<string>("all");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        category: "training" as "training" | "testing" | "general",
        summary: "",
        content: "",
        image: "",
        pinned: false,
    });
    const [submitting, setSubmitting] = useState(false);

    // Delete confirmation state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Load news items
    const loadNews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/news");
            if (res.ok) {
                const data = await res.json();
                setNewsList(data);
            } else {
                toast.error("ไม่สามารถโหลดรายการข่าวสารได้");
            }
        } catch (e) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูลข่าวสาร");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNews();
    }, [loadNews]);

    // Filter news items
    const filteredNews = newsList.filter((item) => {
        const matchesCategory = activeTab === "all" || item.category === activeTab;
        const matchesSearch =
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.summary.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Open add modal
    const handleOpenAdd = () => {
        setModalMode("add");
        setEditingId(null);
        setFormData({
            title: "",
            category: "training",
            summary: "",
            content: "",
            image: "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&q=80&w=800",
            pinned: false,
        });
        setShowModal(true);
    };

    // Open edit modal
    const handleOpenEdit = (item: NewsArticle) => {
        setModalMode("edit");
        setEditingId(item.id);
        setFormData({
            title: item.title,
            category: item.category,
            summary: item.summary,
            content: item.content,
            image: item.image,
            pinned: !!item.pinned,
        });
        setShowModal(true);
    };

    // Quick toggle pin status
    const handleTogglePin = async (item: NewsArticle) => {
        const newPinned = !item.pinned;
        try {
            const res = await fetch("/api/news", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: item.id,
                    pinned: newPinned,
                }),
            });
            if (!res.ok) throw new Error("Pin update failed");
            toast.success(newPinned ? `ปักหมุดข่าว "${item.title}" ขึ้นหน้าแรกแล้ว` : `เลิกปักหมุดข่าว "${item.title}" แล้ว`);
            loadNews();
        } catch (e: any) {
            toast.error("ไม่สามารถอัปเดตการปักหมุดได้");
        }
    };

    // Form submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            toast.error("กรุณากรอกหัวข้อข่าวและเนื้อหาให้ครบถ้วน");
            return;
        }

        setSubmitting(true);
        const tid = toast.loading(modalMode === "add" ? "กำลังบันทึกข่าวประกาศใหม่..." : "กำลังอัปเดตข่าวประกาศ...");

        try {
            const url = "/api/news";
            const method = modalMode === "add" ? "POST" : "PUT";
            const payload =
                modalMode === "add"
                    ? formData
                    : { id: editingId, ...formData };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Operation failed");
            }

            toast.success(modalMode === "add" ? "เพิ่มข่าวประกาศใหม่สำเร็จ!" : "อัปเดตข่าวประกาศสำเร็จ!", { id: tid });
            setShowModal(false);
            loadNews();
        } catch (err: any) {
            toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกข่าวประกาศ", { id: tid });
        } finally {
            setSubmitting(false);
        }
    };

    // Delete handler
    const handleDelete = async (id: string) => {
        const tid = toast.loading("กำลังลบข่าวประกาศ...");
        try {
            const res = await fetch(`/api/news?id=${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            toast.success("ลบข่าวประกาศเรียบร้อยแล้ว", { id: tid });
            setDeletingId(null);
            loadNews();
        } catch (e: any) {
            toast.error("ไม่สามารถลบข่าวประกาศได้", { id: tid });
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-[#f8fafc] min-h-screen font-sans">
            {/* Top Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <i className="fa-solid fa-newspaper text-indigo-600"></i>
                        จัดการข่าวสารและประกาศ
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                        ระบบจัดการข่าวประชาสัมพันธ์ ข่าวฝึกอบรม และประกาศ สพร.24 ยะลา
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                    >
                        <i className="fa-solid fa-plus"></i> เพิ่มข่าวประกาศใหม่
                    </button>
                </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Category Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
                    {[
                        { id: "all", label: "ทั้งหมด" },
                        { id: "training", label: "ข่าวฝึกอบรม" },
                        { id: "testing", label: "ข่าวทดสอบมาตรฐาน" },
                        { id: "general", label: "ข่าวประชาสัมพันธ์" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeTab === tab.id
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                        type="text"
                        placeholder="ค้นหาหัวข้อข่าว..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                </div>
            </div>

            {/* News Cards Grid */}
            {loading ? (
                <div className="py-24 text-center">
                    <span className="loading loading-spinner loading-lg text-indigo-600 mb-2"></span>
                    <p className="text-xs font-bold text-slate-400">กำลังโหลดข่าวสาร...</p>
                </div>
            ) : filteredNews.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400">
                    <i className="fa-regular fa-newspaper text-5xl mb-3 text-slate-300"></i>
                    <p className="text-sm font-bold text-slate-600">ไม่พบข่าวประกาศที่ค้นหา</p>
                    <p className="text-xs text-slate-400 mt-1">สามารถกดปุ่ม "เพิ่มข่าวประกาศใหม่" เพื่อเริ่มสร้างประกาศได้</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNews.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div>
                                {/* Image Container */}
                                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as any).src =
                                                "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&q=80&w=800";
                                        }}
                                    />
                                    <span
                                        className={`absolute top-3 left-3 text-[10px] font-bold px-3 py-1 rounded-full border backdrop-blur-md bg-white/90 shadow-sm ${item.badgeColor}`}
                                    >
                                        {item.categoryLabel}
                                    </span>
                                    {item.pinned && (
                                        <span className="absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-md flex items-center gap-1">
                                            <i className="fa-solid fa-thumbtack text-[9px]"></i> ปักหมุดหน้าแรก
                                        </span>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="p-5">
                                    <p className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                        <i className="fa-regular fa-calendar text-[10px]"></i>
                                        {item.date}
                                    </p>
                                    <h3 className="text-base font-extrabold text-slate-900 leading-snug mb-2 line-clamp-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-3">
                                        {item.summary}
                                    </p>
                                </div>
                            </div>

                            {/* Card Actions */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleTogglePin(item)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                        item.pinned
                                            ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                    <i className={`fa-solid fa-thumbtack ${item.pinned ? "text-amber-600" : "text-slate-400"}`}></i>
                                    {item.pinned ? "ยกเลิกปักหมุด" : "ปักหมุด"}
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEdit(item)}
                                        className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-all text-xs font-bold flex items-center gap-1"
                                    >
                                        <i className="fa-solid fa-pen-to-square"></i> แก้ไข
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeletingId(item.id)}
                                        className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-all text-xs font-bold"
                                    >
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add / Edit News Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <i className="fa-solid fa-newspaper text-indigo-600"></i>
                                    {modalMode === "add" ? "เพิ่มข่าวประกาศใหม่" : "แก้ไขข่าวประกาศ"}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        หัวข้อข่าว / ประกาศ <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="เช่น เปิดรับสมัครฝึกอบรมยกระดับฝีมือแรงงาน..."
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่ข่าวสาร</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) =>
                                                setFormData({ ...formData, category: e.target.value as any })
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none"
                                        >
                                            <option value="training">ข่าวฝึกอบรม</option>
                                            <option value="testing">ข่าวทดสอบมาตรฐาน</option>
                                            <option value="general">ข่าวประชาสัมพันธ์ทั่วไป</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">รูปภาพประกอบ (URL)</label>
                                        <input
                                            type="text"
                                            placeholder="https://images.unsplash.com/..."
                                            value={formData.image}
                                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">สรุปข่าวสั้น (Summary)</label>
                                    <input
                                        type="text"
                                        placeholder="สรุปเนื้อหาสั้นๆ สำหรับแสดงบนหน้าการ์ด..."
                                        value={formData.summary}
                                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        เนื้อหาข่าวแบบเต็ม (Full Content) <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={6}
                                        placeholder="พิมพ์เนื้อหาข่าว ประกาศ รายละเอียด คุณสมบัติผู้สมัคร และกำหนดการ..."
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                        required
                                    ></textarea>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">📌 ปักหมุดข่าวสำคัญ</p>
                                        <p className="text-[11px] text-slate-500">แสดงข่าวนี้โดดเด่นบนแถบปักหมุดหน้าแรกของระบบ</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.pinned}
                                        onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                                        className="toggle toggle-indigo toggle-sm"
                                    />
                                </div>

                                <div className="flex gap-3 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <><span className="loading loading-spinner loading-xs"></span> กำลังบันทึก...</>
                                        ) : (
                                            <><i className="fa-solid fa-floppy-disk"></i> บันทึกข่าวประกาศ</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 text-2xl">
                                <i className="fa-solid fa-trash-can"></i>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 mb-1">ยืนยันการลบข่าวประกาศ?</h3>
                            <p className="text-xs text-slate-500 mb-6">ข่าวนี้จะถูกลบออกจากระบบ และไม่แสดงผลบนหน้าเว็บไซต์อีกต่อไป</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingId(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={() => handleDelete(deletingId)}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
                                >
                                    ยืนยันลบ
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
