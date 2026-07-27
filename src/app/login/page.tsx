"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("123456"); // Default/hidden for now if they only use phone
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.push("/booking");
        }
    }, [user, authLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!/^0[689]\d{8}$/.test(phone)) {
            setError("กรุณากรอกเบอร์โทรศัพท์มือถือ 10 หลัก (เช่น 0812345678)");
            return;
        }
        setLoading(true);
        const toastId = toast.loading("กำลังตรวจสอบข้อมูลและล็อกอิน...");
        
        try {
            const res = await signIn("credentials", {
                redirect: false,
                phoneNumber: phone,
                password: password,
            });

            if (res?.error) {
                if (res.error.includes("ไม่พบประวัติ")) {
                    toast.error(res.error, { id: toastId });
                    setTimeout(() => {
                        router.push(`/register?phone=${phone}`);
                    }, 1800);
                } else {
                    toast.error(res.error, { id: toastId });
                }
            } else {
                toast.success("เข้าสู่ระบบสำเร็จแล้ว!", { id: toastId });
                router.push("/booking");
            }
        } catch (err: any) {
            console.error("Login Error:", err);
            toast.error("เกิดข้อผิดพลาด: " + err.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#001a33] via-[#003366] to-[#002244] p-4 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden -z-10">
                <div className="absolute -top-10 left-10 w-80 h-80 bg-[#2563EB]/15 rounded-full blur-3xl animate-float"></div>
                <div className="absolute -bottom-10 right-10 w-96 h-96 bg-[#6366F1]/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Main Login Card */}
                <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-2xl bg-white/5 backdrop-blur-2xl p-8 sm:p-10">
                    <div className="absolute inset-0 opacity-[0.02] bg-noise mix-blend-overlay pointer-events-none"></div>
                    
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-white/10">
                            <i className="fa-solid fa-mobile-screen-button text-white text-2xl animate-pulse"></i>
                        </div>
                        <h1 className="text-2xl font-extrabold text-white font-sans">เข้าสู่ระบบใช้งาน</h1>
                        <p className="text-xs text-blue-200/60 mt-1">กรอกเบอร์โทรศัพท์มือถือของท่านเพื่อเข้าสู่ระบบ</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text text-blue-200 text-xs font-semibold">เบอร์โทรศัพท์เคลื่อนที่</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300">
                                    <i className="fa-solid fa-phone"></i>
                                </span>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value.replace(/\D/g, ""));
                                        setError("");
                                    }}
                                    placeholder="08X-XXX-XXXX"
                                    maxLength={10}
                                    className="input w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl pl-11 text-base text-white tracking-widest placeholder-blue-300/30 transition-all focus:outline-none"
                                    onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                                />
                            </div>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-red-400 mt-2 font-medium"
                                >
                                    ⚠️ {error}
                                </motion.p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn w-full rounded-2xl text-white font-bold h-auto py-4 bg-gradient-to-r from-[#2563EB] to-[#6366F1] border-0 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm sm:text-base flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <>
                                    <i className="fa-solid fa-right-to-bracket"></i>
                                    เข้าสู่ระบบ
                                </>
                            )}
                        </button>
                    </form>


                    {/* Officer Access */}
                    <div className="relative my-6 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10"></span>
                        </div>
                        <span className="relative bg-transparent px-3 text-[10px] text-blue-200/30 uppercase tracking-widest">เจ้าหน้าที่</span>
                    </div>

                    <button
                        onClick={() => router.push("/login/admin")}
                        type="button"
                        className="btn btn-ghost w-full rounded-2xl text-blue-200/60 hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-2 relative z-10 cursor-pointer"
                    >
                        <i className="fa-solid fa-user-shield text-blue-300"></i>
                        สำหรับผู้ดูแลระบบและเจ้าหน้าที่
                    </button>
                </div>

                {/* Footer register link */}
                <div className="text-center mt-6">
                    <p className="text-xs sm:text-sm text-blue-200/60 font-sans">
                        ยังไม่มีบัญชีสมาชิก?{" "}
                        <Link href="/register" className="text-yellow-400 font-bold hover:underline">
                            สมัครสมาชิกฟรี
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}