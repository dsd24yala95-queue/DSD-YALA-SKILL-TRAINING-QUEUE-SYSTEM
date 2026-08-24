"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface ChatSession {
    id: string;
    lineUserId: string;
    userName: string | null;
    userPhone: string | null;
    lastMessage: string | null;
    lastMessageAt: string;
    unreadCount: number;
    status: string;
}

interface ChatMessage {
    id: string;
    sessionId: string;
    sender: "user" | "admin";
    senderName: string | null;
    message: string;
    messageType: string;
    read: boolean;
    createdAt: string;
}

interface BoundUser {
    id: string;
    fullName: string | null;
    phoneNumber: string;
    memberId: string | null;
    profileImage: string | null;
    role: string;
}

const QUICK_REPLIES = [
    { label: "📄 ขั้นตอนเตรียมเอกสาร", text: "เอกสารที่ต้องเตรียม: 1. บัตรประชาชนตัวจริง 2. สำเนาวุฒิการศึกษา 3. รูปถ่าย 1 นิ้วจำนวน 2 รูป" },
    { label: "🗺️ แผนที่เดินทาง สพร.24 ยะลา", text: "สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา ตั้งอยู่ที่ ถนนสุขยางค์ ต.สะเตง อ.เมือง จ.ยะลา 95000" },
    { label: "📅 วิธีจองคิวออนไลน์", text: "ท่านสามารถเลือกจองคิวฝึกอบรมหรือทดสอบมาตรฐานได้ที่เว็บไซต์ https://dsd-yala-skill-training-queue-system.onrender.com/booking" },
    { label: "🎓 ติดต่อฝ่ายฝึกอบรม", text: "ฝ่ายฝึกอบรมพัฒนาฝีมือแรงงาน ยินดีให้บริการครับ โทร. 073-211-234" },
    { label: "📋 ติดต่อฝ่ายทดสอบมาตรฐาน", text: "กลุ่มงานทดสอบมาตรฐานฝีมือแรงงาน ยินดีให้บริการครับ โทร. 073-211-235" },
];

