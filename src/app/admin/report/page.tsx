"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ReportStats {
    totalMembers: number;
    totalQueues: number;
    pendingQueues: number;
    confirmedQueues: number;
    completedQueues: number;
    cancelledQueues: number;
    testQueues: number;
    trainingQueues: number;
    topCourses: { name: string; count: number }[];
    topBranches: { name: string; count: number }[];
    recentActivity: { label: string; count: number; color: string }[];
}

export default function AdminReportPage() {
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [rawQueues, setRawQueues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState("");

    const loadReport = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, queuesRes] = await Promise.all([
                fetch("/api/users?role=member"),
                fetch("/api/admin/queues"),
            ]);

            const members = usersRes.ok ? await usersRes.json() : [];
            const queues = queuesRes.ok ? await queuesRes.json() : [];

            let pending = 0, confirmed = 0, completed = 0, cancelled = 0;
            let testQ = 0, trainingQ = 0;
            const courseCount: Record<string, number> = {};
            const branchCount: Record<string, number> = {};

            queues.forEach((q: any) => {
                const status = q.status || "pending";
                if (status === "pending") pending++;
                else if (["confirmed", "approved", "appointed"].includes(status)) confirmed++;
                else if (["completed", "passed"].includes(status)) completed++;
                else if (status === "cancelled") cancelled++;

                if (q.type === "test") {
                    testQ++;
                    const name = q.itemName || "ไม่ระบุ";
                    branchCount[name] = (branchCount[name] || 0) + 1;
                } else if (q.type === "training") {
                    trainingQ++;
                    const name = q.itemName || "ไม่ระบุ";
                    courseCount[name] = (courseCount[name] || 0) + 1;
                }
            });

            const topCourses = Object.entries(courseCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }));

            const topBranches = Object.entries(branchCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }));

            setStats({
                totalMembers: members.length,
                totalQueues: queues.length,
                pendingQueues: pending,
                confirmedQueues: confirmed,
                completedQueues: completed,
                cancelledQueues: cancelled,
                testQueues: testQ,
                trainingQueues: trainingQ,
                topCourses,
                topBranches,
                recentActivity: [
                    { label: "รอดำเนินการ", count: pending, color: "bg-amber-500" },
                    { label: "อนุมัติแล้ว", count: confirmed, color: "bg-blue-500" },
                    { label: "เสร็จสิ้น", count: completed, color: "bg-emerald-500" },
                    { label: "ยกเลิก", count: cancelled, color: "bg-red-400" },
                ],
            });
            setRawQueues(queues);
            setLastUpdated(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }));
        } catch {
            toast.error("ไม่สามารถโหลดรายงานได้");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleExportExcel = async () => {
        if (!rawQueues || rawQueues.length === 0) {
            toast.error("ไม่มีข้อมูลสำหรับส่งออก");
            return;
        }

        const tid = toast.loading("กำลังสร้างไฟล์ Excel...");
        try {
            // Fetch additional data
            const [usersRes, branchRes, courseRes] = await Promise.all([
                fetch("/api/users?role=member"),
                fetch("/api/master/branches"),
                fetch("/api/master/courses"),
            ]);
            const members = usersRes.ok ? await usersRes.json() : [];
            const branches = branchRes.ok ? await branchRes.json() : [];
            const courses = courseRes.ok ? await courseRes.json() : [];

            const wb = XLSX.utils.book_new();

            // --- Sheet 1: Members ---
            const membersData = members.map((m: any, i: number) => ({
                "ลำดับ": i + 1,
                "memberId": m.memberId || "-",
                "ชื่อ-นามสกุล": m.fullName || "-",
                "เบอร์โทรศัพท์": m.phoneNumber || "-",
                "อีเมล": m.email || "-",
                "วันที่สมัคร": m.createdAt ? new Date(m.createdAt).toLocaleDateString("th-TH") : "-",
            }));
            const wsMembers = XLSX.utils.json_to_sheet(membersData);
            wsMembers['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 30 }, { wch: 16 }, { wch: 30 }, { wch: 16 }];
            XLSX.utils.book_append_sheet(wb, wsMembers, "Members");

            // --- Sheet 2: TestQueue ---
            const testQueues = rawQueues.filter((q: any) => q.type === "test");
            const testData = testQueues.map((q: any, i: number) => ({
                "ลำดับ": i + 1,
                "หมายเลขคิว": q.id?.slice(0, 8).toUpperCase() || "-",
                "memberId": q.userId || "-",
                "ชื่อสมาชิก": q.memberName || q.user?.fullName || "-",
                "เบอร์โทรศัพท์": q.memberPhone || "-",
                "สาขาที่ทดสอบ": q.itemName || "-",
                "ระดับ": q.level || 1,
                "สถานะ": q.status || "-",
                "วันที่นัดหมาย": q.appointedDate ? new Date(q.appointedDate).toLocaleDateString("th-TH") : "-",
                "ยืนยันรับทราบ": q.isAcknowledged ? "ใช่" : "ยังไม่",
                "วันที่สมัคร": q.createdAt ? new Date(q.createdAt).toLocaleDateString("th-TH") : "-",
            }));
            const wsTest = XLSX.utils.json_to_sheet(testData.length ? testData : [{ "หมายเหตุ": "ไม่มีข้อมูล" }]);
            wsTest['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 28 }, { wch: 16 }, { wch: 35 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 16 }];
            XLSX.utils.book_append_sheet(wb, wsTest, "TestQueue");

            // --- Sheet 3: TrainingQueue ---
            const trainingQueues = rawQueues.filter((q: any) => q.type === "training");
            const trainingData = trainingQueues.map((q: any, i: number) => ({
                "ลำดับ": i + 1,
                "หมายเลขคิว": q.id?.slice(0, 8).toUpperCase() || "-",
                "memberId": q.userId || "-",
                "ชื่อสมาชิก": q.memberName || q.user?.fullName || "-",
                "เบอร์โทรศัพท์": q.memberPhone || "-",
                "หลักสูตร": q.itemName || "-",
                "สถานะ": q.status || "-",
                "วันที่นัดหมาย": q.appointedDate ? new Date(q.appointedDate).toLocaleDateString("th-TH") : "-",
                "ยืนยันรับทราบ": q.isAcknowledged ? "ใช่" : "ยังไม่",
                "วันที่สมัคร": q.createdAt ? new Date(q.createdAt).toLocaleDateString("th-TH") : "-",
            }));
            const wsTraining = XLSX.utils.json_to_sheet(trainingData.length ? trainingData : [{ "หมายเหตุ": "ไม่มีข้อมูล" }]);
            wsTraining['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 28 }, { wch: 16 }, { wch: 35 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 16 }];
            XLSX.utils.book_append_sheet(wb, wsTraining, "TrainingQueue");

            // --- Sheet 4: MasterBranch ---
            const branchData = branches.map((b: any, i: number) => ({
                "ลำดับ": i + 1,
                "ชื่อสาขาช่าง": b.branchName || "-",
                "ระดับ": b.levels || "-",
                "จำนวนคิวสูงสุด": b.maxQueue || 0,
                "สถานะ": b.status === "active" ? "เปิดให้บริการ" : "ปิด",
                "พิกัดที่ตั้ง": b.LocationName || "-",
                "GPS": b.LocationGPS || "-",
            }));
            const wsBranch = XLSX.utils.json_to_sheet(branchData.length ? branchData : [{ "หมายเหตุ": "ไม่มีข้อมูล" }]);
            wsBranch['!cols'] = [{ wch: 8 }, { wch: 40 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 50 }, { wch: 30 }];
            XLSX.utils.book_append_sheet(wb, wsBranch, "MasterBranch");

            // --- Sheet 5: MasterCourse ---
            const courseData = courses.map((c: any, i: number) => ({
                "ลำดับ": i + 1,
                "ชื่อหลักสูตร": c.courseName || "-",
                "ระยะเวลา (วัน)": c.durationDays || 0,
                "ที่นั่งสูงสุด": c.maxSeats || 0,
                "วันอบรมเริ่ม": c.Date || "-",
                "วันอบรมสิ้นสุด": c.DateEnd || "-",
                "สถานะ": c.status === "active" ? "เปิดให้บริการ" : "ปิด",
                "สถานที่อบรม": c.LocationName || "-",
                "GPS": c.LocationGPS || "-",
            }));
            const wsCourse = XLSX.utils.json_to_sheet(courseData.length ? courseData : [{ "หมายเหตุ": "ไม่มีข้อมูล" }]);
            wsCourse['!cols'] = [{ wch: 8 }, { wch: 45 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 50 }, { wch: 30 }];
            XLSX.utils.book_append_sheet(wb, wsCourse, "MasterCourse");

            // Write file
            const dateStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `DSD_YALA_QUEUE_REPORT_${dateStr}.xlsx`);
            toast.success("ดาวน์โหลดไฟล์ Excel สำเร็จ (5 Sheet)", { id: tid });
        } catch (e) {
            console.error(e);
            toast.error("เกิดข้อผิดพลาดในการสร้างไฟล์", { id: tid });
        }
    };

    const handlePrintPDF = () => {
        window.print();
    };

    useEffect(() => { loadReport(); }, [loadReport]);

    if (loading) return (
        <div className="p-6 min-h-screen bg-[#f8fafc] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-sm text-slate-400">กำลังสรุปรายงาน...</p>
            </div>
        </div>
    );

    const s = stats!;
    const maxQ = Math.max(...s.recentActivity.map(r => r.count), 1);

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen font-sans print:bg-white print:p-0">
            {/* Style for print */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 1cm; size: A4 portrait; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-hide { display: none !important; }
                    .print-shadow-none { box-shadow: none !important; border-color: #e2e8f0 !important; }
                    .print-break-inside-avoid { break-inside: avoid; }
                }
            `}} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">รายงานสรุปภาพรวม</h1>
                    <p className="text-xs text-slate-400 mt-0.5">ข้อมูลสถิติการใช้งานระบบ สพร.24 ยะลา • อัปเดตล่าสุด {lastUpdated}</p>
                </div>
                <div className="flex items-center gap-2 print-hide">
                    <button onClick={loadReport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <i className="fa-solid fa-rotate-right"></i> รีเฟรช
                    </button>
                    <button onClick={handlePrintPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-all shadow-sm">
                        <i className="fa-solid fa-file-pdf"></i> PDF
                    </button>
                    <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm">
                        <i className="fa-solid fa-file-excel"></i> Excel
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "สมาชิกทั้งหมด", value: s.totalMembers, icon: "fa-users", gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-50", text: "text-blue-600" },
                    { label: "คิวทั้งหมด", value: s.totalQueues, icon: "fa-list-check", gradient: "from-violet-500 to-purple-600", bg: "bg-violet-50", text: "text-violet-600" },
                    { label: "เสร็จสิ้นแล้ว", value: s.completedQueues, icon: "fa-circle-check", gradient: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", text: "text-emerald-600" },
                    { label: "รอดำเนินการ", value: s.pendingQueues, icon: "fa-clock", gradient: "from-amber-400 to-orange-500", bg: "bg-amber-50", text: "text-amber-600" },
                ].map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-md`}>
                            <i className={`fa-solid ${card.icon} text-white text-sm`}></i>
                        </div>
                        <p className="text-3xl font-black text-slate-800 leading-none mb-1">{card.value.toLocaleString("th-TH")}</p>
                        <p className="text-xs text-slate-400 font-semibold">{card.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Queue Status Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm lg:col-span-1"
                >
                    <h2 className="text-sm font-black text-slate-800 mb-5">สัดส่วนสถานะคิว</h2>
                    <div className="space-y-3.5">
                        {s.recentActivity.map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="font-semibold text-slate-600">{item.label}</span>
                                    <span className="font-black text-slate-800">{item.count}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.count / maxQ) * 100}%` }}
                                        transition={{ delay: 0.4 + i * 0.1, duration: 0.7, ease: "easeOut" }}
                                        className={`h-full rounded-full ${item.color}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 pt-5 border-t border-slate-100">
                        <h3 className="text-xs font-black text-slate-600 mb-3">ประเภทบริการ</h3>
                        <div className="flex gap-3">
                            <div className="flex-1 bg-blue-50 rounded-2xl p-3 text-center border border-blue-100">
                                <p className="text-2xl font-black text-blue-700">{s.testQueues}</p>
                                <p className="text-[10px] text-blue-500 font-semibold mt-0.5">ทดสอบมาตรฐาน</p>
                            </div>
                            <div className="flex-1 bg-purple-50 rounded-2xl p-3 text-center border border-purple-100">
                                <p className="text-2xl font-black text-purple-700">{s.trainingQueues}</p>
                                <p className="text-[10px] text-purple-500 font-semibold mt-0.5">ฝึกอบรม</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Top Courses */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"
                >
                    <h2 className="text-sm font-black text-slate-800 mb-5">
                        <i className="fa-solid fa-book text-purple-500 mr-2"></i>
                        หลักสูตรที่ได้รับความนิยม
                    </h2>
                    {s.topCourses.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-8">ยังไม่มีข้อมูล</p>
                    ) : (
                        <div className="space-y-3">
                            {s.topCourses.map((c, i) => {
                                const maxC = s.topCourses[0].count;
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs font-black text-slate-400 w-4 shrink-0">#{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">{c.name}</p>
                                            <div className="h-1.5 bg-slate-100 rounded-full mt-1">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(c.count / maxC) * 100}%` }}
                                                    transition={{ delay: 0.5 + i * 0.08, duration: 0.6 }}
                                                    className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-slate-800 shrink-0">{c.count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Top Branches */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"
                >
                    <h2 className="text-sm font-black text-slate-800 mb-5">
                        <i className="fa-solid fa-certificate text-blue-500 mr-2"></i>
                        สาขาทดสอบที่ได้รับความนิยม
                    </h2>
                    {s.topBranches.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-8">ยังไม่มีข้อมูล</p>
                    ) : (
                        <div className="space-y-3">
                            {s.topBranches.map((b, i) => {
                                const maxB = s.topBranches[0].count;
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs font-black text-slate-400 w-4 shrink-0">#{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">{b.name}</p>
                                            <div className="h-1.5 bg-slate-100 rounded-full mt-1">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(b.count / maxB) * 100}%` }}
                                                    transition={{ delay: 0.5 + i * 0.08, duration: 0.6 }}
                                                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-slate-800 shrink-0">{b.count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Export Action Section (Visible only on screen, hidden on print) */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 print-hide mt-12 shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 shadow-inner">
                    <i className="fa-solid fa-file-export text-xl"></i>
                </div>
                <div className="flex-1 text-center md:text-left">
                    <p className="text-lg font-black text-white">ส่งออกรายงานฉบับสมบูรณ์</p>
                    <p className="text-sm text-slate-300 mt-1">คุณสามารถดาวน์โหลดข้อมูลทั้งหมดในรูปแบบตาราง Excel หรือพิมพ์เป็น PDF เพื่อนำไปเสนอผู้บริหารได้ทันที</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={handleExportExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-emerald-500/20">
                        <i className="fa-solid fa-file-excel"></i> ดาวน์โหลด Excel
                    </button>
                    <button onClick={handlePrintPDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-sm font-bold transition-all">
                        <i className="fa-solid fa-print"></i> พิมพ์ PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
