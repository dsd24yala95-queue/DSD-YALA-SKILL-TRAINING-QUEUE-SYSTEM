"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ForceChangePasswordModal() {
    const { data: session, update } = useSession();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const mustChange = Boolean((session?.user as any)?.mustChangePassword);

    if (!mustChange) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPassword || newPassword.length < 6) {
            toast.error("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
            return;
        }

        if (newPassword === "1234567890") {
            toast.error("กรุณาอย่าใช้รหัสผ่านเริ่มต้น 1234567890 กรุณาตั้งรหัสผ่านใหม่");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to change password");

            toast.success("เปลี่ยนรหัสผ่านใหม่สำเร็จแล้ว!");
            // Refresh NextAuth session
            await update();
            window.location.reload();
        } catch (err: any) {
            toast.error(err.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 border border-slate-100 overflow-hidden"
                >
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl border border-amber-500/20">
                        <i className="fa-solid fa-lock text-amber-500"></i>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-slate-800 text-center mb-1">
                        🔒 กรุณาเปลี่ยนรหัสผ่านชั่วคราว
                    </h2>
                    <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
                        บัญชีของคุณถูกกำหนดให้ใช้รหัสผ่านชั่วคราว กรุณาตั้งรหัสผ่านใหม่เพื่อความปลอดภัยของระบบก่อนเริ่มใช้งาน
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="password"
                                placeholder="กรอกรหัสผ่านใหม่"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                ยืนยันรหัสผ่านใหม่ <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="password"
                                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                            />
                        </div>

                        <div className="pt-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-key"></i>
                                        <span>บันทึกและเริ่มต้นใช้งาน</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