export default function AdminLineChatPage() {
    const { user: authUser } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [boundUser, setBoundUser] = useState<BoundUser | null>(null);

    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of message list
    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch conversation list
    const fetchSessions = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/line-chat");
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        } catch {
            console.error("Failed to fetch sessions");
        } finally {
            setLoadingSessions(false);
        }
    }, []);

    // Fetch chat history for selected session
    const fetchChatHistory = useCallback(async (sessionId: string) => {
        try {
            const res = await fetch(`/api/admin/line-chat?sessionId=${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setCurrentSession(data.session || null);
                setMessages(data.messages || []);
                setBoundUser(data.boundUser || null);
            }
        } catch {
            toast.error("ไม่สามารถโหลดประวัติข้อความได้");
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    // Initial load and polling interval (every 5 seconds)
    useEffect(() => {
        fetchSessions();
        const interval = setInterval(() => {
            fetchSessions();
            if (selectedSessionId) {
                fetchChatHistory(selectedSessionId);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchSessions, fetchChatHistory, selectedSessionId]);

    // When session selected
    const handleSelectSession = (sessionId: string) => {
        setSelectedSessionId(sessionId);
        setLoadingMessages(true);
        fetchChatHistory(sessionId);
    };

    // Scroll on message update
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Send Message Handler
    const handleSendMessage = async (textToSend?: string) => {
        const msg = (textToSend || inputText).trim();
        if (!msg || !selectedSessionId) return;

        setSending(true);
        try {
            const res = await fetch("/api/admin/line-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: selectedSessionId,
                    message: msg,
                    adminName: authUser?.name || "เจ้าหน้าที่ สพร.24 ยะลา",
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send");

            setInputText("");
            fetchChatHistory(selectedSessionId);
            fetchSessions();
            toast.success("ส่งข้อความตอบกลับแล้ว");
        } catch (err: any) {
            toast.error(err.message || "เกิดข้อผิดพลาดในการส่งข้อความ");
        } finally {
            setSending(false);
        }
    };

    // Filter sessions by search query
    const filteredSessions = sessions.filter((s) =>
        (s.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.userPhone || "").includes(searchQuery) ||
        (s.lastMessage || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col h-[calc(100vh-2rem)]">
            {/* Page Header */}
            <div className="mb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#06C755] flex items-center justify-center text-white text-xl shadow-lg shadow-green-500/30">
                        <i className="fa-brands fa-line"></i>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800">ระบบแชทสดโต้ตอบผ่าน LINE OA (Live Chat Console)</h1>
                        <p className="text-xs text-slate-500">สนทนาโต้ตอบแบบ 1-on-1 กับประชาชนผ่าน LINE Official Account สพร.24 ยะลา</p>
                    </div>
                </div>
            </div>

            {/* Chat Layout Container */}
            <div className="flex-1 bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden flex flex-col md:flex-row min-h-0">
                {/* ===== LEFT PANEL: Conversation List ===== */}
                <div className="w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col flex-shrink-0 bg-slate-50/50">
                    {/* Search & Filter Header */}
                    <div className="p-4 border-b border-slate-100 bg-white">
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อ / เบอร์โทร / ข้อความ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-green-400/40"
                            />
                        </div>
                    </div>

                    {/* Session Item List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {loadingSessions ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin w-8 h-8 border-3 border-[#06C755] border-t-transparent rounded-full"></div>
                            </div>
                        ) : filteredSessions.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-xs">
                                <i className="fa-regular fa-comments text-2xl block mb-2 opacity-50"></i>
                                ไม่พบรายการสนทนา
                            </div>
                        ) : (
                            filteredSessions.map((s) => {
                                const isSelected = s.id === selectedSessionId;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => handleSelectSession(s.id)}
                                        className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 relative ${
                                            isSelected
                                                ? "bg-green-50/80 border-l-4 border-[#06C755]"
                                                : "hover:bg-white"
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
                                            {s.userName ? s.userName.charAt(0) : "L"}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <h4 className="text-xs font-bold text-slate-800 truncate">{s.userName || "สมาชิก LINE"}</h4>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                    {new Date(s.lastMessageAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate">{s.lastMessage || "ทักแชทเข้ามา..."}</p>

                                            {s.userPhone && (
                                                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-600 text-[9px] font-bold">
                                                    📞 {s.userPhone}
                                                </span>
                                            )}
                                        </div>

                                        {s.unreadCount > 0 && (
                                            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                                                {s.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ===== RIGHT PANEL: Chat Conversation Window ===== */}
                {selectedSessionId && currentSession ? (
                    <div className="flex-1 flex flex-col min-w-0 bg-white">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#06C755] text-white flex items-center justify-center font-bold text-base shadow-md">
                                    {currentSession.userName ? currentSession.userName.charAt(0) : "L"}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-black text-slate-800">{currentSession.userName || "สมาชิก LINE"}</h3>
                                        {boundUser ? (
                                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-bold">
                                                ✅ ผูกบัญชีแล้ว ({boundUser.memberId || "สมาชิก"})
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold">
                                                ⏳ ยังไม่ผูกเบอร์โทร
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        เบอร์โทร: {currentSession.userPhone || boundUser?.phoneNumber || "ไม่พบเบอร์โทร"} | LINE ID: <span className="font-mono text-[10px]">{currentSession.lineUserId.substring(0, 16)}...</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => fetchChatHistory(selectedSessionId)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all text-xs"
                                title="รีเฟรชข้อความ"
                            >
                                <i className="fa-solid fa-rotate"></i>
                            </button>
                        </div>

                        {/* Messages Stream Container */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F4F6F9]">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin w-8 h-8 border-3 border-[#06C755] border-t-transparent rounded-full"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-xs">ยังไม่มีประวัติการส่งข้อความ</div>
                            ) : (
                                messages.map((m) => {
                                    const isAdmin = m.sender === "admin";
                                    return (
                                        <div key={m.id} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                                            <div className="text-[10px] text-slate-400 mb-1 px-1">
                                                {m.senderName || (isAdmin ? "เจ้าหน้าที่" : "สมาชิก")} • {new Date(m.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                            <div
                                                className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs shadow-sm leading-relaxed whitespace-pre-wrap ${
                                                    isAdmin
                                                        ? "bg-[#06C755] text-white rounded-tr-none font-medium"
                                                        : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                                                }`}
                                            >
                                                {m.message}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Quick Reply Presets Bar */}
                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 overflow-x-auto flex gap-2">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center whitespace-nowrap">⚡ ข้อความด่วน:</span>
                            {QUICK_REPLIES.map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSendMessage(q.text)}
                                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 whitespace-nowrap transition-all shadow-sm"
                                >
                                    {q.label}
                                </button>
                            ))}
                        </div>

                        {/* Message Input Bar */}
                        <div className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                rows={2}
                                placeholder="พิมพ์ข้อความตอบกลับไปยัง LINE ประชาชน... (กด Enter เพื่อส่ง)"
                                className="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-green-400/40 resize-none"
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={sending || !inputText.trim()}
                                className="px-5 py-3 rounded-2xl bg-[#06C755] hover:bg-green-600 text-white text-xs font-bold transition-all shadow-lg shadow-green-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {sending ? (
                                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                                ) : (
                                    <><i className="fa-solid fa-paper-plane"></i> ส่งข้อความ</>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                        <div className="w-16 h-16 rounded-3xl bg-green-100 text-[#06C755] flex items-center justify-center text-3xl mb-3 shadow-inner">
                            <i className="fa-brands fa-line"></i>
                        </div>
                        <h3 className="text-base font-black text-slate-800 mb-1">กรุณาเลือกรายการสนทนาจากแถบด้านซ้าย</h3>
                        <p className="text-xs text-slate-400 max-w-sm">
                            เลือกห้องแชทของประชาชนที่ทักเข้ามาทาง LINE OA เพื่อโต้ตอบและตอบข้อซักถามแบบ 1-on-1
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
