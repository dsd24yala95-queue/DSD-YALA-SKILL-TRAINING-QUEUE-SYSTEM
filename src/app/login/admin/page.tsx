"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminLoginPage() {
    const [username, setUsername] = useState("admin");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!username.trim()) {
            setError("กรุณากรอก Username หรือเบอร์โทรศัพท์เจ้าหน้าที่");
            return;
        }

        if (!password) {
            setError("กรุณากรอกรหัสผ่าน");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("กำลังเข้าสู่ระบบแอดมิน...");

        try {
            const { signIn } = await import("next-auth/react");
            const res = await signIn("credentials", {
                phoneNumber: username.trim(),
                password,
                redirect: false,
            });

            if (res?.error) {
                toast.error("Username หรือรหัสผ่านไม่ถูกต้อง", { id: toastId });
                setError("Username หรือรหัสผ่านไม่ถูกต้อง");
                return;
            }

            toast.success("เข้าสู่ระบบเจ้าหน้าที่/แอดมินสำเร็จ!", { id: toastId });
            router.push("/admin");
        } catch (err: any) {
            console.error("Admin login error:", err);
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 text-white">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 border border-white/20">
                            <span className="text-white font-black text-2xl">ส</span>
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">DSD YALA ADMIN</h1>
                        <p className="text-xs text-indigo-300 font-semibold mt-1">ระบบบริหารจัดการเจ้าหน้าที่และหลังบ้าน</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Username Input */}
                        <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1.5">
                                Username / เบอร์โทรศัพท์เจ้าหน้าที่
                            </label>
                            <div className="relative">
                                <i className="fa-solid fa-user-gear absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="กรอก username หรือเบอร์โทรศัพท์"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1.5">
                                รหัสผ่าน (Password)
                            </label>
                            <div className="relative">
                                <i className="fa-solid fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs text-rose-400 font-semibold text-center bg-rose-500/10 py-2 rounded-xl border border-rose-500/20">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <>
                                    <i className="fa-solid fa-shield-halved"></i>
                                    เข้าสู่ระบบหลังบ้าน
                                </>
                            )}
                        </button>
                    </form>

                    <div className="my-6 border-t border-white/10 relative text-center">
                        <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 relative -top-2.5">
                            กลับไปยังระบบสมาชิก
                        </span>
                    </div>

                    <Link
                        href="/login"
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        เข้าสู่ระบบสำหรับประชาชน / ผู้สมัคร
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}