"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { parseProfileJson, buildProfileJson } from "@/lib/jsonEngine";

// ================ OPTION DATA ================
const titleOptions = [
    { value: "001", label: "นาย" },
    { value: "002", label: "นาง" },
    { value: "003", label: "นางสาว" },
];

const titleEnOptions = [
    { value: "Mr.", label: "Mr." },
    { value: "Mrs.", label: "Mrs." },
    { value: "Miss.", label: "Miss." },
];

const genderOptions = [
    { value: "1", label: "ชาย" },
    { value: "2", label: "หญิง" },
];

const educationLevels: Record<string, string> = {
    "00": "ต่ำกว่าประถมศึกษา",
    "01": "ประถมศึกษา",
    "02": "มัธยมศึกษาตอนต้น (ม.3)",
    "03": "มัธยมศึกษาตอนปลาย (ม.6)",
    "04": "ปวช.",
    "05": "ปวส. / อนุปริญญา",
    "06": "ปริญญาตรี",
    "07": "สูงกว่าปริญญาตรี",
};

const registerTypes = [
    { value: "1", label: "ลงทะเบียนใหม่" },
    { value: "2", label: "ปรับปรุงข้อมูล" },
];

const workStates: Record<string, string> = {
    "0": "ไม่ได้ทำงาน",
    "1": "ทำงานอยู่แล้ว",
};

const workSections: Record<string, string> = {
    "0": "ไม่ระบุ",
    "1": "ราชการ / รัฐวิสาหกิจ",
    "2": "เอกชน",
    "3": "ประกอบธุรกิจส่วนตัว",
    "4": "รับจ้างทั่วไป",
    "5": "เกษตรกรรม",
    "6": "อื่นๆ",
};

const unworkTypes: Record<string, string> = {
    "01": "ว่างงาน",
    "02": "แม่บ้าน/พ่อบ้าน",
    "03": "นักเรียน/นักศึกษา",
    "04": "เกษียณอายุ",
    "05": "ทุพพลภาพ/พิการ",
    "06": "ไม่ประสงค์ทำงาน",
    "15": "อื่นๆ",
};

const infoTypes: Record<string, string> = {
    "01": "หนังสือพิมพ์",
    "02": "วิทยุ/โทรทัศน์",
    "03": "อินเทอร์เน็ต",
    "04": "กรมพัฒนาฝีมือแรงงาน",
    "05": "บุคคลใกล้ชิด",
    "06": "อื่นๆ",
};

const bodyStateOptions: Record<string, string> = {
    "0": "ปกติ",
    "1": "พิการ/ทุพพลภาพ",
};

const bodyStateParts = ["แขน", "ขา", "ตา", "หู", "ปาก", "อื่นๆ"];

const SECTIONS = [
    { id: "personal", label: "ข้อมูลส่วนบุคคล", icon: "fa-user" },
    { id: "contact", label: "ที่อยู่ & ติดต่อ", icon: "fa-map-location-dot" },
    { id: "work", label: "ข้อมูลการทำงาน", icon: "fa-briefcase" },
    { id: "unwork", label: "กรณีไม่ได้ทำงาน", icon: "fa-person-circle-question" },
    { id: "info", label: "ความต้องการ & ความยินยอม", icon: "fa-clipboard-list" },
];

const INITIAL_FORM = {
    profileImage: "",
    register_type: "1",
    reg_title: "001",
    reg_title_en: "Mr.",
    reg_firstname: "",
    reg_lastname: "",
    reg_firstnameEng: "",
    reg_lastnameEng: "",
    gender: "1",
    reg_citizenid: "",
    reg_birth: "",
    nationality: "099",
    reg_education: "06",
    reg_education_section: "",
    reg_telephone: "",
    reg_email: "",
    reg_body_state: "0",
    reg_body_state_detail: "",
    reg_address_no: "",
    reg_address_moo: "",
    reg_address_soi: "",
    reg_address_street: "",
    reg_address_subdistrict: "",
    reg_address_district: "",
    reg_address_province: "",
    postcode: "",
    work_state: "0",
    work_section: "0",
    work_section_gov: "",
    work_section_self: "",
    work_section_detail: "0",
    work_salary: "",
    work_occupation: "",
    work_position: "",
    work_experience: "",
    work_place: "",
    work_province: "",
    work_telephone: "",
    work_fax: "",
    work_group: "",
    work_group_other: "",
    unwork_type: "15",
    unwork_other: "",
    info_type: "04",
    info_agree: "0",
    info_findjob: "0",
    info_findjob_detail: "",
    info_findjob_detail_industry: "",
    info_findjob_country: "",
    industry_desc: "00",
    info_findjob_detail_industry_desc: "00",
    official: "",
};

