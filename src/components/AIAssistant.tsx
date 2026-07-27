"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

const mockResponses: { [key: string]: string } = {
  default: "สวัสดีครับ! ผมเป็นผู้ช่วย AI ของสถาบันพัฒนาฝีมือแรงงาน 24 ยะลา สามารถสอบถามข้อมูลเกี่ยวกับการฝึกอบรม การจองคิวทดสอบมาตรฐานฝีมือแรงงาน หรือขั้นตอนการสมัครสมาชิกได้เลยครับ",
  course: "สพร.24 ยะลา กำลังเปิดรับสมัครหลักสูตรพัฒนาทักษะหลายประเภทครับ เช่น:\n1. เทคนิคงานไฟฟ้าอาคาร (สมัครแล้ว 24/32)\n2. Digital Office สำหรับงานบริการ (สมัครแล้ว 18/40)\n3. ช่างเชื่อมระดับต้น (สมัครแล้ว 10/20)\n\nสนใจสมัครหลักสูตรไหนเป็นพิเศษไหมครับ?",
  queue: "สำหรับการจองคิวทดสอบมาตรฐานฝีมือแรงงานแห่งชาติ ตอนนี้คิวช่างเชื่อม ช่างไฟฟ้า และช่างยนต์เปิดให้เลือกวันแล้วครับ สามารถกดปุ่ม 'จองคิว' ตรงเมนูด้านล่างหรือเข้าผ่านหน้าระบบจองคิวได้เลยครับ",
  register: "ขั้นตอนการลงทะเบียน:\n1. กดลงทะเบียนที่เมนูโปรไฟล์หรือหน้าแรก\n2. กรอกข้อมูลส่วนตัว 3 ขั้นตอน (ข้อมูลทั่วไป, ที่อยู่, ระดับการศึกษา)\n3. กดยืนยันแล้วล็อกอินด้วยเบอร์โทรศัพท์ได้ทันทีครับ"
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: mockResponses.default,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for toggle custom event from bottom nav
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle-ai-assistant", handleToggle);
    return () => window.removeEventListener("toggle-ai-assistant", handleToggle);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: input,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      let aiText = mockResponses.default;
      const lowerInput = input.toLowerCase();

      if (lowerInput.includes("อบรม") || lowerInput.includes("หลักสูตร") || lowerInput.includes("เรียน")) {
        aiText = mockResponses.course;
      } else if (lowerInput.includes("จอง") || lowerInput.includes("คิว") || lowerInput.includes("ทดสอบ")) {
        aiText = mockResponses.queue;
      } else if (lowerInput.includes("สมัคร") || lowerInput.includes("ลงทะเบียน")) {
        aiText = mockResponses.register;
      }

      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: "ai",
        text: aiText,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <>
      {/* Floating Toggle Button (visible on Desktop only, mobile uses center bottom nav button) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-[#2563EB] via-[#4F46E5] to-[#7C3AED] shadow-[0_8px_25px_rgba(79,70,229,0.45)] hover:shadow-[0_12px_30px_rgba(79,70,229,0.6)] hover:scale-105 active:scale-95 transition-all text-white items-center justify-center border border-white/20"
        aria-label="Ask AI Assistant"
      >
        <i className={`fa-solid ${isOpen ? "fa-xmark" : "fa-wand-magic-sparkles"} text-xl`}></i>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed bottom-20 md:bottom-24 right-4 left-4 md:left-auto md:w-[400px] h-[550px] z-50 rounded-3xl overflow-hidden glass-light dark:glass border border-white/40 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl flex flex-col bg-slate-900/10 dark:bg-slate-900/50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#003366] via-[#002244] to-[#2563EB] p-4 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
                  <i className="fa-solid fa-wand-magic-sparkles text-yellow-300 text-lg animate-pulse"></i>
                </div>
                <div>
                  <h3 className="font-bold text-sm">DSD Yala AI Assistant</h3>
                  <p className="text-[10px] text-blue-200">พร้อมช่วยแนะนำคิวและฝึกอบรม</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md leading-relaxed whitespace-pre-line ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white rounded-br-none"
                        : "bg-white/90 dark:bg-white/10 text-gray-800 dark:text-white border border-white/20 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length === 1 && (
              <div className="px-4 py-2 space-y-1 bg-white/5 border-t border-white/10">
                <p className="text-[10px] text-gray-400 font-bold mb-1">คำถามแนะนำ:</p>
                {[
                  "มีหลักสูตรอบรมอะไรบ้าง?",
                  "จองคิวทดสอบมาตรฐานอย่างไร?",
                  "สอนวิธีสมัครสมาชิกหน่อย"
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    className="block text-left text-xs bg-white/10 hover:bg-[#2563EB]/25 text-gray-800 dark:text-blue-200 px-3 py-1.5 rounded-lg border border-white/20 hover:border-[#2563EB]/40 transition-all w-full truncate"
                  >
                    💡 {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <div className="p-4 bg-white/10 dark:bg-black/20 border-t border-white/20 dark:border-white/5 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="พิมพ์ข้อความคุยกับ AI..."
                className="flex-1 bg-white/20 dark:bg-black/30 border border-white/30 dark:border-white/10 rounded-xl px-4 text-sm text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-[#2563EB]/60"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#4F46E5] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                <i className="fa-solid fa-paper-plane text-sm"></i>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
