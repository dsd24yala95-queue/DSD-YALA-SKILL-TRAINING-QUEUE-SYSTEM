"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function CompleteProfilePage() {
    const router = useRouter();
    const { user, profile, loading: authLoading } = useAuth();

    const [phoneNumber, setPhoneNumber] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?callbackUrl=/register/complete-profile");
            return;
        }

        if (profile) {
            if (profile.phoneNumber) {
                setPhoneNumber(profile.phoneNumber);
            }
            if ((profile as any).profileImage) {
                setAvatarUrl((profile as any).profileImage);
            }
        }
    }, [authLoading, user, profile, router]);

    // Handle Image Selection and Upload to Supabase Storage
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview locally immediately
        const localPreview = URL.createObjectURL(file);
        setAvatarUrl(localPreview);

        const formData = new FormData();
        formData.append("file", file);
        if (user?.id) {
            formData.append("userId", user.id);
        }

        const toastId = toast.loading("กำลังอัปโหลดรูปถ่ายโปรไฟล์ไปยัง Supabase Storage...");
        try {
            setUploadingImage(true);
            const res = await fetch("/api/users/avatar", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
            }

            setAvatarUrl(data.avatarUrl);
            toast.success("อัปโหลดรูปถ่ายโปรไฟล์สำเร็จ!", { id: toastId });
        } catch (error: any) {
            console.error("Avatar Upload Error:", error);
            toast.error(error.message || "ไม่สามารถอัปโหลดรูปภาพได้", { id: toastId });
        } finally {
            setUploadingImage(false);
        }
    };

    // Handle Form Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phoneNumber || !phoneNumber.trim()) {
            toast.error("กรุณาระบุเบอร์โทรศัพท์ 10 หลัก");
            return;
        }

        const cleanedPhone = phoneNumber.replace(/\D/g, "");
        if (!/^0\d{9}$/.test(cleanedPhone)) {
            toast.error("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก เริ่มต้นด้วย 0)");
            return;
        }

        if (!avatarUrl) {
            toast.error("กรุณาอัปโหลดรูปถ่ายโปรไฟล์หน้าตรงของคุณก่อนดำเนินการต่อ");
            return;
        }

        const toastId = toast.loading("กำลังบันทึกข้อมูลโปรไฟล์...");
        try {
            setSubmitting(true);
            const res = await fetch("/api/users/complete-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber: cleanedPhone,
                    profileImage: avatarUrl,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            }

            toast.success("บันทึกข้อมูลโปรไฟล์สมบูรณ์แล้ว! กำลังนำคุณไปยังหน้าจองคิว...", { id: toastId });

            setTimeout(() => {
                window.location.href = "/booking";
            }, 1000);
        } catch (error: any) {
            console.error("Complete Profile Submit Error:", error);
            toast.error(error.message || "ไม่สามารถบันทึกข้อมูลได้", { id: toastId });
            setSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">
                <div className="text-center space-y-3">
                    <span className="loading loading-spinner loading-lg text-amber-400"></span>
                    <p className="text-xs text-blue-200/70">กำลังตรวจสอบข้อมูลบัญชี...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#0F172A] text-white py-12 px-4 flex items-center justify-center overflow-hidden">
            {/* Background Image & Effects */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/bg1.png"
                    alt="Background"
                    fill
                    className="object-cover object-center opacity-30"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/90 via-[#0F172A]/80 to-[#0F172A]"></div>
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                ></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
                {/* Header Badge & Title */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                        <i className="fa-solid fa-shield-check"></i>
                        <span>ยืนยันตัวตนผ่าน ThaID เรียบร้อยแล้ว</span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        ด่านตรวจข้อมูลสมาชิก (Checkpoint)
                    </h1>
                    <p className="text-xs text-blue-200/70">
                        กรุณาอัปโหลดรูปถ่ายโปรไฟล์และระบุเบอร์โทรศัพท์ เพื่อเปิดใช้งานระบบจองคิวออนไลน์
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Read-Only ThaID Verified Box */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 border-b border-white/10 pb-2">
                            <i className="fa-solid fa-id-card text-amber-400"></i>
                            <span>ข้อมูลรับรองความถูกต้องจาก ThaID (Read-Only)</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-blue-200/60 block text-[10px]">ชื่อ-นามสกุล</span>
                                <span className="font-bold text-white text-sm">
                                    {profile?.fullName || user?.name || "สมาชิก DSD Yala"}
                                </span>
                            </div>
                            <div>
                                <span className="text-blue-200/60 block text-[10px]">เลขบัตรประชาชน (PID)</span>
                                <span className="font-mono font-bold text-white text-sm tracking-wider">
                                    {profile?.idCard || user?.idCard || "รับรองโดย ThaID"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Avatar Upload Section */}
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <label className="text-xs font-bold text-blue-200/90 block">
                            รูปถ่ายโปรไฟล์หน้าตรง <span className="text-red-400">*</span>
                        </label>

                        <div className="relative group cursor-pointer">
                            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-amber-400/40 shadow-xl bg-slate-800 flex items-center justify-center relative">
                                {avatarUrl ? (
                                    <Image
                                        src={avatarUrl}
                                        alt="Profile Avatar"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <i className="fa-solid fa-user text-4xl mb-1 block"></i>
                                        <span className="text-[9px] font-bold">เลือกรูปภาพ</span>
                                    </div>
                                )}

                                {uploadingImage && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                                        <span className="loading loading-spinner loading-md text-amber-400"></span>
                                    </div>
                                )}
                            </div>

                            {/* Camera Overlay Icon */}
                            <label
                                htmlFor="avatar-file-input"
                                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95"
                            >
                                <i className="fa-solid fa-camera text-sm"></i>
                            </label>
                            <input
                                id="avatar-file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>
                        <p className="text-[10px] text-blue-200/50">
                            รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 10MB) • จะถูกเก็บใน Supabase Storage
                        </p>
                    </div>

                    {/* Phone Number Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-blue-200/90 flex items-center gap-1.5">
                            <i className="fa-solid fa-phone text-amber-400"></i>
                            <span>เบอร์โทรศัพท์ (10 หลัก) สำหรับรับการแจ้งเตือน</span>
                            <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="tel"
                            maxLength={10}
                            placeholder="เช่น 0812345678"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                            className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200/30 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
                            required
                        />
                        <p className="text-[10px] text-blue-200/50">
                            ใช้สำหรับรับข้อความแจ้งเตือนผลคิวสอบ อบรม และการเชื่อมต่อ LINE Official Account
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting || uploadingImage}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span>
                                <span>กำลังบันทึกข้อมูล...</span>
                            </>
                        ) : (
                            <>
                                <span>บันทึกข้อมูล & เข้าสู่หน้าจองคิว</span>
                                <i className="fa-solid fa-arrow-right"></i>
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