export default function EditProfilePage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [activeSection, setActiveSection] = useState("personal");
    const [form, setForm] = useState<Record<string, string>>(INITIAL_FORM);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }
        if (profile) {
            const p: any = profile;
            const detail = parseProfileJson(p.profileJson, { createdAt: p.createdAt });
            const birthRaw = detail.reg_birth || "";
            const birthDate = birthRaw.includes("T") ? birthRaw.split("T")[0] : birthRaw;

            setForm({
                ...INITIAL_FORM,
                ...(detail as Record<string, string>),
                profileImage: detail.profileImage || p.profileImageUrl || p.pictureUrl || "",
                reg_birth: birthDate,
                reg_telephone: detail.reg_telephone || p.phoneNumber || "",
                reg_email: detail.reg_email || p.email || "",
                reg_firstname: detail.reg_firstname || p.fullName?.split(" ")[0] || "",
                reg_lastname: detail.reg_lastname || p.fullName?.split(" ").slice(1).join(" ") || "",
                reg_citizenid: detail.reg_citizenid || "",
            });
        }
    }, [user, profile, authLoading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        const toastId = toast.loading("กำลังบันทึกข้อมูล...");
        try {
            const currentDetail = profile?.profileJson
                ? parseProfileJson(profile.profileJson, { createdAt: (profile as any).createdAt })
                : {};
            const newProfileJson = buildProfileJson({ ...currentDetail, ...form });
            const updatePayload: any = {
                id: user.id,
                profileJson: newProfileJson,
                fullName: `${form.reg_firstname} ${form.reg_lastname}`.trim(),
                phoneNumber: form.reg_telephone,
            };
            if (!profile?.memberId) {
                updatePayload.memberId = "MBR-" + Math.floor(10000000 + Math.random() * 90000000);
            }
            if (!profile?.role) {
                updatePayload.role = "member";
            }
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatePayload),
            });
            if (!res.ok) throw new Error("Failed to update profile");
            toast.success("บันทึกข้อมูลส่วนตัวสำเร็จ ✓", { id: toastId });
            router.push("/profile");
        } catch (error: any) {
            toast.error("เกิดข้อผิดพลาด: " + (error.message || ""), { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setUploadingImage(true);
        const toastId = toast.loading("กำลังอัปโหลดรูปภาพ...");
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("userId", user.id);
            const res = await fetch("/api/users/avatar", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการอัปโหลด");
            setForm(prev => ({ ...prev, profileImage: data.avatarUrl }));
            toast.success("อัปโหลดรูปโปรไฟล์สำเร็จ!", { id: toastId });
        } catch (err: any) {
            toast.error(err.message || "ไม่สามารถอัปโหลดรูปภาพได้", { id: toastId });
        } finally {
            setUploadingImage(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#001a33] to-[#002244]">
                <span className="loading loading-spinner loading-lg text-blue-500"></span>
            </div>
        );
    }

    const fs = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all placeholder-white/20";
    const ls = "block text-sm font-semibold text-blue-300/80 mb-2";

    const Field = ({ label, name, type = "text", placeholder = "", maxLength, required = false, children }: any) => (
        <div>
            <label className={ls}>{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
            {children ?? (
                <input
                    type={type}
                    name={name}
                    value={form[name] ?? ""}
                    onChange={handleChange}
                    required={required}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    className={`${fs} ${type === "date" ? "[&::-webkit-calendar-picker-indicator]:invert" : ""}`}
                />
            )}
        </div>
    );

    const Sel = ({ label, name, options, required = false }: { label: string; name: string; options: Record<string, string>; required?: boolean }) => (
        <div>
            <label className={ls}>{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
            <select name={name} value={form[name] ?? ""} onChange={handleChange} className={fs}>
                {Object.entries(options).map(([val, lbl]) => (
                    <option key={val} value={val} className="bg-[#001a33] text-white">{lbl}</option>
                ))}
            </select>
        </div>
    );

    const displayName = `${form.reg_firstname} ${form.reg_lastname}`.trim() || user?.name || "สมาชิก";
    const initialChar = (form.reg_firstname || displayName).charAt(0) || "ส";
    const isValidUrl = form.profileImage?.startsWith("http") || form.profileImage?.startsWith("/");

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#001a33] via-[#003366] to-[#002244] py-10 px-3 sm:px-4">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-4xl mx-auto"
            >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/profile" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all flex-shrink-0">
                        <i className="fa-solid fa-arrow-left"></i>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">แก้ไขข้อมูลส่วนตัว</h1>
                        <p className="text-blue-200/50 text-sm mt-0.5">ข้อมูลทั้งหมด {Object.keys(INITIAL_FORM).length} ฟิลด์ · มาตรฐาน DSD</p>
                    </div>
                </div>

                <form onSubmit={handleSave}>
                    <div className="flex flex-col lg:flex-row gap-5">

                        {/* ---- LEFT: Avatar + Section Nav ---- */}
                        <div className="lg:w-64 flex-shrink-0 flex flex-col gap-4">

                            {/* Avatar Card */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl flex flex-col items-center gap-3">
                                <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center border-2 border-white/20 overflow-hidden shadow-xl group">
                                    {uploadingImage && (
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 z-20">
                                            <span className="loading loading-spinner loading-md text-white"></span>
                                            <span className="text-[10px] text-white font-bold">อัปโหลด...</span>
                                        </div>
                                    )}
                                    {isValidUrl ? (
                                        <img src={form.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white font-black text-5xl">{initialChar}</span>
                                    )}
                                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white z-10 gap-1">
                                        <i className="fa-solid fa-camera text-2xl"></i>
                                        <span className="text-[10px] font-bold">เปลี่ยนรูป</span>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                                    </label>
                                </div>
                                <label className="cursor-pointer px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-xl text-xs font-bold text-blue-300 transition-all flex items-center gap-2">
                                    <i className="fa-solid fa-cloud-arrow-up"></i>
                                    {uploadingImage ? "กำลังอัปโหลด..." : "อัปโหลดรูปใหม่"}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                                </label>
                                <p className="text-blue-200/40 text-[10px] text-center">JPG · PNG · WEBP (max 10MB)</p>
                            </div>

                            {/* Section Nav */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-3 backdrop-blur-xl flex flex-col gap-1">
                                {SECTIONS.map(sec => (
                                    <button
                                        key={sec.id}
                                        type="button"
                                        onClick={() => setActiveSection(sec.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${activeSection === sec.id
                                            ? "bg-blue-500/25 text-blue-300 border border-blue-500/30"
                                            : "text-white/50 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <i className={`fa-solid ${sec.icon} w-4 text-center`}></i>
                                        <span>{sec.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Save button (desktop) */}
                            <button
                                type="submit"
                                disabled={saving}
                                className="hidden lg:flex btn w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold border-0 hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                            >
                                {saving ? (
                                    <><span className="loading loading-spinner loading-sm"></span> กำลังบันทึก...</>
                                ) : (
                                    <><i className="fa-solid fa-check mr-2"></i> บันทึกข้อมูล</>
                                )}
                            </button>
                        </div>

                        {/* ---- RIGHT: Form Sections ---- */}
                        <div className="flex-1">
                            <AnimatePresence mode="wait">
                                {/* SECTION 1: ข้อมูลส่วนบุคคล */}
                                {activeSection === "personal" && (
                                    <motion.div key="personal" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}
                                        className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl"
                                    >
                                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                            <i className="fa-solid fa-user text-blue-400"></i> ข้อมูลส่วนบุคคล
                                            <span className="ml-auto text-xs font-normal text-blue-300/40 bg-blue-500/10 px-2 py-1 rounded-lg">Section 1/5</span>
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <Sel label="ประเภทการลงทะเบียน" name="register_type" options={Object.fromEntries(registerTypes.map(r => [r.value, r.label]))} />
                                            <Sel label="เพศ" name="gender" options={Object.fromEntries(genderOptions.map(g => [g.value, g.label]))} />

                                            <Sel label="คำนำหน้า (ภาษาไทย)" name="reg_title" options={Object.fromEntries(titleOptions.map(t => [t.value, t.label]))} required />
                                            <Sel label="คำนำหน้า (ภาษาอังกฤษ)" name="reg_title_en" options={Object.fromEntries(titleEnOptions.map(t => [t.value, t.label]))} />

                                            <Field label="ชื่อ (ภาษาไทย)" name="reg_firstname" placeholder="ชื่อจริง" required />
                                            <Field label="นามสกุล (ภาษาไทย)" name="reg_lastname" placeholder="นามสกุล" required />

                                            <Field label="ชื่อ (ภาษาอังกฤษ)" name="reg_firstnameEng" placeholder="First Name" />
                                            <Field label="นามสกุล (ภาษาอังกฤษ)" name="reg_lastnameEng" placeholder="Last Name" />

                                            <Field label="เลขบัตรประชาชน (13 หลัก)" name="reg_citizenid" placeholder="1234567890123" maxLength={13} required />
                                            <Field label="วันเดือนปีเกิด" name="reg_birth" type="date" required />

                                            <div>
                                                <label className={ls}>สัญชาติ</label>
                                                <input type="text" name="nationality" value={form.nationality} onChange={handleChange} className={fs} placeholder="รหัสสัญชาติ เช่น 099" />
                                            </div>
                                            <Sel label="ระดับการศึกษาสูงสุด" name="reg_education" options={educationLevels} />

                                            <Field label="สาขาวิชา / สาขาอาชีพ" name="reg_education_section" placeholder="เช่น วิทยาการคอมพิวเตอร์" />

                                            <div>
                                                <label className={ls}>สภาพร่างกาย</label>
                                                <select name="reg_body_state" value={form.reg_body_state} onChange={handleChange} className={fs}>
                                                    {Object.entries(bodyStateOptions).map(([v, l]) => (
                                                        <option key={v} value={v} className="bg-[#001a33]">{l}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {form.reg_body_state === "1" && (
                                                <div className="sm:col-span-2">
                                                    <label className={ls}>รายละเอียดความพิการ</label>
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {bodyStateParts.map(part => (
                                                            <label key={part} className="flex items-center gap-1.5 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    className="checkbox checkbox-sm checkbox-primary"
                                                                    checked={form.reg_body_state_detail.includes(part)}
                                                                    onChange={e => {
                                                                        const current = form.reg_body_state_detail.split(",").filter(Boolean);
                                                                        const updated = e.target.checked ? [...current, part] : current.filter(p => p !== part);
                                                                        setForm(prev => ({ ...prev, reg_body_state_detail: updated.join(",") }));
                                                                    }}
                                                                />
                                                                <span className="text-sm text-white/80">{part}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-6 flex justify-end">
                                            <button type="button" onClick={() => setActiveSection("contact")}
                                                className="btn btn-sm rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 font-bold">
                                                ถัดไป: ที่อยู่ &amp; ติดต่อ <i className="fa-solid fa-arrow-right ml-1"></i>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SECTION 2: ที่อยู่ & ติดต่อ */}
                                {activeSection === "contact" && (
                                    <motion.div key="contact" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}
                                        className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl"
                                    >
                                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                            <i className="fa-solid fa-map-location-dot text-emerald-400"></i> ที่อยู่ตามภูมิลำเนา &amp; ข้อมูลติดต่อ
                                            <span className="ml-auto text-xs font-normal text-blue-300/40 bg-blue-500/10 px-2 py-1 rounded-lg">Section 2/5</span>
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                            <Field label="บ้านเลขที่" name="reg_address_no" placeholder="เช่น 33/13" />
                                            <Field label="หมู่ที่" name="reg_address_moo" placeholder="เช่น 1" />
                                            <Field label="ซอย" name="reg_address_soi" placeholder="เช่น สุขุมวิท 1" />
                                            <Field label="ถนน" name="reg_address_street" placeholder="เช่น ศรีบูรพา" />
                                            <Field label="ตำบล / แขวง" name="reg_address_subdistrict" placeholder="ตำบล/แขวง" />
                                            <Field label="อำเภอ / เขต" name="reg_address_district" placeholder="อำเภอ/เขต" />
                                            <Field label="จังหวัด" name="reg_address_province" placeholder="จังหวัด" />
                                            <Field label="รหัสไปรษณีย์" name="postcode" placeholder="95000" maxLength={5} />
                                        </div>

                                        <div className="mt-6 border-t border-white/10 pt-6">
                                            <h3 className="text-sm font-bold text-white/60 mb-4 uppercase tracking-wider">ข้อมูลติดต่อ</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <Field label="เบอร์โทรศัพท์มือถือ" name="reg_telephone" type="tel" placeholder="08X-XXX-XXXX" required />
                                                <Field label="อีเมล" name="reg_email" type="email" placeholder="example@email.com" />
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-between">
                                            <button type="button" onClick={() => setActiveSection("personal")}
                                                className="btn btn-sm rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 font-bold">
                                                <i className="fa-solid fa-arrow-left mr-1"></i> ย้อนกลับ
                                            </button>
                                            <button type="button" onClick={() => setActiveSection("work")}
                                                className="btn btn-sm rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 font-bold">
                                                ถัดไป: ข้อมูลการทำงาน <i className="fa-solid fa-arrow-right ml-1"></i>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SECTION 3: การทำงาน */}
                                {activeSection === "work" && (
                                    <motion.div key="work" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}
                                        className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl"
                                    >
                                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                            <i className="fa-solid fa-briefcase text-amber-400"></i> ข้อมูลการทำงาน
                                            <span className="ml-auto text-xs font-normal text-blue-300/40 bg-blue-500/10 px-2 py-1 rounded-lg">Section 3/5</span>
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <Sel label="สถานภาพการทำงาน" name="work_state" options={workStates} />
                                            <Sel label="ประเภทสถานประกอบการ" name="work_section" options={workSections} />

                                            {(form.work_section === "1") && (
                                                <Field label="หน่วยงานราชการ/รัฐวิสาหกิจ" name="work_section_gov" placeholder="ชื่อหน่วยงาน" />
                                            )}
                                            {(form.work_section === "3") && (
                                                <Field label="ชื่อกิจการส่วนตัว" name="work_section_self" placeholder="ชื่อธุรกิจ/ร้านค้า" />
                                            )}

                                            <Field label="ชื่อสถานประกอบการ / บริษัท" name="work_place" placeholder="ชื่อบริษัท/หน่วยงาน" />
                                            <Field label="ตำแหน่งงาน" name="work_position" placeholder="เช่น วิศวกร, ครู, ช่าง" />
                                            <Field label="อาชีพ / งานที่ทำ" name="work_occupation" placeholder="เช่น พนักงานขาย, เกษตรกร" />
                                            <Field label="ประสบการณ์ทำงาน (ปี)" name="work_experience" placeholder="เช่น 3" />
                                            <Field label="รายได้ต่อเดือน (บาท)" name="work_salary" placeholder="เช่น 15000" />
                                            <Field label="จังหวัดที่ทำงาน" name="work_province" placeholder="จังหวัด" />
                                            <Field label="เบอร์โทรที่ทำงาน" name="work_telephone" type="tel" placeholder="074-XXXXXX" />
                                            <Field label="เบอร์แฟกซ์" name="work_fax" placeholder="074-XXXXXX" />
                                            <Field label="กลุ่มอาชีพ" name="work_group" placeholder="เช่น กลุ่มก่อสร้าง" />
                                            <Field label="กลุ่มอาชีพอื่นๆ (ระบุ)" name="work_group_other" placeholder="กรณีเลือกอื่นๆ" />
                                        </div>
                                        <div className="mt-6 flex justify-between">
                                            <button type="button" onClick={() => setActiveSection("contact")}
                                                className="btn btn-sm rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 font-bold">
                                                <i className="fa-solid fa-arrow-left mr-1"></i> ย้อนกลับ
                                            </button>
                                            <button type="button" onClick={() => setActiveSection("unwork")}
                                                className="btn btn-sm rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 font-bold">
                                                ถัดไป: กรณีไม่ได้ทำงาน <i className="fa-solid fa-arrow-right ml-1"></i>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SECTION 4: กรณีไม่ได้ทำงาน */}
                                {activeSection === "unwork" && (
                                    <motion.div key="unwork" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}
                                        className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl"
                                    >
                                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                            <i className="fa-solid fa-person-circle-question text-rose-400"></i> กรณีไม่ได้ทำงาน
                                            <span className="ml-auto text-xs font-normal text-blue-300/40 bg-blue-500/10 px-2 py-1 rounded-lg">Section 4/5</span>
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <Sel label="สาเหตุที่ไม่ได้ทำงาน" name="unwork_type" options={unworkTypes} />
                                            {form.unwork_type === "15" && (
                                                <Field label="ระบุสาเหตุที่ไม่ได้ทำงาน (อื่นๆ)" name="unwork_other" placeholder="โปรดระบุ" />
                                            )}
                                        </div>
                                        <div className="mt-6 flex justify-between">
                                            <button type="button" onClick={() => setActiveSection("work")}
                                                className="btn btn-sm rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 font-bold">
                                                <i className="fa-solid fa-arrow-left mr-1"></i> ย้อนกลับ
                                            </button>
                                            <button type="button" onClick={() => setActiveSection("info")}
                                                className="btn btn-sm rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 font-bold">
                                                ถัดไป: ความต้องการ <i className="fa-solid fa-arrow-right ml-1"></i>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SECTION 5: ความต้องการ & ความยินยอม */}
                                {activeSection === "info" && (
                                    <motion.div key="info" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}
                                        className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl"
                                    >
                                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                            <i className="fa-solid fa-clipboard-list text-violet-400"></i> ความต้องการ &amp; ความยินยอม
                                            <span className="ml-auto text-xs font-normal text-blue-300/40 bg-blue-500/10 px-2 py-1 rounded-lg">Section 5/5</span>
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <Sel label="ทราบข่าวจาก" name="info_type" options={infoTypes} />

                                            <div>
                                                <label className={ls}>ยินยอมให้เผยแพร่ข้อมูล</label>
                                                <select name="info_agree" value={form.info_agree} onChange={handleChange} className={fs}>
                                                    <option value="1" className="bg-[#001a33]">ยินยอม</option>
                                                    <option value="0" className="bg-[#001a33]">ไม่ยินยอม</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className={ls}>ต้องการหางาน</label>
                                                <select name="info_findjob" value={form.info_findjob} onChange={handleChange} className={fs}>
                                                    <option value="1" className="bg-[#001a33]">ต้องการ</option>
                                                    <option value="0" className="bg-[#001a33]">ไม่ต้องการ</option>
                                                </select>
                                            </div>

                                            {form.info_findjob === "1" && (
                                                <>
                                                    <Field label="ตำแหน่งงานที่ต้องการ" name="info_findjob_detail" placeholder="เช่น ช่างไฟฟ้า" />
                                                    <Field label="อุตสาหกรรมที่ต้องการ" name="info_findjob_detail_industry" placeholder="เช่น อุตสาหกรรมการผลิต" />
                                                    <Field label="จังหวัดที่ต้องการทำงาน" name="info_findjob_country" placeholder="เช่น ยะลา, สงขลา" />
                                                    <Field label="รหัสอุตสาหกรรม" name="industry_desc" placeholder="เช่น 00" />
                                                    <Field label="รหัสอุตสาหกรรม (รายละเอียด)" name="info_findjob_detail_industry_desc" placeholder="เช่น 00" />
                                                </>
                                            )}

                                            <Field label="ผู้รับรอง / เจ้าหน้าที่ผู้บันทึก" name="official" placeholder="ชื่อเจ้าหน้าที่" />
                                        </div>

                                        {/* Summary Info */}
                                        <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                            <p className="text-emerald-300 text-sm font-semibold flex items-center gap-2">
                                                <i className="fa-solid fa-circle-check"></i>
                                                ข้อมูลครบ {Object.keys(form).filter(k => form[k]).length} / {Object.keys(INITIAL_FORM).length} ฟิลด์
                                            </p>
                                            <p className="text-emerald-200/60 text-xs mt-1">กด &quot;บันทึกข้อมูล&quot; เพื่อยืนยันการเปลี่ยนแปลงทั้งหมด</p>
                                        </div>

                                        <div className="mt-6 flex justify-between gap-3">
                                            <button type="button" onClick={() => setActiveSection("unwork")}
                                                className="btn btn-sm rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 font-bold">
                                                <i className="fa-solid fa-arrow-left mr-1"></i> ย้อนกลับ
                                            </button>
                                            <button type="submit" disabled={saving}
                                                className="btn flex-1 sm:flex-none sm:min-w-48 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold border-0 hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
                                                {saving ? (
                                                    <><span className="loading loading-spinner loading-sm"></span> กำลังบันทึก...</>
                                                ) : (
                                                    <><i className="fa-solid fa-check mr-2"></i> บันทึกข้อมูลส่วนตัว</>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
