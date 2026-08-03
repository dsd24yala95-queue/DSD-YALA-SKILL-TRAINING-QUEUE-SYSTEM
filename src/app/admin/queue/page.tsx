"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QueueBooking, User } from "@prisma/client";
import { parseProfileJson } from "@/lib/jsonEngine";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface QueueRow {
    id: string;
    userId: string;
    memberName: string;
    memberPhone: string;
    type: "test" | "training";
    itemId: string;
    itemName: string;
    status: string;
    appointedDate: string;
    queueNumber?: number;
    level?: number;
    isAcknowledged?: boolean;
    createdAt: any;
    profileJson?: string;
}

const STATUS_LABELS: { [key: string]: { label: string; cls: string } } = {
    pending: { label: "รอดำเนินการ", cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    approved: { label: "ยืนยันนัดหมาย", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    confirmed: { label: "ยืนยันนัดหมาย", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    appointed: { label: "นัดหมายแล้ว", cls: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
    checked_in: { label: "รอทดสอบหน้างาน", cls: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20" },
    training: { label: "กำลังอบรม", cls: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
    testing: { label: "กำลังทดสอบ", cls: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
    completed: { label: "ผ่านการประเมิน", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    passed: { label: "ผ่านการประเมิน", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    failed: { label: "ไม่ผ่าน", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
    cancelled: { label: "ยกเลิกแล้ว", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

export default function AdminQueuePage() {
    const [queues, setQueues] = useState<QueueRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const [searchText, setSearchText] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");

    // Modal state for appointment scheduling
    const [modalQueue, setModalQueue] = useState<QueueRow | null>(null);
    const [appointedDate, setAppointedDate] = useState("");
    const [appointedLocation, setAppointedLocation] = useState("สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา");
    const [modalLoading, setModalLoading] = useState(false);

    // Confirm delete state
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    // Bulk select state
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    // Export Modal state
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFileName, setExportFileName] = useState("export");
    const [exportBatch, setExportBatch] = useState("1");
    const [exportSelectedRows, setExportSelectedRows] = useState<Set<string>>(new Set());

    // Call queue in-progress tracker {[queueId]: true}
    const [callingQueue, setCallingQueue] = useState<{ [id: string]: boolean }>({});

    // Walk-in Queue Booking States
    const [walkInModalOpen, setWalkInModalOpen] = useState(false);
    const [walkInTicketData, setWalkInTicketData] = useState<any>(null);
    const [walkInMode, setWalkInMode] = useState<"existing" | "new">("existing");
    const [walkInSaving, setWalkInSaving] = useState(false);
    const [coursesList, setCoursesList] = useState<any[]>([]);
    const [branchesList, setBranchesList] = useState<any[]>([]);
    const [memberList, setMemberList] = useState<any[]>([]);
    const [walkInForm, setWalkInForm] = useState({
        existingUserId: "",
        title: "001",
        fullName: "",
        phoneNumber: "",
        citizenId: "",
        email: "",
        education: "ปริญญาตรี",
        type: "training" as "training" | "test",
        itemId: "",
        itemName: "",
        appointedDate: new Date().toISOString().split("T")[0],
    });

    const openWalkInModal = async () => {
        setWalkInModalOpen(true);
        // Load Courses, Branches, and Members if not loaded
        try {
            const [cRes, bRes, mRes] = await Promise.all([
                fetch("/api/master/courses"),
                fetch("/api/master/branches"),
                fetch("/api/users"),
            ]);
            if (cRes.ok) setCoursesList(await cRes.json());
            if (bRes.ok) setBranchesList(await bRes.json());
            if (mRes.ok) setMemberList(await mRes.json());
        } catch (e) {
            console.error("Failed to load options for walk-in", e);
        }
    };

    const handleWalkInQueueSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (walkInMode === "existing" && !walkInForm.existingUserId) {
            toast.error("กรุณาเลือกสมาชิกจากระบบ");
            return;
        }

        if (walkInMode === "new" && (!walkInForm.fullName || !walkInForm.phoneNumber)) {
            toast.error("กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์");
            return;
        }

        if (!walkInForm.itemId || !walkInForm.itemName) {
            toast.error("กรุณาเลือกหลักสูตรหรือสาขาทดสอบ");
            return;
        }

        setWalkInSaving(true);
        try {
            const res = await fetch("/api/admin/walkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    existingUserId: walkInMode === "existing" ? walkInForm.existingUserId : undefined,
                    title: walkInForm.title,
                    fullName: walkInForm.fullName,
                    phoneNumber: walkInForm.phoneNumber,
                    citizenId: walkInForm.citizenId,
                    email: walkInForm.email,
                    education: walkInForm.education,
                    type: walkInForm.type,
                    itemId: walkInForm.itemId,
                    itemName: walkInForm.itemName,
                    appointedDate: walkInForm.appointedDate,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to register walk-in queue");

            toast.success(`ออกคิว Walk-in เรียบร้อยแล้ว (${data.ticketCode})`);
            setWalkInModalOpen(false);
            setWalkInTicketData({
                ticketCode: data.ticketCode,
                fullName: data.user.fullName,
                memberId: data.user.memberId,
                itemName: walkInForm.itemName,
                type: walkInForm.type === "training" ? "การฝึกอบรม" : "การทดสอบมาตรฐาน",
                queueNumber: data.booking.queueNumber,
                appointedDate: walkInForm.appointedDate,
            });

            loadQueues();
        } catch (err: any) {
            toast.error(err.message || "เกิดข้อผิดพลาดในการลงทะเบียน Walk-in");
        } finally {
            setWalkInSaving(false);
        }
    };

    const handleOpenExportModal = () => {
        if (selectedRows.size === 0) {
            toast.error("กรุณาเลือกรายการที่ต้องการ Export อย่างน้อย 1 รายการ");
            return;
        }
        
        // Auto-fill filename based on the first selected item's name if available
        const firstSelected = queues.find(q => selectedRows.has(q.id));
        if (firstSelected) {
            setExportFileName(firstSelected.itemName.replace(/[\/\\]/g, "_"));
        } else {
            setExportFileName("export");
        }
        
        setExportBatch("1");
        setExportSelectedRows(new Set(selectedRows));
        setShowExportModal(true);
    };

    const handleConfirmExport = () => {
        if (exportSelectedRows.size === 0) {
            toast.error("ไม่มีรายการสำหรับส่งออก");
            return;
        }
        
        const dataToExport = queues.filter(q => exportSelectedRows.has(q.id));
        
        // Extract raw profileJson using jsonEngine to ensure 100% compliant schema
        const rawJsonArray = dataToExport.map(q => {
            if (q.profileJson) {
                try {
                    return parseProfileJson(q.profileJson, { createdAt: q.createdAt });
                } catch(e) {
                    return null;
                }
            }
            return null;
        }).filter(item => item !== null);

        const jsonString = JSON.stringify(rawJsonArray); // Minified to match standard JSON file
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        const finalFilename = exportBatch ? `${exportFileName}_รุ่นที่_${exportBatch}` : exportFileName;
        a.download = `${finalFilename}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Export JSON สำเร็จ");
        setShowExportModal(false);
    };

    const loadQueues = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/queues");
            if (!res.ok) throw new Error("Failed to load queues");
            const data = await res.json();
            setQueues(data);
        } catch (e) {
            console.error(e);
            toast.error("ไม่สามารถโหลดข้อมูลคิวได้");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadQueues();
    }, [loadQueues]);

    // ── Status update helpers ───────────────────────────────────────
    const updateStatus = async (queueId: string, newStatus: string, extraData?: object) => {
        try {
            await fetch("/api/bookings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: queueId, status: newStatus, ...extraData })
            });

            // Create notification for member
            const q = queues.find(x => x.id === queueId);
            if (q) {
                const aptDate = (extraData as any)?.appointedDate;
                const aptLocation = (extraData as any)?.appointedLocation || "สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา";

                const aptDateFormatted = aptDate
                    ? new Date(aptDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "";

                const msgMap: { [k: string]: string } = {
                    approved: `ระบบยืนยันนัดหมายของท่านสำหรับ "${q.itemName}" เรียบร้อยแล้ว วันที่ ${aptDateFormatted} ณ ${aptLocation} — กรุณากด "รับนัดหมาย" เพื่อบันทึกเข้า Google Calendar`,
                    testing: "ถึงคิวของท่านแล้ว! กรุณาแสดงตัวที่จุดทดสอบ",
                    training: "ถึงคิวของท่านแล้ว! กรุณาเข้าร่วมจุดฝึกอบรม",
                    completed: "ขอแสดงความยินดี! ท่านผ่านการประเมินเรียบร้อยแล้ว",
                    failed: "ผลการประเมินของท่านไม่ผ่าน กรุณาติดต่อเจ้าหน้าที่เพื่อนัดหมายใหม่",
                    cancelled: "คิวของท่านถูกยกเลิกแล้ว หากมีข้อสงสัยกรุณาติดต่อสำนักงาน",
                };

                const notifTypeMap: { [k: string]: string } = {
                    approved: "appointment",
                    testing: "queue_call",
                    training: "queue_call",
                    completed: "result",
                    failed: "result",
                    cancelled: "general",
                };

                const msg = msgMap[newStatus];
                if (msg) {
                    await fetch("/api/notifications", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: q.userId,
                            title: newStatus === "approved"
                                ? "📅 ยืนยันนัดหมายแล้ว — กรุณารับนัดหมาย"
                                : "อัปเดตสถานะคิว",
                            message: msg,
                            type: notifTypeMap[newStatus] || "general",
                            metadata: newStatus === "approved"
                                ? JSON.stringify({
                                    appointedDate: aptDate,
                                    itemName: q.itemName,
                                    bookingType: q.type,
                                    location: aptLocation,
                                })
                                : null
                        })
                    });

                    // Trigger LINE Notification
                    fetch("/api/notify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            memberId: q.userId,
                            messageType: newStatus,
                            data: {
                                itemName: q.itemName,
                                appointedDate: aptDate,
                                location: aptLocation,
                            }
                        })
                    }).catch(err => console.error("Failed to notify via LINE:", err));
                }
            }
            toast.success("อัปเดตสถานะคิวสำเร็จ!");
            await loadQueues();
        } catch (e) {
            console.error(e);
            toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
        }
    };

    // 🔊 Audio Speech Announcement Engine (Authentic Thai Voice + TTS Fallback)
    const [audioCallEnabled, setAudioCallEnabled] = useState(true);

    const speakQueueCall = (q: QueueRow) => {
        if (!audioCallEnabled) return;
        
        const ticketText = q.queueNumber ? `คิวหมายเลข ${q.queueNumber}` : "คิวของคุณ";
        const text = `ขอเชิญ${ticketText} คุณ ${q.memberName} เข้ารับบริการค่ะ`;

        // 1. Try Google Translate TTS Audio (Most natural, fluent Thai voice)
        try {
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=th&client=tw-ob`;
            const audio = new Audio(ttsUrl);
            audio.volume = 1.0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Successfully playing Google TTS Thai Audio
                    })
                    .catch((err) => {
                        // Fallback to Web Speech Synthesis if audio blocked
                        fallbackWebSpeech(text);
                    });
                return;
            }
        } catch (e) {
            console.warn("TTS Audio play failed, falling back to Web Speech:", e);
        }

        fallbackWebSpeech(text);
    };

    const fallbackWebSpeech = (text: string) => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = "th-TH";
                utterance.rate = 0.92;
                utterance.pitch = 1.0;

                // Explicitly look for a Thai voice in available system voices
                const voices = window.speechSynthesis.getVoices();
                const thaiVoice = voices.find(
                    (v) => v.lang === "th-TH" || v.lang.startsWith("th") || v.name.toLowerCase().includes("thai") || v.name.toLowerCase().includes("niwat") || v.name.toLowerCase().includes("kanya")
                );
                if (thaiVoice) {
                    utterance.voice = thaiVoice;
                }

                window.speechSynthesis.speak(utterance);
            } catch (err) {
                console.error("Speech Synthesis error:", err);
            }
        }
    };

    // ── Call Queue — fires Full Screen Alert on Member's device & Audio Speech ────────
    const callQueue = async (q: QueueRow) => {
        setCallingQueue(prev => ({ ...prev, [q.id]: true }));
        try {
            const res = await fetch("/api/admin/queues/call", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    queueId: q.id,
                    userId: q.userId,
                    queueNumber: q.queueNumber ?? "",
                    itemName: q.itemName
                })
            });
            const data = await res.json();
            
            // Trigger Thai Audio Announcement
            speakQueueCall(q);

            if (data.callCount > 1) {
                toast.info(`🔊 เรียกคิวซ้ำครั้งที่ ${data.callCount} — ${q.memberName}`);
            } else {
                toast.success(`🔊 เรียกคิว ${q.memberName} เรียบร้อยแล้ว!`);
            }
        } catch (e) {
            toast.error("เกิดข้อผิดพลาดในการเรียกคิว");
        } finally {
            setCallingQueue(prev => ({ ...prev, [q.id]: false }));
        }
    };

    const handleApproveSubmit = async () => {
        if (!modalQueue || !appointedDate) {
            toast.error("กรุณาเลือกวันและเวลานัดหมาย");
            return;
        }
        setModalLoading(true);
        try {
            const res = await fetch("/api/admin/queues/appoint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    queueId: modalQueue.id,
                    appointedDate,
                    appointedLocation
                })
            });
            if (!res.ok) throw new Error("Failed to set appointment");
            setModalQueue(null);
            setAppointedDate("");
            setAppointedLocation("อาคารฝึกอบรม ชั้น 2");
            await loadQueues();
        } catch (e) {
            console.error(e);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/bookings?id=${id}`, { method: "DELETE" });
            toast.success("ลบคิวสำเร็จ");
            setDeleteTarget(null);
            await loadQueues();
        } catch (e) {
            toast.error("ไม่สามารถลบรายการได้");
        }
    };

    // ── Filter logic ────────────────────────────────────────────────
    const filtered = queues.filter(q => {
        const matchSearch =
            !searchText ||
            q.memberName.includes(searchText) ||
            q.memberPhone.includes(searchText) ||
            q.itemName.includes(searchText) ||
            q.id.includes(searchText);
        const matchStatus = filterStatus === "all" || q.status === filterStatus;
        const matchType = filterType === "all" || q.type === filterType;
        return matchSearch && matchStatus && matchType;
    });

    const pendingCount = queues.filter(q => q.status === "pending").length;
    const approvedCount = queues.filter(q => q.status === "approved" || q.status === "confirmed").length;
    const checkedInCount = queues.filter(q => q.status === "checked_in").length;

    return (
        <div className="p-4 sm:p-6 bg-[#f8fafc] min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <i className="fa-solid fa-list-check text-indigo-600"></i>
                        จัดการคิวจองและสมัครอบรม
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">อนุมัติคิว กำหนดวันนัดหมาย อัปเดตสถานะ และจัดการรายการจองทั้งหมดของ สพร.24 ยะลา</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setAudioCallEnabled((prev) => !prev);
                            toast.info(audioCallEnabled ? "🔇 ปิดเสียงประกาศขานคิว" : "🔊 เปิดเสียงประกาศขานคิวเรียบร้อย");
                        }}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all active:scale-95 shrink-0 ${
                            audioCallEnabled
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                        title={audioCallEnabled ? "ปิดเสียงขานคิวภาษาไทย" : "เปิดเสียงขานคิวภาษาไทย"}
                    >
                        <i className={`fa-solid ${audioCallEnabled ? "fa-volume-high text-emerald-600" : "fa-volume-xmark text-slate-400"}`}></i>
                        <span>{audioCallEnabled ? "เสียงเรียกคิว ON" : "เสียงเรียกคิว OFF"}</span>
                    </button>

                    <button
                        onClick={openWalkInModal}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 shrink-0"
                    >
                        <i className="fa-solid fa-ticket-simple"></i> ลงทะเบียน & ออกคิว Walk-in
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                    { label: "รายการทั้งหมด", value: queues.length, icon: "fa-database", color: "from-slate-500 to-slate-600" },
                    { label: "รอดำเนินการ", value: pendingCount, icon: "fa-hourglass-half", color: "from-amber-400 to-orange-500" },
                    { label: "ยืนยันนัดหมายแล้ว", value: approvedCount, icon: "fa-calendar-check", color: "from-blue-500 to-indigo-600" },
                    { label: "รายงานตัวแล้ว", value: checkedInCount, icon: "fa-person-walking-arrow-right", color: "from-fuchsia-500 to-pink-600" },
                    { label: "เสร็จสิ้น", value: queues.filter(q => q.status === "completed" || q.status === "passed").length, icon: "fa-check-double", color: "from-emerald-400 to-teal-600" },
                ].map((c, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md shrink-0`}>
                            <i className={`fa-solid ${c.icon} text-white text-sm`}></i>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800">{c.value}</p>
                            <p className="text-[11px] font-semibold text-slate-400">{c.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Live Queue Check-in Section */}
            <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-indigo-700 flex items-center gap-2">
                        <i className="fa-solid fa-id-card text-indigo-500"></i>
                        ระบบรับรายงานตัวหน้างาน (Live Queue Check-in)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">ใช้เลขบัตรประชาชนของประชาชนที่เดินทางมาถึง เพื่อกดยืนยันการรายงานตัวเข้าคิวของวันนี้</p>
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    <input
                        type="text"
                        id="checkinInput"
                        placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
                        className="flex-1 md:w-64 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
                    />
                    <button
                        onClick={async () => {
                            const input = document.getElementById("checkinInput") as HTMLInputElement;
                            const idCard = input.value.trim();
                            if (!idCard) { toast.error("กรุณากรอกเลขบัตรประชาชน"); return; }
                            const tId = toast.loading("กำลังค้นหาข้อมูล...");
                            try {
                                const res = await fetch("/api/admin/checkin", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ idCard })
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error || "Check-in failed");
                                toast.success(`รายงานตัวสำเร็จ: ${data.user?.fullName || idCard}`, { id: tId });
                                input.value = "";
                                loadQueues();
                            } catch (e: any) {
                                toast.error(e.message, { id: tId });
                            }
                        }}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-500/20 shrink-0"
                    >
                        รับรายงานตัว
                    </button>
                    <button
                        onClick={async () => {
                            const newTime = window.prompt("ตั้งค่าเวลารอเฉลี่ยต่อ 1 คิว (นาที):", "15");
                            if (newTime && !isNaN(Number(newTime))) {
                                const tId = toast.loading("กำลังบันทึก...");
                                try {
                                    const res = await fetch("/api/admin/settings", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ key: "liveWaitTime", value: newTime })
                                    });
                                    if (!res.ok) throw new Error("Failed to save");
                                    toast.success("บันทึกการตั้งค่าสำเร็จ", { id: tId });
                                } catch (e) {
                                    toast.error("เกิดข้อผิดพลาด", { id: tId });
                                }
                            }
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all shrink-0"
                        title="ตั้งค่าเวลารอเฉลี่ย"
                    >
                        <i className="fa-solid fa-gear"></i>
                    </button>
                </div>
            </div>

                        {/* Type Filter Tabs */}
            <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit overflow-x-auto max-w-full">
                <button 
                    onClick={() => setFilterType('all')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <i className="fa-solid fa-layer-group mr-2"></i> ทุกประเภท
                </button>
                <button 
                    onClick={() => setFilterType('training')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${filterType === 'training' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <i className="fa-solid fa-chalkboard-user mr-2"></i> หลักสูตรการฝึกอบรม
                </button>
                <button 
                    onClick={() => setFilterType('test')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${filterType === 'test' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <i className="fa-solid fa-clipboard-check mr-2"></i> สาขาการทดสอบมาตรฐาน
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6 flex flex-wrap gap-3 items-center">
                <button
                    onClick={handleOpenExportModal}
                    className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                    <i className="fa-solid fa-download"></i>
                    Export JSON {selectedRows.size > 0 && `(${selectedRows.size})`}
                </button>
                <div className="relative flex-1 min-w-[200px]">
                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                        type="text"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        placeholder="ค้นหาชื่อ, เบอร์โทร, บริการ..."
                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-slate-50"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 min-w-[160px]"
                >
                    <option value="all">ทุกสถานะ</option>
                    <option value="pending">รอดำเนินการ</option>
                    <option value="approved">ยืนยันนัดหมาย</option>
                    <option value="checked_in">รอทดสอบหน้างาน</option>
                    <option value="testing">กำลังทดสอบ</option>
                    <option value="training">กำลังอบรม</option>
                    <option value="completed">ผ่านการประเมิน</option>
                    <option value="failed">ไม่ผ่าน</option>
                    <option value="cancelled">ยกเลิก</option>
                </select>

                <button
                    onClick={loadQueues}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shrink-0"
                >
                    <i className="fa-solid fa-rotate-right"></i>
                    รีเฟรช
                </button>
            </div>

            {/* Queue Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <span className="loading loading-spinner loading-lg text-indigo-500"></span>
                        <p className="text-sm text-slate-400 font-medium">กำลังดึงข้อมูลคิว...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <i className="fa-solid fa-folder-open text-4xl mb-3 block"></i>
                        <p className="font-semibold text-sm">ไม่พบรายการคิวที่ตรงกับเงื่อนไขที่ค้นหา</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-3.5 text-left w-10">
                                        <input 
                                            type="checkbox" 
                                            className="checkbox checkbox-xs"
                                            checked={filtered.length > 0 && selectedRows.size === filtered.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedRows(new Set(filtered.map(q => q.id)));
                                                } else {
                                                    setSelectedRows(new Set());
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">หมายเลขคิว</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">ผู้จอง</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase hidden md:table-cell">ประเภท / บริการ</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase hidden xl:table-cell">ระดับ</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">วันนัดหมาย</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">สถานะ</th>
                                    <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-500 uppercase">ดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((q, i) => {
                                    const statusInfo = STATUS_LABELS[q.status] || { label: q.status, cls: "bg-slate-100 text-slate-500 border-slate-200" };
                                    return (
                                        <motion.tr
                                            key={q.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.02 }}
                                            className="hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="px-4 py-3.5">
                                                <input 
                                                    type="checkbox" 
                                                    className="checkbox checkbox-xs"
                                                    checked={selectedRows.has(q.id)}
                                                    onChange={(e) => {
                                                        const newSet = new Set(selectedRows);
                                                        if (e.target.checked) newSet.add(q.id);
                                                        else newSet.delete(q.id);
                                                        setSelectedRows(newSet);
                                                    }}
                                                />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="font-mono text-[11px] text-slate-400">{q.id.slice(0, 8).toUpperCase()}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-bold text-slate-800 text-sm leading-tight">{q.memberName}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{q.memberPhone}</p>
                                            </td>
                                            <td className="px-4 py-3.5 hidden md:table-cell">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${q.type === "test"
                                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                                    : "bg-purple-50 text-purple-600 border-purple-100"
                                                    }`}>
                                                    {q.type === "test" ? "ทดสอบ" : "อบรม"}
                                                </span>
                                                <p className="text-xs text-slate-700 mt-1 font-medium">{q.itemName}</p>
                                            </td>
                                            <td className="px-4 py-3.5 hidden xl:table-cell">
                                                {q.level ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                                                        <i className="fa-solid fa-layer-group text-[9px]"></i>
                                                        ระดับ {q.level}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 hidden lg:table-cell">
                                                {q.appointedDate ? (
                                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                                                        <i className="fa-regular fa-calendar-check text-emerald-400"></i>
                                                        {mounted ? new Date(q.appointedDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-300">ยังไม่กำหนด</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusInfo.cls}`}>
                                                        {statusInfo.label}
                                                    </span>
                                                    {q.isAcknowledged && (
                                                        <span className="text-[10px] font-semibold text-teal-500 flex items-center gap-1">
                                                            <i className="fa-solid fa-circle-check text-[9px]"></i> รับทราบแล้ว
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                    {/* Approve & Schedule — pending only */}
                                                    {q.status === "pending" && (
                                                        <button
                                                            onClick={() => { setModalQueue(q); setAppointedDate(""); }}
                                                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-all flex items-center gap-1"
                                                        >
                                                            <i className="fa-solid fa-calendar-plus"></i>
                                                            อนุมัติ &amp; นัดหมาย
                                                        </button>
                                                    )}

                                                    {/* ── เรียกคิว — always visible for active queues ── */}
                                                    {q.status !== "cancelled" && q.status !== "completed" && q.status !== "passed" && q.status !== "pending" && (
                                                        <button
                                                            onClick={() => callQueue(q)}
                                                            disabled={callingQueue[q.id]}
                                                            className="relative px-3 py-1.5 rounded-lg text-white text-[11px] font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-red-500/20 disabled:opacity-70 overflow-hidden"
                                                            style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                                                        >
                                                            {callingQueue[q.id] ? (
                                                                <span className="loading loading-spinner loading-xs"></span>
                                                            ) : (
                                                                <i className="fa-solid fa-bell animate-bounce"></i>
                                                            )}
                                                            เรียกคิว
                                                        </button>
                                                    )}

                                                    {/* Pass / Fail — active statuses */}
                                                    {(q.status === "checked_in" || q.status === "testing" || q.status === "training") && (
                                                        <>
                                                            <button
                                                                onClick={() => updateStatus(q.id, "completed")}
                                                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-all flex items-center gap-1"
                                                            >
                                                                <i className="fa-solid fa-check"></i>
                                                                ผ่าน
                                                            </button>
                                                            <button
                                                                onClick={() => updateStatus(q.id, "failed")}
                                                                className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-all flex items-center gap-1"
                                                            >
                                                                <i className="fa-solid fa-xmark"></i>
                                                                ไม่ผ่าน
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Delete — available for ALL queue statuses */}
                                                    <button
                                                        onClick={() => setDeleteTarget(q.id)}
                                                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold hover:bg-red-50 hover:text-red-500 transition-all flex items-center gap-1 border border-slate-200/60"
                                                        title="ลบรายการคิวนี้"
                                                    >
                                                        <i className="fa-solid fa-trash-can"></i>
                                                        ลบ
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Appointment Modal ──────────────────────────────────────────── */}
            <AnimatePresence>
                {modalQueue && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={e => { if (e.target === e.currentTarget) setModalQueue(null); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <i className="fa-solid fa-calendar-check text-white text-2xl"></i>
                            </div>
                            <h3 className="font-black text-slate-800 text-xl text-center mb-1">อนุมัติและกำหนดนัดหมาย</h3>
                            <p className="text-center text-slate-400 text-xs mb-6">ระบบจะส่งแจ้งเตือนพร้อมลิงก์บันทึก Google Calendar ไปยัง member</p>

                            <div className="bg-slate-50 rounded-2xl p-4 mb-5 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">ผู้จอง</span>
                                    <span className="font-bold text-slate-800">{modalQueue.memberName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">บริการ</span>
                                    <span className="font-bold text-slate-800">{modalQueue.itemName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">ประเภท</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${modalQueue.type === "test" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                        {modalQueue.type === "test" ? "ทดสอบมาตรฐาน" : "ฝึกอบรม"}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-sm font-bold text-slate-700 block mb-2">
                                    <i className="fa-regular fa-calendar text-indigo-500 mr-2"></i>
                                    วันและเวลานัดหมาย *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={appointedDate}
                                    onChange={e => setAppointedDate(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="text-sm font-bold text-slate-700 block mb-2">
                                    <i className="fa-solid fa-location-dot text-red-400 mr-2"></i>
                                    สถานที่นัดหมาย
                                </label>
                                <input
                                    type="text"
                                    value={appointedLocation}
                                    onChange={e => setAppointedLocation(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
                                    placeholder="สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setModalQueue(null)}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleApproveSubmit}
                                    disabled={modalLoading || !appointedDate}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {modalLoading ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                        <i className="fa-solid fa-paper-plane"></i>
                                    )}
                                    ยืนยัน &amp; ส่งแจ้งเตือน
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Delete Confirm Modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <i className="fa-solid fa-trash text-red-500 text-2xl"></i>
                            </div>
                            <h3 className="font-black text-slate-800 text-lg mb-2">ยืนยันการลบรายการ</h3>
                            <p className="text-sm text-slate-400 mb-6">การลบนี้จะลบข้อมูลคิวออกจากฐานข้อมูลถาวร ไม่สามารถกู้คืนได้</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteTarget)}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all"
                                >
                                    ลบออกจากระบบ
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Export Config Modal ──────────────────────────────────────────── */}
            <AnimatePresence>
                {showExportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={e => { if (e.target === e.currentTarget) setShowExportModal(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                                    <i className="fa-solid fa-file-export text-xl"></i>
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-xl">ตั้งค่าส่งออกไฟล์ JSON</h3>
                                    <p className="text-slate-500 text-xs mt-1">ตรวจสอบรายชื่อและตั้งชื่อไฟล์ก่อนส่งออกสำหรับระบบกรมพัฒนาฝีมือแรงงาน</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 shrink-0">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">ชื่อหลักสูตร / หัวข้อไฟล์</label>
                                    <input 
                                        type="text" 
                                        value={exportFileName}
                                        onChange={e => setExportFileName(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">รุ่นที่</label>
                                    <input 
                                        type="text" 
                                        value={exportBatch}
                                        onChange={e => setExportBatch(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
                                        placeholder="เช่น 1 หรือ 1/2567"
                                    />
                                </div>
                                <div className="md:col-span-2 bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex flex-wrap items-center gap-2">
                                    <i className="fa-regular fa-file-code text-indigo-500 shrink-0"></i>
                                    <span className="text-sm text-indigo-700 font-medium break-all">ชื่อไฟล์ที่จะได้: <strong>{exportBatch ? `${exportFileName}_รุ่นที่_${exportBatch}` : exportFileName}.json</strong></span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col mb-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
                                    <span className="font-bold text-slate-700 text-sm">รายชื่อที่เลือกส่งออก ({exportSelectedRows.size} คน)</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setExportSelectedRows(new Set(queues.filter(q => selectedRows.has(q.id)).map(q => q.id)))}
                                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                        >
                                            เลือกทั้งหมด
                                        </button>
                                        <button 
                                            onClick={() => setExportSelectedRows(new Set())}
                                            className="text-[11px] font-bold text-slate-500 hover:text-slate-600 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                                        >
                                            เอาออกทั้งหมด
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-y-auto p-2" style={{ maxHeight: "300px" }}>
                                    {queues.filter(q => selectedRows.has(q.id)).map(q => (
                                        <label key={q.id} className="flex items-center gap-3 p-3 hover:bg-white rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-200 group">
                                            <input 
                                                type="checkbox" 
                                                className="checkbox checkbox-sm checkbox-primary shrink-0"
                                                checked={exportSelectedRows.has(q.id)}
                                                onChange={(e) => {
                                                    const newSet = new Set(exportSelectedRows);
                                                    if (e.target.checked) newSet.add(q.id);
                                                    else newSet.delete(q.id);
                                                    setExportSelectedRows(newSet);
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 text-sm truncate">{q.memberName}</p>
                                                <p className="text-xs text-slate-400 truncate mt-0.5">{q.memberPhone} • {q.itemName}</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <i className={`fa-solid fa-check text-emerald-500 ${exportSelectedRows.has(q.id) ? 'block' : 'hidden'}`}></i>
                                            </div>
                                        </label>
                                    ))}
                                    {exportSelectedRows.size === 0 && (
                                        <div className="py-10 text-center text-slate-400">
                                            <i className="fa-solid fa-users-slash text-2xl mb-2"></i>
                                            <p className="text-sm font-medium">ไม่ได้เลือกรายชื่อใดๆ</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 shrink-0">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleConfirmExport}
                                    disabled={exportSelectedRows.size === 0}
                                    className="flex-1 py-3 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-slate-800/20"
                                >
                                    <i className="fa-solid fa-download"></i>
                                    ยืนยันส่งออก JSON
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* 🎟️ Walk-in Queue Booking Modal */}
                {walkInModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto my-8">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                                    <i className="fa-solid fa-ticket-simple text-indigo-600"></i>
                                    ลงทะเบียน & ออกคิว Walk-in หน้างาน
                                </h2>
                                <button onClick={() => setWalkInModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>

                            {/* Mode Switcher */}
                            <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setWalkInMode("existing")}
                                    className={`flex-1 py-2 rounded-xl transition-all ${walkInMode === "existing" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                                >
                                    <i className="fa-solid fa-users mr-1"></i> เลือกสมาชิกที่มีอยู่แล้ว
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWalkInMode("new")}
                                    className={`flex-1 py-2 rounded-xl transition-all ${walkInMode === "new" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                                >
                                    <i className="fa-solid fa-user-plus mr-1"></i> สร้างสมาชิกใหม่ Walk-in
                                </button>
                            </div>

                            <form onSubmit={handleWalkInQueueSubmit} className="space-y-3.5 text-xs">
                                {walkInMode === "existing" ? (
                                    <div>
                                        <label className="font-bold text-slate-600 block mb-1">เลือกผู้สมัคร / สมาชิกในระบบ <span className="text-rose-500">*</span></label>
                                        <select
                                            value={walkInForm.existingUserId}
                                            onChange={(e) => setWalkInForm({ ...walkInForm, existingUserId: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 text-sm"
                                        >
                                            <option value="">-- ค้นหา/เลือกสมาชิก --</option>
                                            {memberList.map((m: any) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.fullName || `${m.reg_firstname || ''} ${m.reg_lastname || ''}`} ({m.phoneNumber || m.reg_telephone || m.reg_citizenid || 'ไม่ระบุเบอร์'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="font-bold text-slate-600 block mb-1">คำนำหน้า</label>
                                                <select
                                                    value={walkInForm.title}
                                                    onChange={(e) => setWalkInForm({ ...walkInForm, title: e.target.value })}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                                >
                                                    <option value="001">นาย</option>
                                                    <option value="002">นาง</option>
                                                    <option value="003">นางสาว</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="font-bold text-slate-600 block mb-1">ชื่อ-นามสกุล <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="text"
                                                    placeholder="เช่น สมชาย ใจดี"
                                                    value={walkInForm.fullName}
                                                    onChange={(e) => setWalkInForm({ ...walkInForm, fullName: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="font-bold text-slate-600 block mb-1">เบอร์โทรศัพท์ <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="tel"
                                                    placeholder="08XXXXXXXX"
                                                    value={walkInForm.phoneNumber}
                                                    onChange={(e) => setWalkInForm({ ...walkInForm, phoneNumber: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="font-bold text-slate-600 block mb-1">เลขบัตรประชาชน</label>
                                                <input
                                                    type="text"
                                                    maxLength={13}
                                                    placeholder="1950100XXXXXX"
                                                    value={walkInForm.citizenId}
                                                    onChange={(e) => setWalkInForm({ ...walkInForm, citizenId: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 font-mono text-xs"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Queue Type & Item Selection */}
                                <div className="border-t border-slate-100 pt-3">
                                    <label className="font-bold text-slate-600 block mb-1.5">ประเภทคิวที่ต้องการสมัคร <span className="text-rose-500">*</span></label>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setWalkInForm({ ...walkInForm, type: "training", itemId: "", itemName: "" })}
                                            className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${walkInForm.type === "training" ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "border-slate-200 text-slate-600"}`}
                                        >
                                            <i className="fa-solid fa-graduation-cap"></i> การฝึกอบรม
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setWalkInForm({ ...walkInForm, type: "test", itemId: "", itemName: "" })}
                                            className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${walkInForm.type === "test" ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "border-slate-200 text-slate-600"}`}
                                        >
                                            <i className="fa-solid fa-clipboard-check"></i> การทดสอบมาตรฐาน
                                        </button>
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-600 block mb-1">
                                            {walkInForm.type === "training" ? "เลือกหลักสูตรฝึกอบรม" : "เลือกสาขาทดสอบมาตรฐาน"} <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={walkInForm.itemId}
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                const list = walkInForm.type === "training" ? coursesList : branchesList;
                                                const found = list.find((x: any) => x.id === selectedId);
                                                setWalkInForm({
                                                    ...walkInForm,
                                                    itemId: selectedId,
                                                    itemName: found ? (found.courseName || found.branchName) : "",
                                                });
                                            }}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 text-sm"
                                        >
                                            <option value="">-- เลือกรายการสมัคร --</option>
                                            {(walkInForm.type === "training" ? coursesList : branchesList).map((item: any) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.courseName || item.branchName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-600 block mb-1">วันที่นัดหมาย (YYYY-MM-DD)</label>
                                    <input
                                        type="date"
                                        value={walkInForm.appointedDate}
                                        onChange={(e) => setWalkInForm({ ...walkInForm, appointedDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 font-sans"
                                    />
                                </div>

                                <div className="flex gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setWalkInModalOpen(false)}
                                        className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={walkInSaving}
                                        className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20 active:scale-95"
                                    >
                                        {walkInSaving ? "กำลังออกคิว..." : "🎟️ ลงทะเบียน & ออกคิว Walk-in"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* 🎟️ Walk-in Queue Ticket Slip Modal */}
                {walkInTicketData && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center relative border border-indigo-100">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl shadow-sm">
                                <i className="fa-solid fa-circle-check"></i>
                            </div>

                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ออกคิว Walk-in สำเร็จแล้ว</p>
                            <h3 className="text-3xl font-black text-indigo-600 tracking-tight my-1 font-mono">{walkInTicketData.ticketCode}</h3>
                            <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-600 font-bold text-[11px] rounded-full mb-4">
                                🟢 รายงานตัวเรียบร้อย (Walk-in)
                            </span>

                            <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs space-y-2 mb-5 border border-slate-100">
                                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                                    <span className="text-slate-400 font-medium">ผู้สมัคร:</span>
                                    <span className="font-bold text-slate-800">{walkInTicketData.fullName}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                                    <span className="text-slate-400 font-medium">ประเภท:</span>
                                    <span className="font-semibold text-slate-700">{walkInTicketData.type}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                                    <span className="text-slate-400 font-medium">รายการ:</span>
                                    <span className="font-bold text-slate-800 text-right truncate max-w-[180px]">{walkInTicketData.itemName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 font-medium">วันที่นัดหมาย:</span>
                                    <span className="font-semibold text-indigo-600">{walkInTicketData.appointedDate}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <i className="fa-solid fa-print"></i> พิมพ์บัตรคิว
                                </button>
                                <button
                                    onClick={() => setWalkInTicketData(null)}
                                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
                                >
                                    ปิดหน้านี้
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


