"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Applicant {
    id: string;
    memberName: string;
    memberPhone: string;
    type: string;
    itemName: string;
    status: string;
    queueNumber?: number;
    appointedDate?: string;
    createdAt: string;
    profileJson?: string;
}

interface ApplicantListModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: string;
    itemName: string;
    itemType: "test" | "training";
}

export default function ApplicantListModal({
    isOpen,
    onClose,
    itemId,
    itemName,
    itemType,
}: ApplicantListModalProps) {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!isOpen || !itemId) return;

        async function fetchApplicants() {
            setLoading(true);
            try {
                const res = await fetch("/api/admin/queues");
                if (res.ok) {
                    const data = await res.json();
                    // Filter by itemId or itemName matching
                    const filtered = data.filter((item: any) => 
                        item.itemId === itemId || 
                        item.itemName?.toLowerCase().trim() === itemName.toLowerCase().trim()
                    );
                    setApplicants(filtered);
                } else {
                    toast.error("ไม่สามารถดึงรายชื่อผู้สมัครได้");
                }
            } catch (error) {
                console.error("Error fetching applicants:", error);
                toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลรายชื่อ");
            } finally {
                setLoading(false);
            }
        }

        fetchApplicants();
    }, [isOpen, itemId, itemName]);

    if (!isOpen) return null;

    const filteredList = applicants.filter(a => 
        a.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.memberPhone?.includes(searchQuery) ||
        (a.queueNumber && a.queueNumber.toString().includes(searchQuery))
    );

    const handlePrint = () => {
        window.print();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between print:hidden">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-lg">
                                <i className={`fa-solid ${itemType === "training" ? "fa-graduation-cap" : "fa-clipboard-check"}`}></i>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-300">
                                    {itemType === "training" ? "รายชื่อผู้สมัครฝึกอบรม" : "รายชื่อผู้สมัครทดสอบมาตรฐาน"}
                                </span>
                                <h2 className="text-base sm:text-lg font-black leading-tight text-white">{itemName}</h2>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                        >
                            <i className="fa-solid fa-xmark text-base"></i>
                        </button>
                    </div>

                    {/* Printable Header Notice (Only visible when printing) */}
                    <div className="hidden print:block p-6 text-slate-900 border-b">
                        <h1 className="text-xl font-bold text-center mb-1">ใบลงชื่อเข้า{itemType === "training" ? "รับการฝึกอบรม" : "รับการทดสอบมาตรฐานฝีมือแรงงาน"}</h1>
                        <p className="text-sm text-center font-semibold text-slate-700">{itemName}</p>
                        <p className="text-xs text-center text-slate-500 mt-1">สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา • วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")}</p>
                    </div>

                    {/* Filter & Toolbar */}
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                        <div className="relative w-full sm:w-72">
                            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อ, เบอร์โทร..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <span className="text-xs text-slate-500 font-semibold mr-2">
                                ทั้งหมด <span className="text-indigo-600 font-bold">{applicants.length}</span> คน
                            </span>
                            <button
                                onClick={handlePrint}
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-print"></i> พิมพ์ใบเซ็นชื่อ
                            </button>
                        </div>
                    </div>

                    {/* Table List */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {loading ? (
                            <div className="py-16 flex flex-col items-center justify-center gap-2">
                                <span className="loading loading-spinner loading-md text-indigo-600"></span>
                                <p className="text-xs font-medium text-slate-400">กำลังโหลดรายชื่อผู้สมัคร...</p>
                            </div>
                        ) : filteredList.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <i className="fa-solid fa-users-slash text-3xl mb-2 opacity-30"></i>
                                <p className="text-xs font-semibold">ยังไม่มีผู้สมัครในรายการนี้</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
                                            <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                                            <th className="py-3 px-3">ชื่อ-นามสกุล</th>
                                            <th className="py-3 px-3">เบอร์โทรศัพท์</th>
                                            <th className="py-3 px-3">วันที่จอง/นัดหมาย</th>
                                            <th className="py-3 px-3 text-center">สถานะ</th>
                                            <th className="py-3 px-3 text-center print:table-cell hidden">ลายมือชื่อ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {filteredList.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                                <td className="py-3 px-3 font-bold text-slate-800">{item.memberName}</td>
                                                <td className="py-3 px-3 font-mono">{item.memberPhone}</td>
                                                <td className="py-3 px-3">
                                                    {item.appointedDate ? (
                                                        <span className="font-semibold text-indigo-600">{item.appointedDate}</span>
                                                    ) : (
                                                        <span className="text-slate-400">{new Date(item.createdAt).toLocaleDateString("th-TH")}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                        {item.status === "confirmed" ? "ยืนยันแล้ว" : item.status === "pending" ? "รอดำเนินการ" : item.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center print:table-cell hidden border-b border-dashed border-slate-300 w-32"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 print:hidden">
                        <span>ข้อมูลอัปเดตแบบ Real-time</span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
