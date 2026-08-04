"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ===== Types =====
interface LineStats {
    totalMembers: number;
    linkedMembers: number;
    unlinkedMembers: number;
    linkRate: number;
}

interface LinkedUser {
    id: string;
    fullName: string | null;
    phoneNumber: string;
    lineUserId: string;
    memberId: string | null;
    createdAt: string;
}

interface NotificationLog {
    id: string;
    userId: string;
    userName: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
}

interface AutoReplySettings {
    welcomeMessage: string;
    linkingGuide: string;
    fallbackMessage: string;
}

// ===== Tab ID =====
type TabId = "dashboard" | "broadcast" | "logs" | "settings";

const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "dashboard", label: "สถานะการเชื่อมต่อ", icon: "fa-chart-pie" },
    { id: "broadcast", label: "ส่งข้อความประกาศ", icon: "fa-bullhorn" },
    { id: "logs", label: "ประวัติแจ้งเตือน", icon: "fa-clock-rotate-left" },
    { id: "settings", label: "ตั้งค่า Auto-Reply", icon: "fa-gear" },
];

// ===== Broadcast Target Options =====
const BROADCAST_TARGETS = [
    { value: "all", label: "📢 ทุกคนที่ผูก LINE", desc: "ส่งถึงสมาชิกทั้งหมดที่เชื่อมต่อ LINE แล้ว" },
    { value: "training", label: "🎓 สมาชิกฝึกอบรม", desc: "ส่งถึงผู้ที่มีการจองคิวฝึกอบรมเท่านั้น" },
    { value: "testing", label: "📋 สมาชิกทดสอบ", desc: "ส่งถึงผู้ที่มีการจองคิวทดสอบมาตรฐานเท่านั้น" },
];

const BROADCAST_TEMPLATES = [
    { value: "text", label: "💬 ข้อความธรรมดา", desc: "ข้อความตัวอักษรปกติ" },
    { value: "announcement", label: "📰 ข่าวประกาศ", desc: "Flex Card แบบข่าวประชาสัมพันธ์" },
    { value: "enrollment", label: "📝 เปิดรับสมัคร", desc: "Flex Card ประกาศเปิดรับสมัครหลักสูตร" },
    { value: "general_alert", label: "🔔 แจ้งเตือนทั่วไป", desc: "Flex Card แจ้งเตือนเรื่องทั่วไป" },
];

