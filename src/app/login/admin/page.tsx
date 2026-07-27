"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";


export default function AdminLoginPage() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!password) {
            setError("กรุณากรอกรหัสผ่าน");
            return;
        }
        setLoading(true);
        const toastId = toast.loading("กำลังเข้าสู่ระบบแอดมิน...");

        try {
            const { signIn } = await import("next-auth/react");
            const res = await signIn("credentials", {
                phoneNumber: "admin",
                password,
                redirect: false
            });

            if (res?.error) {
                toast.error("รหัสผ่านไม่ถูกต้อง หรือบัญชีไม่มีสิทธิ์แอดมิน", { id: toastId });
                return;
            }

            toast.success("เข้าสู่ระบบแอดมินสำเร็จ!", { id: toastId });
            router.push("/admin");
        } catch (err: any) {
            console.error("Admin login error:", err);
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-300 p-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                <div className="bg-base-100 rounded-3xl shadow-2xl border border-base-300 p-8">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <i className="fa-solid fa-shield-halved text-white text-3xl"></i>
                        </div>
                        <h1 className="text-2xl font-bold text-red-600">ระบบจัดการ (Admin)</h1>
                        <p className="text-sm text-gray-500 mt-2">กรุณากรอกรหัสผ่านเพื่อเข้าสู่ระบบหลังบ้าน</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">รหัสผ่านเจ้าหน้าที่</span>
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError("");
                                }}
                                placeholder="••••••••"
                                className="input input-bordered input-error w-full rounded-2xl text-lg text-center tracking-widest"
                                onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                            />
                            {error && (
                                <label className="label">
                                    <span className="label-text-alt text-error">{error}</span>
                                </label>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-error text-white w-full rounded-2xl text-lg h-auto py-3 shadow-lg hover:shadow-xl transition-all"
                        >
                            {loading ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <>
                                    <i className="fa-solid fa-lock"></i>
                                    เข้าสู่ระบบแอดมิน
                                </>
                            )}
                        </button>
                    </form>

                    <div className="divider text-xs text-gray-400 my-6">กลับไปยังระบบสมาชิก</div>

                    <Link
                        href="/login"
                        className="btn btn-outline w-full rounded-2xl text-gray-500 gap-2"
                    >
                        <i className="fa-solid fa-user"></i>
                        เข้าสู่ระบบสำหรับประชาชน
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}