"use client";

import React from "react";
import { motion } from "framer-motion";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a33] via-[#003366] to-[#002244] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl text-center text-white"
      >
        <div className="w-20 h-20 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-wifi-slash text-red-400 text-4xl animate-pulse"></i>
        </div>
        
        <h1 className="text-2xl font-bold mb-3 font-sans">ขาดการเชื่อมต่ออินเทอร์เน็ต</h1>
        <p className="text-blue-200/70 text-sm mb-8 leading-relaxed">
          ดูเหมือนว่าคุณกำลังใช้งานแบบออฟไลน์ คุณยังคงสามารถดูข้อมูลหลักสูตรหรือคิวที่เข้าชมก่อนหน้านี้ได้จากแคชของระบบ
        </p>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <i className="fa-solid fa-rotate-right mr-2"></i> ลองใหม่อีกครั้ง
          </button>
          
          <a
            href="/"
            className="block w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-all text-sm"
          >
            <i className="fa-solid fa-house mr-2"></i> กลับหน้าหลักออฟไลน์
          </a>
        </div>
      </motion.div>
    </div>
  );
}