export default function AdminLineOAPage() {
    const [activeTab, setActiveTab] = useState<TabId>("dashboard");
    const [loading, setLoading] = useState(true);

    // ===== Dashboard State =====
    const [stats, setStats] = useState<LineStats>({ totalMembers: 0, linkedMembers: 0, unlinkedMembers: 0, linkRate: 0 });
    const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
    const [searchLinked, setSearchLinked] = useState("");

    // ===== Broadcast State =====
    const [broadcastTarget, setBroadcastTarget] = useState("all");
    const [broadcastTemplate, setBroadcastTemplate] = useState("text");
    const [broadcastMessage, setBroadcastMessage] = useState("");
    const [broadcastTitle, setBroadcastTitle] = useState("");
    const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);
    const [broadcastResult, setBroadcastResult] = useState<{ sent: number; failed: number } | null>(null);

    // ===== Logs State =====
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [searchLogs, setSearchLogs] = useState("");
    const [filterLogType, setFilterLogType] = useState("all");

    // ===== Settings State =====
    const [autoReply, setAutoReply] = useState<AutoReplySettings>({
        welcomeMessage: "ระบบจองคิว สพร.24 ยะลา ยินดีต้อนรับครับ",
        linkingGuide: "เพื่อรับการแจ้งเตือนคิว กรุณาพิมพ์เบอร์โทรศัพท์ 10 หลักของคุณที่ลงทะเบียนไว้ในระบบ เพื่อเชื่อมต่อบัญชีครับ",
        fallbackMessage: "ระบบจองคิว DSD Yala ยินดีต้อนรับ\n\nเพื่อรับการแจ้งเตือนคิว กรุณาพิมพ์เบอร์โทรศัพท์ 10 หลักของคุณที่ลงทะเบียนไว้ในระบบ เพื่อเชื่อมต่อบัญชีครับ",
    });
    const [savingSettings, setSavingSettings] = useState(false);

    // ===== Fetch Data =====
    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/line-oa");
            if (!res.ok) throw new Error("Failed to load LINE OA data");
            const data = await res.json();
            setStats(data.stats || { totalMembers: 0, linkedMembers: 0, unlinkedMembers: 0, linkRate: 0 });
            setLinkedUsers(data.linkedUsers || []);
            setLogs(data.notifications || []);
            if (data.autoReplySettings) {
                setAutoReply(data.autoReplySettings);
            }
        } catch {
            toast.error("ไม่สามารถโหลดข้อมูล LINE OA ได้");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    // ===== Unlink Handler =====
    const handleUnlink = async (userId: string, name: string) => {
        if (!confirm(`ยืนยันยกเลิกการผูก LINE ของ "${name}" หรือไม่?`)) return;
        const toastId = toast.loading("กำลังยกเลิกการผูก LINE...");
        try {
            const res = await fetch("/api/admin/line-oa", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            if (!res.ok) throw new Error("Failed to unlink");
            toast.success(`ยกเลิกการผูก LINE ของ ${name} สำเร็จ`, { id: toastId });
            fetchDashboard();
        } catch {
            toast.error("เกิดข้อผิดพลาดในการยกเลิกการผูก", { id: toastId });
        }
    };

    // ===== Broadcast Handler =====
    const handleBroadcast = async () => {
        if (!broadcastMessage.trim()) {
            toast.error("กรุณากรอกข้อความก่อนส่ง");
            return;
        }
        setBroadcasting(true);
        setBroadcastResult(null);
        const toastId = toast.loading("กำลังส่งข้อความ Broadcast...");
        try {
            const res = await fetch("/api/admin/line-oa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "broadcast",
                    target: broadcastTarget,
                    template: broadcastTemplate,
                    message: broadcastMessage,
                    title: broadcastTitle,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Broadcast failed");
            setBroadcastResult({ sent: data.sent || 0, failed: data.failed || 0 });
            toast.success(`ส่ง Broadcast สำเร็จ! (${data.sent} คน)`, { id: toastId });
            setShowBroadcastConfirm(false);
            setBroadcastMessage("");
            setBroadcastTitle("");
        } catch (err: any) {
            toast.error(err.message || "เกิดข้อผิดพลาดในการส่ง Broadcast", { id: toastId });
        } finally {
            setBroadcasting(false);
        }
    };

    // ===== Save Settings Handler =====
    const handleSaveSettings = async () => {
        setSavingSettings(true);
        const toastId = toast.loading("กำลังบันทึกการตั้งค่า...");
        try {
            const res = await fetch("/api/admin/line-oa", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autoReplySettings: autoReply }),
            });
            if (!res.ok) throw new Error("Save failed");
            toast.success("บันทึกการตั้งค่า Auto-Reply สำเร็จ!", { id: toastId });
        } catch {
            toast.error("เกิดข้อผิดพลาดในการบันทึก", { id: toastId });
        } finally {
            setSavingSettings(false);
        }
    };

    // ===== Filtered Data =====
    const filteredLinkedUsers = linkedUsers.filter((u) =>
        (u.fullName || "").toLowerCase().includes(searchLinked.toLowerCase()) ||
        u.phoneNumber.includes(searchLinked) ||
        (u.lineUserId || "").toLowerCase().includes(searchLinked.toLowerCase())
    );

    const filteredLogs = logs.filter((l) => {
        const matchSearch = (l.userName || "").toLowerCase().includes(searchLogs.toLowerCase()) || l.title.toLowerCase().includes(searchLogs.toLowerCase());
        const matchType = filterLogType === "all" || l.type === filterLogType;
        return matchSearch && matchType;
    });

    const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/line/webhook` : "/api/line/webhook";

    // ===== Donut Chart (SVG) =====
    const DonutChart = ({ linked, total }: { linked: number; total: number }) => {
        const pct = total > 0 ? (linked / total) * 100 : 0;
        const circumference = 2 * Math.PI * 40;
        const offset = circumference - (pct / 100) * circumference;
        return (
            <div className="relative w-32 h-32 mx-auto">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" stroke="#E2E8F0" strokeWidth="12" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke="#06C755" strokeWidth="12" fill="none"
                        strokeDasharray={`${circumference}`} strokeDashoffset={`${offset}`}
                        strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-800">{Math.round(pct)}%</span>
                    <span className="text-[10px] text-slate-500">ผูก LINE</span>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-2xl bg-[#06C755] flex items-center justify-center shadow-lg shadow-green-500/30">
                        <i className="fa-brands fa-line text-white text-xl"></i>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800">ระบบจัดการ LINE OA</h1>
                        <p className="text-xs text-slate-500">สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา — LINE Official Account Management</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1.5 mb-6 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? "bg-white text-[#06C755] shadow-md shadow-green-500/10"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        }`}
                    >
                        <i className={`fa-solid ${tab.icon}`}></i>
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-10 h-10 border-4 border-[#06C755] border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {/* ===== TAB 1: Dashboard ===== */}
                    {activeTab === "dashboard" && (
                        <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {/* Stat Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                                    <div className="text-xs text-slate-500 font-bold mb-1">👥 สมาชิกทั้งหมด</div>
                                    <div className="text-3xl font-black text-slate-800">{stats.totalMembers.toLocaleString()}</div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-green-200/60 p-5 shadow-sm">
                                    <div className="text-xs text-green-600 font-bold mb-1">✅ ผูก LINE แล้ว</div>
                                    <div className="text-3xl font-black text-green-700">{stats.linkedMembers.toLocaleString()}</div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-amber-200/60 p-5 shadow-sm">
                                    <div className="text-xs text-amber-600 font-bold mb-1">⏳ ยังไม่ผูก LINE</div>
                                    <div className="text-3xl font-black text-amber-700">{stats.unlinkedMembers.toLocaleString()}</div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                                    <DonutChart linked={stats.linkedMembers} total={stats.totalMembers} />
                                </div>
                            </div>

                            {/* LINE Bot Info */}
                            <div className="bg-gradient-to-r from-[#06C755]/10 to-green-50 rounded-2xl border border-green-200/60 p-5 mb-6">
                                <h3 className="text-sm font-black text-green-800 mb-3 flex items-center gap-2">
                                    <i className="fa-brands fa-line text-[#06C755]"></i> ข้อมูล LINE Bot
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-green-700 block mb-0.5">Webhook URL</label>
                                        <div className="flex gap-2">
                                            <input readOnly value={webhookUrl} className="flex-1 px-3 py-2 rounded-xl bg-white border border-green-200 text-xs text-slate-700 font-mono" />
                                            <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("คัดลอก Webhook URL แล้ว!"); }}
                                                className="px-3 py-2 rounded-xl bg-[#06C755] text-white text-xs font-bold hover:bg-green-600 transition-all">
                                                <i className="fa-solid fa-copy"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-green-700 block mb-0.5">สถานะ Token</label>
                                        <div className="px-3 py-2 rounded-xl bg-white border border-green-200 text-xs text-green-700 font-bold flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            Token ถูกตั้งค่าแล้ว (Active)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Linked Users Table */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black text-slate-800">📋 รายชื่อสมาชิกที่ผูก LINE ({filteredLinkedUsers.length})</h3>
                                    <input
                                        type="text" placeholder="🔍 ค้นหาชื่อ / เบอร์โทร..."
                                        value={searchLinked} onChange={(e) => setSearchLinked(e.target.value)}
                                        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-green-400/40"
                                    />
                                </div>
                                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-slate-50 z-10">
                                            <tr className="text-slate-500 text-left">
                                                <th className="py-2.5 px-3 font-bold">#</th>
                                                <th className="py-2.5 px-3 font-bold">ชื่อ-สกุล</th>
                                                <th className="py-2.5 px-3 font-bold">เบอร์โทรศัพท์</th>
                                                <th className="py-2.5 px-3 font-bold">LINE User ID</th>
                                                <th className="py-2.5 px-3 font-bold">วันที่สมัคร</th>
                                                <th className="py-2.5 px-3 font-bold text-right">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLinkedUsers.length === 0 ? (
                                                <tr><td colSpan={6} className="text-center py-8 text-slate-400">ไม่พบรายการ</td></tr>
                                            ) : filteredLinkedUsers.map((u, i) => (
                                                <tr key={u.id} className="border-t border-slate-100 hover:bg-green-50/30 transition-colors">
                                                    <td className="py-3 px-3 text-slate-400">{i + 1}</td>
                                                    <td className="py-3 px-3 font-bold text-slate-800">{u.fullName || "-"}</td>
                                                    <td className="py-3 px-3 text-slate-600">{u.phoneNumber}</td>
                                                    <td className="py-3 px-3 text-slate-500 font-mono text-[10px]">{u.lineUserId}</td>
                                                    <td className="py-3 px-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}</td>
                                                    <td className="py-3 px-3 text-right">
                                                        <button onClick={() => handleUnlink(u.id, u.fullName || u.phoneNumber)}
                                                            className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-[11px] font-bold transition-all">
                                                            <i className="fa-solid fa-link-slash mr-1"></i> ยกเลิกผูก
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ===== TAB 2: Broadcast ===== */}
                    {activeTab === "broadcast" && (
                        <motion.div key="broadcast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Compose Area */}
                                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                                    <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-bullhorn text-[#06C755]"></i> เขียนข้อความ Broadcast
                                    </h3>

                                    {/* Target */}
                                    <div className="mb-4">
                                        <label className="text-xs font-bold text-slate-600 block mb-2">🎯 กลุ่มเป้าหมาย</label>
                                        <div className="space-y-2">
                                            {BROADCAST_TARGETS.map((t) => (
                                                <label key={t.value}
                                                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                        broadcastTarget === t.value ? "bg-green-50 border-green-300" : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/60"
                                                    }`}>
                                                    <input type="radio" name="target" value={t.value} checked={broadcastTarget === t.value}
                                                        onChange={(e) => setBroadcastTarget(e.target.value)} className="mt-0.5 accent-green-600" />
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-800">{t.label}</div>
                                                        <div className="text-[10px] text-slate-500">{t.desc}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Template */}
                                    <div className="mb-4">
                                        <label className="text-xs font-bold text-slate-600 block mb-2">📝 รูปแบบข้อความ</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {BROADCAST_TEMPLATES.map((t) => (
                                                <button key={t.value} type="button"
                                                    onClick={() => setBroadcastTemplate(t.value)}
                                                    className={`p-2.5 rounded-xl border text-left transition-all ${
                                                        broadcastTemplate === t.value ? "bg-green-50 border-green-300 text-green-800" : "bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100/60"
                                                    }`}>
                                                    <div className="text-xs font-bold">{t.label}</div>
                                                    <div className="text-[10px] text-slate-500">{t.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Title (for Flex templates) */}
                                    {broadcastTemplate !== "text" && (
                                        <div className="mb-3">
                                            <label className="text-xs font-bold text-slate-600 block mb-1">หัวข้อ</label>
                                            <input type="text" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)}
                                                placeholder="เช่น เปิดรับสมัครหลักสูตรใหม่!"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-green-400/40" />
                                        </div>
                                    )}

                                    {/* Message */}
                                    <div className="mb-4">
                                        <label className="text-xs font-bold text-slate-600 block mb-1">เนื้อหาข้อความ</label>
                                        <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)}
                                            rows={5} placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-green-400/40 resize-none" />
                                    </div>

                                    <button onClick={() => { if (!broadcastMessage.trim()) { toast.error("กรุณากรอกข้อความก่อนส่ง"); return; } setShowBroadcastConfirm(true); }}
                                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#06C755] to-green-500 hover:from-green-600 hover:to-green-600 text-white text-xs font-bold shadow-lg shadow-green-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                                        <i className="fa-solid fa-paper-plane"></i> ส่ง Broadcast
                                    </button>
                                </div>

                                {/* Preview Area */}
                                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                                    <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-eye text-[#06C755]"></i> ตัวอย่างข้อความ (Preview)
                                    </h3>
                                    <div className="bg-[#7B9EBC] rounded-2xl p-4 min-h-[300px]">
                                        <div className="max-w-[280px] ml-auto">
                                            {broadcastTemplate === "text" ? (
                                                <div className="bg-[#06C755] text-white rounded-2xl rounded-tr-sm p-3 text-xs shadow-md">
                                                    {broadcastMessage || "ข้อความจะแสดงที่นี่..."}
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                                                    <div className={`p-3 text-center ${
                                                        broadcastTemplate === "announcement" ? "bg-blue-600" : broadcastTemplate === "enrollment" ? "bg-emerald-600" : "bg-amber-600"
                                                    }`}>
                                                        <div className="text-white text-xs font-bold">{broadcastTitle || "หัวข้อประกาศ"}</div>
                                                    </div>
                                                    <div className="p-3">
                                                        <p className="text-[11px] text-slate-700 leading-relaxed">{broadcastMessage || "เนื้อหาข้อความ..."}</p>
                                                    </div>
                                                    <div className="px-3 pb-3">
                                                        <div className={`text-center py-2 rounded-lg text-white text-xs font-bold ${
                                                            broadcastTemplate === "announcement" ? "bg-blue-600" : broadcastTemplate === "enrollment" ? "bg-emerald-600" : "bg-amber-600"
                                                        }`}>
                                                            ดูรายละเอียด
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Broadcast Result */}
                                    {broadcastResult && (
                                        <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200">
                                            <div className="text-xs font-bold text-green-800 mb-1">📊 ผลการส่ง Broadcast</div>
                                            <div className="flex gap-4 text-xs">
                                                <span className="text-green-700">✅ สำเร็จ: <strong>{broadcastResult.sent}</strong> คน</span>
                                                <span className="text-rose-600">❌ ล้มเหลว: <strong>{broadcastResult.failed}</strong> คน</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ===== TAB 3: Notification Logs ===== */}
                    {activeTab === "logs" && (
                        <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                        <i className="fa-solid fa-clock-rotate-left text-[#06C755]"></i> ประวัติการแจ้งเตือน LINE ({filteredLogs.length})
                                    </h3>
                                    <div className="flex gap-2">
                                        <select value={filterLogType} onChange={(e) => setFilterLogType(e.target.value)}
                                            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none">
                                            <option value="all">ทุกประเภท</option>
                                            <option value="general">ทั่วไป</option>
                                            <option value="appointment">นัดหมาย</option>
                                            <option value="queue_call">เรียกคิว</option>
                                            <option value="result">ผลประเมิน</option>
                                            <option value="reminder_d3">แจ้งเตือน D-3</option>
                                            <option value="reminder_d1">แจ้งเตือน D-1</option>
                                            <option value="reminder_d0">แจ้งเตือน D-0</option>
                                        </select>
                                        <input type="text" placeholder="🔍 ค้นหา..." value={searchLogs} onChange={(e) => setSearchLogs(e.target.value)}
                                            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-green-400/40" />
                                    </div>
                                </div>
                                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-slate-50 z-10">
                                            <tr className="text-slate-500 text-left">
                                                <th className="py-2.5 px-3 font-bold">วันเวลา</th>
                                                <th className="py-2.5 px-3 font-bold">ผู้รับ</th>
                                                <th className="py-2.5 px-3 font-bold">หัวข้อ</th>
                                                <th className="py-2.5 px-3 font-bold">ประเภท</th>
                                                <th className="py-2.5 px-3 font-bold">สถานะ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLogs.length === 0 ? (
                                                <tr><td colSpan={5} className="text-center py-8 text-slate-400">ไม่พบรายการ</td></tr>
                                            ) : filteredLogs.slice(0, 100).map((l) => (
                                                <tr key={l.id} className="border-t border-slate-100 hover:bg-green-50/30 transition-colors">
                                                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                                                    <td className="py-3 px-3 font-bold text-slate-800">{l.userName || "-"}</td>
                                                    <td className="py-3 px-3 text-slate-700 max-w-[200px] truncate">{l.title}</td>
                                                    <td className="py-3 px-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            l.type.includes("reminder") ? "bg-amber-100 text-amber-700" :
                                                            l.type === "appointment" ? "bg-blue-100 text-blue-700" :
                                                            l.type === "queue_call" ? "bg-orange-100 text-orange-700" :
                                                            "bg-slate-100 text-slate-600"
                                                        }`}>{l.type}</span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${l.read ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                                            {l.read ? "✅ อ่านแล้ว" : "📨 ส่งแล้ว"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ===== TAB 4: Settings ===== */}
                    {activeTab === "settings" && (
                        <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Auto-Reply Settings */}
                                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                                    <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-robot text-[#06C755]"></i> ข้อความตอบกลับอัตโนมัติ (Auto-Reply)
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-600 block mb-1">ข้อความต้อนรับ (Welcome Message)</label>
                                            <textarea value={autoReply.welcomeMessage} onChange={(e) => setAutoReply({ ...autoReply, welcomeMessage: e.target.value })}
                                                rows={3} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-green-400/40 resize-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-600 block mb-1">คำแนะนำเชื่อมต่อบัญชี (Linking Guide)</label>
                                            <textarea value={autoReply.linkingGuide} onChange={(e) => setAutoReply({ ...autoReply, linkingGuide: e.target.value })}
                                                rows={3} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-green-400/40 resize-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-600 block mb-1">ข้อความ Fallback (เมื่อพิมพ์ข้อความไม่ตรงรูปแบบ)</label>
                                            <textarea value={autoReply.fallbackMessage} onChange={(e) => setAutoReply({ ...autoReply, fallbackMessage: e.target.value })}
                                                rows={4} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-green-400/40 resize-none" />
                                        </div>

                                        <button onClick={handleSaveSettings} disabled={savingSettings}
                                            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#06C755] to-green-500 hover:from-green-600 hover:to-green-600 text-white text-xs font-bold shadow-lg shadow-green-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                                            {savingSettings ? "กำลังบันทึก..." : <><i className="fa-solid fa-floppy-disk"></i> บันทึกการตั้งค่า</>}
                                        </button>
                                    </div>
                                </div>

                                {/* Webhook Info & Config */}
                                <div className="space-y-5">
                                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                                        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-link text-[#06C755]"></i> Webhook Configuration
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Webhook URL (ตั้งค่าใน LINE Developers Console)</label>
                                                <div className="flex gap-2">
                                                    <input readOnly value={webhookUrl} className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700" />
                                                    <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("คัดลอก URL แล้ว!"); }}
                                                        className="px-4 py-2.5 rounded-xl bg-[#06C755] text-white text-xs font-bold hover:bg-green-600 transition-all">
                                                        <i className="fa-solid fa-copy"></i> คัดลอก
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                                <div className="text-xs font-bold text-amber-800 mb-1">💡 วิธีตั้งค่า Webhook</div>
                                                <ol className="text-[10px] text-amber-700 space-y-0.5 list-decimal pl-4">
                                                    <li>เข้าสู่ <strong>LINE Developers Console</strong></li>
                                                    <li>เลือก Messaging API Channel ของ LINE OA</li>
                                                    <li>ไปที่ <strong>Messaging API &gt; Webhook Settings</strong></li>
                                                    <li>วาง Webhook URL ด้านบน &gt; คลิก <strong>Verify</strong></li>
                                                    <li>เปิด <strong>Use webhook</strong> ให้เป็น ON</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>

                                    {/* LINE Flex Templates Info */}
                                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                                        <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                                            <i className="fa-solid fa-palette text-[#06C755]"></i> Flex Message Templates (5 แบบ)
                                        </h3>
                                        <div className="space-y-2">
                                            {[
                                                { name: "welcome", label: "ยินดีต้อนรับสมาชิกใหม่", color: "bg-blue-100 text-blue-700" },
                                                { name: "booking_created", label: "จองคิวสำเร็จ", color: "bg-green-100 text-green-700" },
                                                { name: "queue_call", label: "ถึงคิวแล้ว / เรียกคิว", color: "bg-amber-100 text-amber-700" },
                                                { name: "appointment", label: "ยืนยันนัดหมาย", color: "bg-indigo-100 text-indigo-700" },
                                                { name: "completed", label: "ผ่านการประเมิน", color: "bg-purple-100 text-purple-700" },
                                            ].map((t) => (
                                                <div key={t.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                    <span className="text-xs font-bold text-slate-700">{t.label}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.color}`}>{t.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* ===== Broadcast Confirm Modal ===== */}
            <AnimatePresence>
                {showBroadcastConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3 text-2xl">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                            </div>
                            <h2 className="text-base font-black text-slate-800 mb-1">ยืนยันส่ง Broadcast</h2>
                            <p className="text-xs text-slate-500 mb-1">
                                กลุ่มเป้าหมาย: <strong className="text-slate-800">{BROADCAST_TARGETS.find((t) => t.value === broadcastTarget)?.label}</strong>
                            </p>
                            <p className="text-xs text-amber-600 mb-4 font-bold">
                                ⚠️ ข้อความจะถูกส่งถึงสมาชิกทุกคนที่ผูก LINE ในกลุ่มนี้ทันที ไม่สามารถยกเลิกได้
                            </p>
                            <div className="bg-slate-50 rounded-xl p-3 mb-4 text-left">
                                <div className="text-[10px] font-bold text-slate-500 mb-1">ข้อความ:</div>
                                <div className="text-xs text-slate-800 whitespace-pre-wrap">{broadcastMessage}</div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowBroadcastConfirm(false)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                                    ยกเลิก
                                </button>
                                <button onClick={handleBroadcast} disabled={broadcasting}
                                    className="flex-1 py-2.5 rounded-2xl bg-[#06C755] hover:bg-green-600 text-white text-xs font-bold shadow-md shadow-green-500/20 transition-all disabled:opacity-50">
                                    {broadcasting ? "กำลังส่ง..." : "📢 ยืนยันส่ง Broadcast"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
