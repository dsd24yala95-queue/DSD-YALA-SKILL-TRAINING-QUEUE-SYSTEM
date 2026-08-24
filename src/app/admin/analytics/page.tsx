"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface AnalyticsData {
    kpis: {
        totalBookings: number;
        completedBookings: number;
        approvedBookings: number;
        pendingBookings: number;
        cancelledBookings: number;
        completionRate: number;
        avgWaitMinutes: number;
        avgServiceMinutes: number;
    };
    categories: {
        training: number;
        testing: number;
    };
    topPopularItems: Array<{ name: string; count: number; type: string }>;
    yalaDistricts: Array<{ district: string; count: number }>;
    dayOfWeekData: Array<{ day: string; count: number }>;
    hourlyData: Array<{ hour: string; count: number }>;
}

export default function AdminAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/analytics");
            if (!res.ok) throw new Error("Failed to load analytics");
            const result = await res.json();
            setData(result);
        } catch {
            toast.error("ไม่สามารถโหลดข้อมูลสถิติได้");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // ===== Export CSV Summary =====
    const handleExportCSV = () => {
        if (!data) return;
        let csvContent = "\uFEFF"; // UTF-8 BOM for Excel Thai language support
        csvContent += "รายงานสรุปสถิติผู้บริหาร — สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา\n";
        csvContent += `วันที่ออกรายงาน: ${new Date().toLocaleDateString("th-TH")}\n\n`;

        csvContent += "=== ตัวเลขชี้วัดสำคัญ (KPIs) ===\n";
        csvContent += `ยอดการจองคิวรวมทั้งหมด,${data.kpis.totalBookings},รายการ\n`;
        csvContent += `ให้บริการสำเร็จแล้ว,${data.kpis.completedBookings},รายการ (${data.kpis.completionRate}%)\n`;
        csvContent += `อนุมัตินัดหมายแล้ว,${data.kpis.approvedBookings},รายการ\n`;
        csvContent += `รอดำเนินการ,${data.kpis.pendingBookings},รายการ\n`;
        csvContent += `ยกเลิกการจอง,${data.kpis.cancelledBookings},รายการ\n`;
        csvContent += `เวลาคอยคิวเฉลี่ย,${data.kpis.avgWaitMinutes},นาที\n`;
        csvContent += `เวลาให้บริการเฉลี่ย,${data.kpis.avgServiceMinutes},นาที\n\n`;

        csvContent += "=== สถิติแยกตามหมวดหมู่ ===\n";
        csvContent += `หลักสูตรฝึกอบรมทักษะอาชีพ,${data.categories.training},รายการ\n`;
        csvContent += `สาขาทดสอบมาตรฐานฝีมือแรงงาน,${data.categories.testing},รายการ\n\n`;

        csvContent += "=== 5 อันดับหลักสูตร/สาขายอดนิยม ===\n";
        csvContent += "ลำดับ,ชื่อรายการ,ประเภท,จำนวนผู้สมัคร\n";
        data.topPopularItems.forEach((item, i) => {
            csvContent += `${i + 1},"${item.name}",${item.type === "test" ? "ทดสอบมาตรฐาน" : "ฝึกอบรม"},${item.count}\n`;
        });

        csvContent += "\n=== สถิติผู้รับบริการแยกตามอำเภอ (จังหวัดยะลา) ===\n";
        csvContent += "อำเภอ,จำนวนผู้รับบริการ\n";
        data.yalaDistricts.forEach((d) => {
            csvContent += `"${d.district}",${d.count}\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `รายงานสรุปสถิติผู้บริหาร_สพร24ยะลา_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("ส่งออกรายงาน CSV สำหรับผู้บริหารสำเร็จ!");
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            {/* Header & Print Control */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 print:hidden">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/30">
                        <i className="fa-solid fa-chart-line"></i>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800">แดชบอร์ดสถิติวิเคราะห์เชิงลึกและรายงานผู้บริหาร</h1>
                        <p className="text-xs text-slate-500">สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา — Executive Analytics Dashboard</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleExportCSV}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                        <i className="fa-solid fa-file-excel"></i> ส่งออกรายงาน Excel (CSV)
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-900/20 active:scale-95"
                    >
                        <i className="fa-solid fa-print"></i> พิมพ์รายงานผู้บริหาร
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                </div>
            ) : !data ? (
                <div className="text-center py-20 text-slate-400">ไม่พบข้อมูลสถิติ</div>
            ) : (
                <div className="space-y-6">
                    {/* Printable Header (visible on print) */}
                    <div className="hidden print:block mb-6 border-b pb-4 text-center">
                        <h1 className="text-xl font-bold">รายงานสรุปสถิติการให้บริการผู้บริหาร — สพร.24 ยะลา</h1>
                        <p className="text-sm text-slate-600">สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา | ออกรายงาน ณ วันที่ {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>

                    {/* ===== 1. Executive KPI Summary Cards ===== */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-500">📊 ยอดจองคิวทั้งหมด</span>
                                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
                                    <i className="fa-solid fa-layer-group"></i>
                                </span>
                            </div>
                            <div className="text-3xl font-black text-slate-800">{data.kpis.totalBookings.toLocaleString()}</div>
                            <div className="text-[11px] text-slate-500 mt-1">
                                อนุมัติแล้ว <strong className="text-blue-600">{data.kpis.approvedBookings}</strong> | รอดำเนินการ <strong className="text-amber-600">{data.kpis.pendingBookings}</strong>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-emerald-200/60 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-emerald-600">✅ อัตราให้บริการสำเร็จ</span>
                                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                                    <i className="fa-solid fa-circle-check"></i>
                                </span>
                            </div>
                            <div className="text-3xl font-black text-emerald-700">{data.kpis.completionRate}%</div>
                            <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${data.kpis.completionRate}%` }}></div>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-amber-200/60 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-amber-600">⏳ เวลาคอยคิวเฉลี่ย</span>
                                <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
                                    <i className="fa-solid fa-clock"></i>
                                </span>
                            </div>
                            <div className="text-3xl font-black text-amber-700">{data.kpis.avgWaitMinutes} <span className="text-xs font-bold text-slate-500">นาที</span></div>
                            <div className="text-[11px] text-slate-500 mt-1">เฉลี่ยตั้งแต่จองคิวจนถึงได้รับการบริการ</div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/60 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-blue-600">⏱️ เวลาให้บริการเฉลี่ย</span>
                                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                                    <i className="fa-solid fa-stopwatch"></i>
                                </span>
                            </div>
                            <div className="text-3xl font-black text-blue-700">{data.kpis.avgServiceMinutes} <span className="text-xs font-bold text-slate-500">นาที/คน</span></div>
                            <div className="text-[11px] text-slate-500 mt-1">อัตราความเร็วมาตรฐานช่องบริการ</div>
                        </motion.div>
                    </div>

                    {/* ===== 2. Charts & Analytics Grid ===== */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Category Distribution (Training vs Testing) */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-pie-chart text-indigo-600"></i> สัดส่วนประเภทบริการ (Training vs Testing)
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-blue-700">🎓 หลักสูตรฝึกอบรมทักษะอาชีพ</span>
                                        <span className="text-slate-800">{data.categories.training} รายการ ({data.kpis.totalBookings > 0 ? Math.round((data.categories.training / data.kpis.totalBookings) * 100) : 0}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${data.kpis.totalBookings > 0 ? (data.categories.training / data.kpis.totalBookings) * 100 : 0}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-indigo-700">📋 สาขาทดสอบมาตรฐานฝีมือแรงงาน</span>
                                        <span className="text-slate-800">{data.categories.testing} รายการ ({data.kpis.totalBookings > 0 ? Math.round((data.categories.testing / data.kpis.totalBookings) * 100) : 0}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${data.kpis.totalBookings > 0 ? (data.categories.testing / data.kpis.totalBookings) * 100 : 0}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Popular Items Ranking */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-trophy text-amber-500"></i> 5 อันดับหลักสูตร/สาขายอดนิยม
                            </h3>
                            <div className="space-y-2.5">
                                {data.topPopularItems.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-xs">ยังไม่มีข้อมูลการสมัคร</div>
                                ) : (
                                    data.topPopularItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="flex items-center gap-2.5">
                                                <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                                                    idx === 0 ? "bg-amber-400 text-amber-900" :
                                                    idx === 1 ? "bg-slate-300 text-slate-800" :
                                                    idx === 2 ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600"
                                                }`}>{idx + 1}</span>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800 line-clamp-1">{item.name}</div>
                                                    <div className="text-[10px] text-slate-500">{item.type === "test" ? "สาขาทดสอบมาตรฐาน" : "หลักสูตรฝึกอบรม"}</div>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                                                {item.count} คน
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Yala Districts Geographical Distribution */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-map-location-dot text-emerald-600"></i> สถิติผู้รับบริการแยกตามอำเภอ (จังหวัดยะลา)
                            </h3>
                            <div className="space-y-2">
                                {data.yalaDistricts.map((d, i) => {
                                    const maxCount = Math.max(...data.yalaDistricts.map((x) => x.count), 1);
                                    const pct = Math.round((d.count / maxCount) * 100);
                                    return (
                                        <div key={i} className="flex items-center gap-3 text-xs">
                                            <span className="w-28 font-bold text-slate-700 truncate">{d.district}</span>
                                            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                                            </div>
                                            <span className="w-12 text-right font-black text-slate-800">{d.count} คน</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Hourly Peak Distribution */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-chart-column text-purple-600"></i> ช่วงเวลาที่มีผู้ใช้บริการหนาแน่นสูงสุด (Peak Hours)
                            </h3>
                            <div className="flex items-end justify-between h-40 gap-2 pt-4 px-2">
                                {data.hourlyData.map((h, idx) => {
                                    const maxH = Math.max(...data.hourlyData.map((x) => x.count), 1);
                                    const heightPct = Math.max(10, Math.round((h.count / maxH) * 100));
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                                            <span className="text-[10px] font-bold text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity">{h.count}</span>
                                            <div className="w-full bg-purple-500 rounded-t-lg transition-all group-hover:bg-purple-600" style={{ height: `${heightPct}%` }}></div>
                                            <span className="text-[10px] font-bold text-slate-500">{h.hour}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
