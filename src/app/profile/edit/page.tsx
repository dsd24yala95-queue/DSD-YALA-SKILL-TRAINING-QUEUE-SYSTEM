"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";
import { parseProfileJson, buildProfileJson } from "@/lib/jsonEngine";

const titleOptions = [
    { value: "001", label: "นาย" },
    { value: "002", label: "นาง" },
    { value: "003", label: "นางสาว" },
];

const educationLevels: { [key: string]: string } = {
    "00": "ต่ำกว่าประถมศึกษา",
    "01": "ประถมศึกษา",
    "02": "มัธยมศึกษาตอนต้น (ม.3)",
    "03": "มัธยมศึกษาตอนปลาย (ม.6)",
    "04": "ปวช.",
    "05": "ปวส. / อนุปริญญา",
    "06": "ปริญญาตรี",
    "07": "สูงกว่าปริญญาตรี",
};

export default function EditProfilePage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [form, setForm] = useState({
        profileImage: "", // เพิ่มฟิลด์สำหรับรูปภาพ
        reg_title: "001",
        reg_firstname: "",
        reg_lastname: "",
        reg_citizenid: "",
        reg_birth: "",
        reg_telephone: "",
        reg_education: "03",
        reg_address_no: "",
        reg_address_moo: "",
        reg_address_soi: "",
        reg_address_street: "",
        reg_address_subdistrict: "",
        reg_address_district: "",
        reg_address_province: "",
        postcode: "",
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        if (profile) {
            const p: any = profile;
            const detail = parseProfileJson(p.profileJson, { createdAt: p.createdAt });

            setForm({
                profileImage: detail.profileImage || p.profileImageUrl || p.pictureUrl || "",
                reg_title: detail.reg_title || "001",
                reg_firstname: detail.reg_firstname || p.reg_firstname || p.fullName?.split(' ')[0] || "",
                reg_lastname: detail.reg_lastname || p.reg_lastname || p.fullName?.split(' ').slice(1).join(' ') || "",
                reg_citizenid: detail.reg_citizenid || p.idCard || "",
                reg_birth: detail.reg_birth || "",
                reg_telephone: detail.reg_telephone || p.reg_telephone || p.phone || "",
                reg_education: detail.reg_education || "03",
                reg_address_no: detail.reg_address_no || "",
                reg_address_moo: detail.reg_address_moo || "",
                reg_address_soi: detail.reg_address_soi || "",
                reg_address_street: detail.reg_address_street || "",
                reg_address_subdistrict: detail.reg_address_subdistrict || "",
                reg_address_district: detail.reg_address_district || "",
                reg_address_province: detail.reg_address_province || "",
                postcode: detail.postcode || "",
            });
        }
    }, [user, profile, authLoading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        const toastId = toast.loading("กำลังบันทึกข้อมูล...");

        try {
            const currentDetail = profile?.profileJson ? parseProfileJson(profile.profileJson, { createdAt: (profile as any).createdAt }) : {};
            const newProfileJson = buildProfileJson({ ...currentDetail, ...form });
            
            const updatePayload: any = {
                id: user.id, // User ID from NextAuth
                profileJson: newProfileJson,
                fullName: `${form.reg_firstname} ${form.reg_lastname}`.trim(),
                phoneNumber: form.reg_telephone,
            };

            // If user doesn't have a memberId yet, generate one
            if (!profile?.memberId) {
                updatePayload.memberId = "MBR-" + Math.floor(10000000 + Math.random() * 90000000);
            }
            if (!profile?.role) {
                updatePayload.role = "member";
            }
            
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatePayload)
            });

            if (!res.ok) {
                throw new Error("Failed to update profile");
            }

            toast.success("บันทึกข้อมูลส่วนตัวสำเร็จ", { id: toastId });
            router.push("/profile");
            
        } catch (error: any) {
            console.error("Error saving profile:", error);
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + (error.message || ""), { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#001a33] to-[#002244]">
                <span className="loading loading-spinner loading-lg text-blue-500"></span>
            </div>
        );
    }

    const fieldStyle = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all";
    const labelStyle = "block text-sm font-semibold text-blue-200/60 mb-2";

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingImage(true);
        const toastId = toast.loading("กำลังอัปโหลดรูปภาพไปยัง Supabase Cloud Storage...");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("userId", user.id);

            const res = await fetch("/api/users/avatar", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");

            setForm(prev => ({ ...prev, profileImage: data.avatarUrl }));
            toast.success("อัปโหลดรูปโปรไฟล์ไปยัง Supabase Storage สำเร็จ!", { id: toastId });
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "ไม่สามารถอัปโหลดรูปภาพได้", { id: toastId });
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#001a33] via-[#003366] to-[#002244] py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto"
            >
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all">
                        <i className="fa-solid fa-arrow-left"></i>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">แก้ไขข้อมูลส่วนตัว</h1>
                        <p className="text-blue-200/60 text-sm mt-1">อัปเดตประวัติส่วนตัวและที่อยู่สำหรับการติดต่อ</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
                    
                    {/* Profile Image Upload */}
                    <div className="mb-8 flex flex-col items-center">
                        <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center border-2 border-white/20 overflow-hidden shadow-2xl mb-4 group">
                            {uploadingImage ? (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-white z-20">
                                    <span className="loading loading-spinner loading-md text-white"></span>
                                    <span className="text-xs font-bold">กำลังอัปโหลด...</span>
                                </div>
                            ) : null}

                            {(() => {
                                const isValidUrl = form.profileImage && typeof form.profileImage === "string" && (form.profileImage.startsWith("http") || form.profileImage.startsWith("/"));
                                const displayName = `${form.reg_firstname} ${form.reg_lastname}`.trim() || user?.name || "สมาชิก";
                                const initialChar = displayName.charAt(0) || "ส";

                                return isValidUrl ? (
                                    <img
                                        src={form.profileImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <span className="text-white font-black text-5xl drop-shadow-md">
                                        {initialChar}
                                    </span>
                                );
                            })()}

                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white z-10 gap-1">
                                <i className="fa-solid fa-camera text-2xl"></i>
                                <span className="text-[10px] font-bold">เปลี่ยนรูปภาพ</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                            </label>
                        </div>
                        <label className="cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2">
                            <i className="fa-solid fa-cloud-arrow-up text-blue-400"></i>
                            {uploadingImage ? "กำลังอัปโหลดรูป..." : "📷 อัปโหลดรูปโปรไฟล์ใหม่"}
                            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                        </label>
                        <p className="text-blue-200/50 text-xs mt-2">รองรับไฟล์ JPG, PNG, WEBP (ขนาดไม่เกิน 10MB)</p>
                    </div>

                    {/* Section 1: ข้อมูลส่วนบุคคล */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-blue-300 mb-4 border-b border-white/10 pb-2">
                            <i className="fa-solid fa-user-pen mr-2"></i> ข้อมูลส่วนบุคคล
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className={labelStyle}>คำนำหน้า</label>
                                <select name="reg_title" value={form.reg_title} onChange={handleChange} className={fieldStyle}>
                                    {titleOptions.map(opt => (
                                        <option key={opt.value} value={opt.value} className="bg-[#002244] text-white">{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="hidden sm:block"></div>
                            
                            <div>
                                <label className={labelStyle}>ชื่อจริง <span className="text-red-400">*</span></label>
                                <input type="text" name="reg_firstname" value={form.reg_firstname} onChange={handleChange} required className={fieldStyle} placeholder="ชื่อจริง" />
                            </div>
                            <div>
                                <label className={labelStyle}>นามสกุล <span className="text-red-400">*</span></label>
                                <input type="text" name="reg_lastname" value={form.reg_lastname} onChange={handleChange} required className={fieldStyle} placeholder="นามสกุล" />
                            </div>

                            <div>
                                <label className={labelStyle}>เลขบัตรประชาชน (13 หลัก) <span className="text-red-400">*</span></label>
                                <input type="text" name="reg_citizenid" value={form.reg_citizenid} onChange={handleChange} required maxLength={13} className={fieldStyle} placeholder="1234567890123" />
                            </div>
                            <div>
                                <label className={labelStyle}>วันเดือนปีเกิด <span className="text-red-400">*</span></label>
                                <input type="date" name="reg_birth" value={form.reg_birth} onChange={handleChange} required className={`${fieldStyle} [&::-webkit-calendar-picker-indicator]:invert`} />
                            </div>

                            <div>
                                <label className={labelStyle}>ระดับการศึกษาสูงสุด</label>
                                <select name="reg_education" value={form.reg_education} onChange={handleChange} className={fieldStyle}>
                                    {Object.entries(educationLevels).map(([key, val]) => (
                                        <option key={key} value={key} className="bg-[#002244] text-white">{val}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>เบอร์โทรศัพท์มือถือ <span className="text-red-400">*</span></label>
                                <input type="tel" name="reg_telephone" value={form.reg_telephone} onChange={handleChange} required className={fieldStyle} placeholder="08X-XXX-XXXX" />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: ที่อยู่ */}
                    <div>
                        <h3 className="text-lg font-bold text-blue-300 mb-4 border-b border-white/10 pb-2">
                            <i className="fa-solid fa-map-location-dot mr-2"></i> ที่อยู่ตามภูมิลำเนา
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            <div>
                                <label className={labelStyle}>บ้านเลขที่</label>
                                <input type="text" name="reg_address_no" value={form.reg_address_no} onChange={handleChange} className={fieldStyle} placeholder="เช่น 123/4" />
                            </div>
                            <div>
                                <label className={labelStyle}>หมู่ที่</label>
                                <input type="text" name="reg_address_moo" value={form.reg_address_moo} onChange={handleChange} className={fieldStyle} placeholder="เช่น 1" />
                            </div>
                            <div>
                                <label className={labelStyle}>ซอย</label>
                                <input type="text" name="reg_address_soi" value={form.reg_address_soi} onChange={handleChange} className={fieldStyle} placeholder="เช่น สุขุมวิท 1" />
                            </div>
                            <div>
                                <label className={labelStyle}>ถนน</label>
                                <input type="text" name="reg_address_street" value={form.reg_address_street} onChange={handleChange} className={fieldStyle} placeholder="เช่น เพชรเกษม" />
                            </div>
                            <div>
                                <label className={labelStyle}>ตำบล/แขวง</label>
                                <input type="text" name="reg_address_subdistrict" value={form.reg_address_subdistrict} onChange={handleChange} className={fieldStyle} placeholder="ตำบล" />
                            </div>
                            <div>
                                <label className={labelStyle}>อำเภอ/เขต</label>
                                <input type="text" name="reg_address_district" value={form.reg_address_district} onChange={handleChange} className={fieldStyle} placeholder="อำเภอ" />
                            </div>
                            <div>
                                <label className={labelStyle}>จังหวัด</label>
                                <input type="text" name="reg_address_province" value={form.reg_address_province} onChange={handleChange} className={fieldStyle} placeholder="จังหวัด" />
                            </div>
                            <div>
                                <label className={labelStyle}>รหัสไปรษณีย์</label>
                                <input type="text" name="postcode" value={form.postcode} onChange={handleChange} maxLength={5} className={fieldStyle} placeholder="เช่น 95000" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-10 flex gap-4 pt-6 border-t border-white/10">
                        <Link href="/profile" className="btn flex-1 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all border-0 hover:border-0 hover:bg-white/10">
                            ยกเลิก
                        </Link>
                        <button type="submit" disabled={saving} className="btn flex-[2] rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold border-0 hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
                            {saving ? (
                                <><span className="loading loading-spinner loading-sm"></span> กำลังบันทึก...</>
                            ) : (
                                <><i className="fa-solid fa-check mr-2"></i> บันทึกข้อมูลส่วนตัว</>
                            )}
                        </button>
                    </div>

                </form>
            </motion.div>
        </div>
    );
}
