"use client";

import React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

interface AnalyticsData {
    totalMembers: number;
    provinceCounts: Record<string, number>;
    workStateCounts: Record<string, number>;
    workSectionCounts: Record<string, number>;
    industryCounts: Record<string, number>;
    jobSeeking: {
        wantJob: number;
        wantOverseas: number;
    };
    queueStats: {
        total: number;
        pending: number;
        confirmed: number;
        completed: number;
        cancelled: number;
        testCount: number;
        trainingCount: number;
    };
}

export default function AdminDashboard() {
    const [time, setTime] = React.useState("");
    const [statsData, setStatsData] = React.useState<AnalyticsData | null>(null);
    const [recentQueues, setRecentQueues] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        setTime(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }));
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }));
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    React.useEffect(() => {
        async function loadAdminData() {
            try {
                const [statsRes, queuesRes] = await Promise.all([
                    fetch("/api/admin/stats"),
                    fetch("/api/admin/queues")
                ]);

                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStatsData(data);
                }

                if (queuesRes.ok) {
                    const queues = await queuesRes.json();
                    const allQueues = queues.map((data: any) => {
                        const status = data.status || "pending";
                        return {
                            id: data.id,
                            userId: data.userId,
                            type: data.type === "test" ? "ทดสอบ" : "อบรม",
                            itemName: data.itemName || "-",
                            status: status,
                            createdAt: data.createdAt,
                            name: data.memberName || "สมาชิกไม่ระบุชื่อ"
                        };
                    });

                    allQueues.sort((a: any, b: any) => {
                        const dateA = new Date(a.createdAt).getTime();
                        const dateB = new Date(b.createdAt).getTime();
                        return (dateB || 0) - (dateA || 0);
                    });

                    setRecentQueues(allQueues.slice(0, 5));
                }
            } catch (error) {
                console.error("Error loading admin dashboard data:", error);
                toast.error("ไม่สามารถโหลดข้อมูลสถิติของแอดมินได้");
            } finally {
                setLoading(false);
            }
        }

        loadAdminData();
    }, []);

    const totalMembers = statsData?.totalMembers || 0;
    const qStats = statsData?.queueStats || { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, testCount: 0, trainingCount: 0 };

    const statCards = [
        { icon: "fa-users", label: "สมาชิกทั้งหมด", value: totalMembers.toLocaleString("th-TH"), color: "from-blue-500 to-indigo-600" },
        { icon: "fa-list-check", label: "คิวรอดำเนินการ", value: qStats.pending.toLocaleString("th-TH"), color: "from-amber-400 to-orange-500" },
        { icon: "fa-check-circle", label: "คิวยืนยันแล้ว", value: qStats.confirmed.toLocaleString("th-TH"), color: "from-emerald-400 to-teal-500" },
        { icon: "fa-certificate", label: "เสร็จสิ้นการประเมิน", value: qStats.completed.toLocaleString("th-TH"), color: "from-purple-400 to-indigo-500" },
    ];

    const quickActionColors: { [key: string]: string } = {
        blue: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
        purple: "bg-purple-500/10 text-purple-600 border border-purple-500/20",
        green: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
        orange: "bg-orange-500/10 text-orange-600 border border-orange-500/20",
    };

    // Geographic calculation
    const provs = statsData?.provinceCounts || {};
    const maxProvCount = Math.max(...Object.values(provs), 1);

    // Work section colors
    const workSectionLabels = statsData?.workSectionCounts || {};

    return (
        <div className="p-4 sm:p-6 bg-[#f8fafc] min-h-screen font-sans">
            {/* Topbar */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">แดชบอร์ดจัดการระบบ</h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">ภาพรวมสถิติการใช้งาน และการวิเคราะห์กลุ่มเป้าหมาย สพร.24 ยะลา (DSD 50-Field Schema)</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4.5 py-2.5 bg-white rounded-2xl border border-slate-100 text-sm font-bold text-slate-600 shadow-sm flex items-center gap-2">
                        <i className="fa-regular fa-clock text-blue-500"></i>
                        {time || "--:--"}
                    </div>
                    <Link href="/admin/queue" className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 shadow-sm transition-all text-base">
                        <i className="fa-solid fa-list-check"></i>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="text-base font-semibold text-slate-500">กำลังเชื่อมต่อข้อมูลสถิติ DSD Analytics...</p>
                </div>
            ) : (
                <>
                    {/* Key Stats Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        {statCards.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-3xl border border-slate-100/80 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-sm relative overflow-hidden group"
                            >
                                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md shadow-indigo-500/10`}>
                                        <i className={`fa-solid ${stat.icon} text-white text-base`}></i>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-2.5 py-1 rounded-md">อัปเดตเรียลไทม์</span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight leading-none mb-1.5">{stat.value}</div>
                                <div className="text-sm font-bold text-slate-500">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Analytics Section (ข้อ 2: Charts & Visual breakdown) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* 1. Geographic Breakdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                        <i className="fa-solid fa-map-location-dot text-blue-500"></i>
                                        การกระจายตัวตามภูมิลำเนา
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">จังหวัด</span>
                                </div>

                                <div className="space-y-3.5 mt-4">
                                    {Object.entries(provs).map(([provName, count]) => {
                                        const pct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
                                        const barWidth = Math.max(Math.round((count / maxProvCount) * 100), 4);
                                        return (
                                            <div key={provName} className="space-y-1">
                                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                                    <span>{provName}</span>
                                                    <span className="text-slate-400">{count} คน <span className="text-blue-500 font-semibold">({pct}%)</span></span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                                                        style={{ width: `${barWidth}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium text-center">
                                * อ้างอิงจากรหัสจังหวัดในทะเบียนสมาชิก DSD
                            </div>
                        </motion.div>

                        {/* 2. Employment & Occupation Sector */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                        <i className="fa-solid fa-briefcase text-emerald-500"></i>
                                        ประเภทการทำงานของผู้สมัคร
                                    </h3>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">การจ้างงาน</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 my-4">
                                    <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-center">
                                        <div className="text-2xl font-black text-blue-600">
                                            {statsData?.workStateCounts["ทำงานแล้ว"] || 0}
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-500 mt-0.5">ทำงานแล้ว</div>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
                                        <div className="text-2xl font-black text-amber-600">
                                            {statsData?.workStateCounts["ว่างงาน"] || 0}
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-500 mt-0.5">กำลังว่างงาน</div>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="text-xs font-bold text-slate-700 mb-1">จำแนกตามสังกัดธุรกิจ:</div>
                                    {Object.entries(workSectionLabels).map(([secName, count]) => {
                                        const pct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
                                        return (
                                            <div key={secName} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                                                <span className="font-semibold text-slate-600">{secName}</span>
                                                <span className="font-black text-slate-800">{count} <span className="text-[10px] font-bold text-slate-400">({pct}%)</span></span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium text-center">
                                จำแนกสถานะตามแบบฟอร์มประวัติ 50 ฟิลด์
                            </div>
                        </motion.div>

                        {/* 3. Job Seeking & Queue Type Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                        <i className="fa-solid fa-plane-departure text-purple-500"></i>
                                        ความต้องการหางาน & การจอง
                                    </h3>
                                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">ความสนใจ</span>
                                </div>

                                <div className="space-y-3.5 my-3">
                                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/10">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold opacity-90">ต้องการหางานทำหลังจบ:</span>
                                            <span className="text-xl font-black">{statsData?.jobSeeking.wantJob || 0} คน</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-white/20 text-xs">
                                            <span className="opacity-80">สนใจทำงานต่างประเทศ:</span>
                                            <span className="font-bold text-yellow-300">{statsData?.jobSeeking.wantOverseas || 0} คน</span>
                                        </div>
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="text-xs font-bold text-slate-700 mb-2">สัดส่วนประเภทการจองคิว:</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                                                <div className="text-lg font-black text-blue-600">{qStats.testCount}</div>
                                                <div className="text-[10px] font-bold text-blue-600/80">ทดสอบฝีมือ</div>
                                            </div>
                                            <div className="flex-1 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                                <div className="text-lg font-black text-emerald-600">{qStats.trainingCount}</div>
                                                <div className="text-[10px] font-bold text-emerald-600/80">ฝึกอบรมทักษะ</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium text-center">
                                บูรณาการสถิติตามหมวดความยินยอมและเป้าหมาย
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom Grid: Recent Queue & Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Queue */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-base font-black text-slate-800">คิวลงทะเบียนล่าสุด</h2>
                                <Link href="/admin/queue" className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition-all">
                                    ดูทั้งหมด
                                </Link>
                            </div>
                            
                            <div className="space-y-3">
                                {recentQueues.length > 0 ? (
                                    recentQueues.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 hover:border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all duration-200">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                                                    {item.name.charAt(0) === "น" ? item.name.charAt(4) || item.name.charAt(0) : item.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-bold text-slate-800">{item.name}</p>
                                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">{item.type} — {item.itemName}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                                                item.status === "pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                item.status === "approved" || item.status === "confirmed" || item.status === "appointed" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                            }`}>
                                                {item.status === "pending" ? "รอดำเนินการ" :
                                                item.status === "approved" || item.status === "confirmed" || item.status === "appointed" ? "นัดหมายแล้ว" : "เสร็จสิ้น"}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        <i className="fa-solid fa-folder-open text-3xl mb-2"></i>
                                        <p className="text-xs">ยังไม่มีรายการคิวจองในระบบ</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"
                        >
                            <h2 className="text-base font-black text-slate-800 mb-6">การดำเนินการด่วน</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { icon: "fa-user-plus", label: "จัดการคิว / นัดหมาย", color: "blue", href: "/admin/queue" },
                                    { icon: "fa-graduation-cap", label: "จัดการการฝึกอบรม", color: "purple", href: "/admin/training" },
                                    { icon: "fa-clipboard-check", label: "จัดการการทดสอบมาตรฐาน", color: "purple", href: "/admin/testing" },
                                    { icon: "fa-users-gear", label: "จัดการทะเบียนสมาชิก", color: "green", href: "/admin/members" },
                                    { icon: "fa-user-shield", label: "จัดการเจ้าหน้าที่", color: "blue", href: "/admin/officers" },
                                    { icon: "fa-file-chart-column", label: "ออกรายงาน Excel 5 Sheets", color: "orange", href: "/admin/report" },
                                ].map((action, i) => (
                                    <Link
                                        key={i}
                                        href={action.href}
                                        className="flex items-center gap-3.5 px-4 py-4 rounded-2xl border border-slate-50 hover:border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all duration-200 group"
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-transform duration-300 group-hover:scale-110 shadow-sm ${quickActionColors[action.color]}`}>
                                            <i className={`fa-solid ${action.icon}`}></i>
                                        </div>
                                        <span className="text-xs sm:text-sm font-bold text-slate-700">{action.label}</span>
                                        <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 group-hover:text-slate-500 transition-colors ml-auto"></i>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    );
}