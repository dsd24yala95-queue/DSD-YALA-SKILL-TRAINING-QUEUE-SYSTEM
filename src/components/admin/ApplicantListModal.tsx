"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Applicant {
    id: string;
    userId: string;
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

const STATUS_MAP: { [key: string]: { label: string; cls: string } } = {
    pending: { label: "รอดำเนินการ", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    approved: { label: "ยืนยันแล้ว", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    confirmed: { label: "ยืนยันแล้ว", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    appointed: { label: "นัดหมายแล้ว", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    checked_in: { label: "ลงทะเบียนแล้ว", cls: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
    training: { label: "กำลังอบรม", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    testing: { label: "กำลังทดสอบ", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    completed: { label: "ผ่านการประเมิน", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    passed: { label: "ผ่านการประเมิน", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    failed: { label: "ไม่ผ่าน", cls: "bg-red-50 text-red-700 border-red-200" },
    cancelled: { label: "ยกเลิก", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

function formatThaiDate(dateStr?: string) {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
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
                        (item.itemName && itemName && item.itemName.toLowerCase().trim() === itemName.toLowerCase().trim())
                    );

                    // Deduplicate applicants by memberName + memberPhone or userId (1 person = 1 row)
                    const uniqueMap = new Map<string, Applicant>();
                    filtered.forEach((item: Applicant) => {
                        const key = item.userId || `${item.memberName?.trim()}_${item.memberPhone?.trim()}`;
                        if (!uniqueMap.has(key)) {
                            uniqueMap.set(key, item);
                        }
                    });

                    setApplicants(Array.from(uniqueMap.values()));
                } else {
                    const errData = await res.json().catch(() => ({}));
                    if (res.status === 401 || res.status === 403) {
                        toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบแอดมินใหม่อีกครั้ง");
                    } else {
                        toast.error(errData.error || "ไม่สามารถดึงรายชื่อผู้สมัครได้");
                    }
                }
            } catch (error) {
                console.error("Error fetching applicants:", error);
                toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูลรายชื่อ");
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
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm print:static print:bg-white print:p-0 print:m-0 print:block print:overflow-visible">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none print:max-h-none print:m-0 print:p-0 print:overflow-visible"
                >
                    {/* Header (Hidden when printing) */}
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

                    {/* Official A4 Document Header (Only visible when printing) */}
                    <div className="hidden print:block mb-6 text-slate-900 border-b-2 border-slate-900 pb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา</h1>
                                <p className="text-xs text-slate-600 font-medium">กรมพัฒนาฝีมือแรงงาน กระทรวงแรงงาน</p>
                            </div>
                            <div className="text-right text-xs text-slate-500">
                                <p>วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")}</p>
                                <p>จำนวนผู้ลงชื่อทั้งสิ้น: <strong className="text-black">{filteredList.length}</strong> คน</p>
                            </div>
                        </div>
                        <div className="text-center mt-3 pt-3 border-t border-slate-200">
                            <h2 className="text-base font-bold">
                                ใบลงชื่อเข้าร่วม{itemType === "training" ? "การฝึกอบรมพัฒนาฝีมือแรงงาน" : "การทดสอบมาตรฐานฝีมือแรงงานแห่งชาติ"}
                            </h2>
                            <p className="text-sm font-semibold text-indigo-950 mt-0.5">{itemName}</p>
                        </div>
                    </div>

                    {/* Filter & Toolbar (Hidden when printing) */}
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
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0 print:overflow-visible">
                        {loading ? (
                            <div className="py-16 flex flex-col items-center justify-center gap-2 print:hidden">
                                <span className="loading loading-spinner loading-md text-indigo-600"></span>
                                <p className="text-xs font-medium text-slate-400">กำลังโหลดรายชื่อผู้สมัคร...</p>
                            </div>
                        ) : filteredList.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 print:py-4">
                                <i className="fa-solid fa-users-slash text-3xl mb-2 opacity-30 print:hidden"></i>
                                <p className="text-xs font-semibold">ยังไม่มีผู้สมัครในรายการนี้</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto print:overflow-visible">
                                <table className="w-full text-left text-xs border-collapse print:border print:border-slate-800">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-bold print:bg-slate-100 print:text-black print:border-slate-800">
                                            <th className="py-3 px-3 w-12 text-center print:border print:border-slate-400">ลำดับ</th>
                                            <th className="py-3 px-3 print:border print:border-slate-400">ชื่อ-นามสกุล</th>
                                            <th className="py-3 px-3 print:border print:border-slate-400">เบอร์โทรศัพท์</th>
                                            <th className="py-3 px-3 print:border print:border-slate-400">วันที่นัดหมาย</th>
                                            <th className="py-3 px-3 text-center print:border print:border-slate-400 print:w-44">สถานะ / ตรวจสอบ</th>
                                            <th className="py-3 px-3 text-center print:table-cell hidden print:border print:border-slate-400 w-44">ลายมือชื่อผู้เข้าร่วม</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 print:divide-slate-400 print:text-black">
                                        {filteredList.map((item, idx) => {
                                            const statusInfo = STATUS_MAP[item.status] || { label: item.status, cls: "bg-slate-100 text-slate-600 border-slate-200" };
                                            const displayDate = formatThaiDate(item.appointedDate || item.createdAt);

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors print:hover:bg-transparent">
                                                    <td className="py-3 px-3 text-center font-bold text-slate-400 print:text-black print:border print:border-slate-400">{idx + 1}</td>
                                                    <td className="py-3 px-3 font-bold text-slate-800 print:text-black print:border print:border-slate-400">{item.memberName}</td>
                                                    <td className="py-3 px-3 font-mono print:border print:border-slate-400">{item.memberPhone}</td>
                                                    <td className="py-3 px-3 print:border print:border-slate-400">
                                                        <span className="font-semibold text-slate-800 print:text-black">{displayDate}</span>
                                                    </td>
                                                    <td className="py-3 px-3 text-center print:border print:border-slate-400">
                                                        {/* Interactive status badge for web screen view */}
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.cls} print:hidden`}>
                                                            {statusInfo.label}
                                                        </span>

                                                        {/* Official Checkbox items for paper print view */}
                                                        <div className="hidden print:flex items-center justify-center gap-4 text-[11px] font-mono text-black">
                                                            <span className="inline-flex items-center gap-1">
                                                                <span className="inline-block w-3.5 h-3.5 border-2 border-black rounded-sm"></span> มา
                                                            </span>
                                                            <span className="inline-flex items-center gap-1">
                                                                <span className="inline-block w-3.5 h-3.5 border-2 border-black rounded-sm"></span> ผ่าน
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 text-center print:table-cell hidden print:border print:border-slate-400">
                                                        <div className="border-b border-dashed border-slate-400 h-6 w-36 mx-auto"></div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Official Print Signature Block (Only visible when printing) */}
                        <div className="hidden print:block mt-12 pt-6 text-xs text-black">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="font-semibold">หมายเหตุ:</p>
                                    <p className="text-[11px] text-slate-600">เอกสารนี้สร้างจากระบบบริหารจัดการคิว สพร.24 ยะลา</p>
                                </div>
                                <div className="text-center w-72 space-y-4">
                                    <p>(ลงชื่อ)............................................................................</p>
                                    <p>(............................................................................)</p>
                                    <p className="font-bold">เจ้าหน้าที่ผู้ควบคุมการลงทะเบียน / คุมสอบ</p>
                                    <p>วันที่............/............/..................</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer (Hidden when printing) */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 print:hidden">
                        <span>ข้อมูลอัปเดตแบบ Real-time (กรองคนซ้ำอัตโนมัติ)</span>
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
