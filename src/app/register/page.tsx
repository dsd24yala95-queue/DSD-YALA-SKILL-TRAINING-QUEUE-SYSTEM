"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { buildProfileJson } from "@/lib/jsonEngine";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { SOUTHERN_ADDRESS_DB } from "@/lib/addressDb";

interface FormData {
    register_type: string;
    reg_title: string;
    reg_title_en: string;
    gender: string;
    reg_firstname: string;
    reg_lastname: string;
    reg_firstnameEng: string;
    reg_lastnameEng: string;
    reg_citizenid: string;
    reg_birth: string;
    nationality: string;
    reg_telephone: string;
    reg_email: string;
    reg_education: string;
    reg_education_section: string;
    reg_body_state: string;
    reg_body_state_detail: string;
    reg_address_no: string;
    reg_address_moo: string;
    reg_address_street: string;
    reg_address_soi: string;
    reg_address_province: string;
    reg_address_district: string;
    reg_address_subdistrict: string;
    postcode: string;
    work_state: string;
    work_section: string;
    work_section_gov: string;
    work_section_self: string;
    work_salary: string;
    work_position: string;
    work_experience: string;
    work_place: string;
    work_province: string;
    work_telephone: string;
    work_group: string;
    work_group_other: string;
    work_occupation: string;
    work_fax: string;
    unwork_type: string;
    unwork_other: string;
    info_type: string;
    industry_desc: string;
    info_findjob: string;
    info_findjob_detail: string;
    info_findjob_detail_industry: string;
    info_findjob_detail_industry_desc: string;
    info_findjob_country: string;
    info_agree: string;
    official: string;
    regist_date: string;
    profileImage: string;
}

const initialFormData: FormData = {
    register_type: "T",
    reg_title: "001",
    reg_title_en: "Mr.",
    gender: "1",
    reg_firstname: "",
    reg_lastname: "",
    reg_firstnameEng: "",
    reg_lastnameEng: "",
    reg_citizenid: "",
    reg_birth: "",
    nationality: "099",
    reg_telephone: "",
    reg_email: "",
    reg_education: "",
    reg_education_section: "",
    reg_body_state: "0",
    reg_body_state_detail: "",
    reg_address_no: "",
    reg_address_moo: "",
    reg_address_street: "",
    reg_address_soi: "",
    reg_address_province: "95",
    reg_address_district: "",
    reg_address_subdistrict: "",
    postcode: "",
    work_state: "0",
    work_section: "",
    work_section_gov: "",
    work_section_self: "",
    work_salary: "",
    work_position: "",
    work_experience: "",
    work_place: "",
    work_province: "",
    work_telephone: "",
    work_group: "",
    work_group_other: "",
    work_occupation: "",
    work_fax: "",
    unwork_type: "",
    unwork_other: "",
    info_type: "04",
    industry_desc: "00",
    info_findjob: "0",
    info_findjob_detail: "",
    info_findjob_detail_industry: "",
    info_findjob_detail_industry_desc: "00",
    info_findjob_country: "",
    info_agree: "0",
    official: "",
    regist_date: "",
    profileImage: "",
};

const titles = [
    { value: "001", label: "นาย", labelEn: "Mr." },
    { value: "002", label: "นาง", labelEn: "Mrs." },
    { value: "003", label: "นางสาว", labelEn: "Miss" },
    { value: "004", label: "อื่นๆ", labelEn: "Other" },
];

const titlesEn = [
    { value: "Mr.", label: "Mr." },
    { value: "Mrs.", label: "Mrs." },
    { value: "Miss", label: "Miss" },
    { value: "Other", label: "Other" },
];

const educationLevels = [
    { value: "00", label: "ต่ำกว่าประถมศึกษา" },
    { value: "01", label: "ประถมศึกษา" },
    { value: "02", label: "มัธยมศึกษาตอนต้น (ม.3)" },
    { value: "03", label: "มัธยมศึกษาตอนปลาย (ม.6)" },
    { value: "04", label: "ปวช." },
    { value: "05", label: "ปวส. / อนุปริญญา" },
    { value: "06", label: "ปริญญาตรี" },
    { value: "07", label: "สูงกว่าปริญญาตรี" },
];

const provinces = [
    { value: "95", label: "ยะลา" },
    { value: "94", label: "ปัตตานี" },
    { value: "96", label: "นราธิวาส" },
    { value: "90", label: "สงขลา" },
    { value: "00", label: "อื่นๆ" },
];

const infoTypes = [
    { value: "01", label: "เจ้าหน้าที่แนะนำ" },
    { value: "02", label: "ป้ายโฆษณา" },
    { value: "03", label: "อินเทอร์เน็ต / โซเชียล" },
    { value: "04", label: "เพื่อน / คนรู้จัก" },
    { value: "05", label: "วิทยุ / โทรทัศน์" },
    { value: "06", label: "อื่นๆ" },
];

const industries = [
    { value: "00", label: "ยังไม่ระบุ" },
    { value: "01", label: "เกษตรกรรม" },
    { value: "02", label: "ก่อสร้าง" },
    { value: "03", label: "อาหารและเครื่องดื่ม" },
    { value: "04", label: "ช่างไฟฟ้า / อิเล็กทรอนิกส์" },
    { value: "05", label: "ยานยนต์" },
    { value: "06", label: "ตัดเย็บเสื้อผ้า" },
    { value: "07", label: "บริการ" },
];

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const phoneParam = params.get("phone");
            if (phoneParam) {
                setFormData((prev) => ({ ...prev, reg_telephone: phoneParam }));
            }
        }
    }, []);

    const updateField = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Progress calculation (DSD 50-field)
    const REQUIRED_FIELDS: (keyof FormData)[] = [
        'reg_firstname', 'reg_lastname', 'reg_citizenid', 'reg_birth', 'reg_telephone',
        'reg_address_no', 'reg_address_province', 'reg_address_district', 'reg_address_subdistrict',
        'reg_education', 'postcode'
    ];
    const ALL_FIELDS: (keyof FormData)[] = [
        'register_type', 'reg_title', 'reg_title_en', 'gender', 'reg_firstname', 'reg_lastname',
        'reg_firstnameEng', 'reg_lastnameEng', 'reg_citizenid', 'reg_birth', 'reg_telephone',
        'reg_email', 'reg_education', 'reg_education_section', 'reg_body_state', 'reg_body_state_detail',
        'reg_address_no', 'reg_address_moo', 'reg_address_street', 'reg_address_soi',
        'reg_address_province', 'reg_address_district', 'reg_address_subdistrict', 'postcode',
        'work_state', 'work_section', 'work_salary', 'work_position', 'work_experience',
        'work_place', 'work_province', 'work_telephone', 'work_group', 'work_occupation',
        'unwork_type', 'info_type', 'industry_desc', 'info_findjob', 'info_findjob_detail',
        'info_findjob_detail_industry', 'info_findjob_country', 'nationality', 'profileImage',
        'info_agree', 'work_fax', 'work_section_gov', 'work_section_self', 'work_group_other', 'unwork_other', 'official'
    ];
    const filledCount = ALL_FIELDS.filter(f => {
        const v = formData[f];
        return v && String(v).trim() !== '' && v !== '0' && v !== '00' && v !== '099';
    }).length;
    const requiredFilled = REQUIRED_FIELDS.filter(f => formData[f] && String(formData[f]).trim() !== '').length;
    const progressPct = Math.round((requiredFilled / REQUIRED_FIELDS.length) * 100);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const max = 480;
                let w = img.width;
                let h = img.height;
                if (w > max || h > max) {
                    const scale = max / Math.max(w, h);
                    w = Math.round(w * scale);
                    h = Math.round(h * scale);
                }
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, w, h);
                    const b64 = canvas.toDataURL("image/jpeg", 0.82);
                    updateField("profileImage", b64);
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleProvinceChange = (val: string) => {
        setFormData((prev) => ({
            ...prev,
            reg_address_province: val,
            reg_address_district: "",
            reg_address_subdistrict: "",
            postcode: "",
        }));
    };

    const handleDistrictChange = (val: string) => {
        setFormData((prev) => ({
            ...prev,
            reg_address_district: val,
            reg_address_subdistrict: "",
            postcode: "",
        }));
    };

    const handleSubdistrictChange = (val: string) => {
        let code = "";
        const prov = formData.reg_address_province;
        const dist = formData.reg_address_district;
        if (SOUTHERN_ADDRESS_DB[prov]?.[dist]?.[val]) {
            code = SOUTHERN_ADDRESS_DB[prov][dist][val];
        }
        setFormData((prev) => ({
            ...prev,
            reg_address_subdistrict: val,
            postcode: code || prev.postcode,
        }));
    };

    const validateStep = (currentStep: number): boolean => {
        if (currentStep === 1) {
            if (!formData.reg_firstname.trim() || !formData.reg_lastname.trim()) {
                toast.error("กรุณากรอกชื่อและนามสกุลภาษาไทย");
                return false;
            }
            if (!formData.reg_citizenid || formData.reg_citizenid.length !== 13) {
                toast.error("กรุณากรอกเลขประจำตัวประชาชน 13 หลัก");
                return false;
            }
            if (!formData.reg_birth) {
                toast.error("กรุณาเลือกวันเกิดของท่าน");
                return false;
            }
            if (!formData.reg_telephone || formData.reg_telephone.length !== 10) {
                toast.error("กรุณากรอกเบอร์โทรศัพท์มือถือ 10 หลัก");
                return false;
            }
            if (!formData.reg_education) {
                toast.error("กรุณาเลือกระดับการศึกษา");
                return false;
            }
        } else if (currentStep === 2) {
            if (!formData.reg_address_no.trim()) {
                toast.error("กรุณากรอกบ้านเลขที่");
                return false;
            }
            if (!formData.reg_address_province) {
                toast.error("กรุณาเลือกจังหวัด");
                return false;
            }
            if (!formData.reg_address_district.trim()) {
                toast.error("กรุณากรอกอำเภอ / เขต");
                return false;
            }
            if (!formData.reg_address_subdistrict.trim()) {
                toast.error("กรุณากรอกตำบล / แขวง");
                return false;
            }
            if (!formData.postcode || formData.postcode.length !== 5) {
                toast.error("กรุณากรอกรหัสไปรษณีย์ 5 หลัก");
                return false;
            }
        } else if (currentStep === 3) {
            if (formData.work_state === "1") {
                if (!formData.work_section) {
                    toast.error("กรุณาเลือกประเภทการทำงาน");
                    return false;
                }
                if (formData.work_section === "3" && !formData.work_section_gov) {
                    toast.error("กรุณาเลือกสังกัดภาครัฐ");
                    return false;
                }
                if (formData.work_section === "4" && !formData.work_section_self) {
                    toast.error("กรุณาเลือกรูปแบบอาชีพอิสระ");
                    return false;
                }
                if (!formData.work_salary) {
                    toast.error("กรุณาเลือกช่วงรายได้");
                    return false;
                }
                if (!formData.work_position.trim()) {
                    toast.error("กรุณากรอกตำแหน่งงาน");
                    return false;
                }
                if (!formData.work_experience.trim()) {
                    toast.error("กรุณากรอกอายุงาน");
                    return false;
                }
                if (!formData.work_place.trim()) {
                    toast.error("กรุณากรอกสถานที่ทำงาน");
                    return false;
                }
                if (!formData.work_province) {
                    toast.error("กรุณาเลือกจังหวัดที่ทำงาน");
                    return false;
                }
                if (!formData.work_telephone.trim()) {
                    toast.error("กรุณากรอกเบอร์โทรศัพท์ที่ทำงาน");
                    return false;
                }
                if (!formData.work_group) {
                    toast.error("กรุณาเลือกกลุ่มอุตสาหกรรม");
                    return false;
                }
                if (formData.work_group === "อื่นๆ" && !formData.work_group_other.trim()) {
                    toast.error("กรุณาระบุกลุ่มอุตสาหกรรมเพิ่มเติม");
                    return false;
                }
            } else {
                if (!formData.unwork_type) {
                    toast.error("กรุณาเลือกสาเหตุที่ว่างงาน");
                    return false;
                }
            }
        }
        return true;
    };

    const handleNextStep = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.info_agree !== "1") {
            toast.error("กรุณากดยอมรับข้อตกลงในการเก็บรักษาข้อมูลส่วนบุคคล (PDPA)");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("กำลังส่งข้อมูลลงทะเบียน...");

        try {
            const resolveTitle = (code: string) => {
                if (code === "001") return "นาย";
                if (code === "002") return "นาง";
                if (code === "003") return "นางสาว";
                return "";
            };
            const fullName = `${resolveTitle(formData.reg_title || "")}${formData.reg_firstname} ${formData.reg_lastname}`.trim();
            const profileJson = buildProfileJson(formData);

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber: formData.reg_telephone,
                    password: "123456", // Default password for now
                    fullName,
                    profileJson
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "ไม่สามารถลงทะเบียนได้");
            }

            // After successful registration, sign in automatically
            const signInRes = await signIn("credentials", {
                redirect: false,
                phoneNumber: formData.reg_telephone,
                password: "123456"
            });

            if (signInRes?.error) {
                throw new Error("ลงทะเบียนสำเร็จ แต่เข้าสู่ระบบอัตโนมัติล้มเหลว กรุณาเข้าสู่ระบบด้วยตนเอง");
            }

            toast.success("ลงทะเบียนสำเร็จแล้ว! กำลังเตรียมจองคิว...", { id: toastId });
            router.push("/booking");
        } catch (error: any) {
            console.error("Registration error:", error);
            toast.error(error.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    // Address Cascading constants
    const southernDb = SOUTHERN_ADDRESS_DB[formData.reg_address_province];
    const districts = southernDb ? Object.keys(southernDb) : [];
    const subdistricts = (southernDb && formData.reg_address_district && southernDb[formData.reg_address_district])
        ? Object.keys(southernDb[formData.reg_address_district])
        : [];

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-[#001a33] via-[#003366] to-[#002244] py-12 px-4 overflow-hidden">
            {/* Background floating glows */}
            <div className="absolute inset-0 overflow-hidden -z-10">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#2563EB]/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl mx-auto relative z-10"
            >
                <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-2xl bg-white/5 backdrop-blur-2xl p-6 sm:p-10">
                    {/* Stepper Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(74,222,128,0.4)] border border-white/10">
                            <i className="fa-solid fa-address-card text-white text-2xl animate-pulse"></i>
                        </div>
                        <h1 className="text-2xl font-extrabold text-white">ลงทะเบียนสมาชิกใหม่</h1>
                        <p className="text-xs text-blue-200/60 mt-1">กรุณากรอกข้อมูลหลักสูตรและประวัติของท่านเพื่อยืนยันประวัติ DSD</p>
                    </div>

                    {/* Step wizard indicator */}
                    <div className="mb-10 pt-2">
                        <ul className="steps w-full text-[11px] font-semibold text-blue-200/50">
                            <li className={`step ${step >= 1 ? "step-primary text-blue-300" : ""}`} data-content="1">ส่วนตัว</li>
                            <li className={`step ${step >= 2 ? "step-primary text-blue-300" : ""}`} data-content="2">ที่อยู่</li>
                            <li className={`step ${step >= 3 ? "step-primary text-blue-300" : ""}`} data-content="3">อาชีพ</li>
                            <li className={`step ${step >= 4 ? "step-primary text-blue-300" : ""}`} data-content="4">ยืนยัน</li>
                        </ul>
                    </div>

                    {/* DSD Progress Bar — กรอกข้อมูลหลัก X% + badge X/50 */}
                    <div className="flex flex-wrap items-center gap-3 mb-6 px-1">
                        <div className="flex-1 min-w-[120px]">
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-xs text-blue-200/60 flex-1">กรอกข้อมูลหลัก {progressPct}%</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {filledCount}/50
                        </span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <AnimatePresence mode="wait">
                            {/* Step 1: Personal Info */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -15 }}
                                    className="space-y-5"
                                >
                                    <h3 className="text-base font-bold text-white mb-2 pb-1 border-b border-white/10 flex items-center gap-2">
                                        <i className="fa-solid fa-user text-blue-400 text-sm"></i>
                                        ข้อมูลส่วนบุคคล
                                    </h3>

                                    {/* Profile Avatar Uploader */}
                                    <div className="flex flex-col items-center justify-center space-y-3 pb-4">
                                        <div className="relative w-24 h-24 rounded-full border-2 border-white/20 overflow-hidden bg-white/5 flex items-center justify-center group shadow-lg">
                                            {formData.profileImage ? (
                                                <img src={formData.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center text-blue-200/40">
                                                    <i className="fa-regular fa-user text-3xl"></i>
                                                </div>
                                            )}
                                        </div>
                                        <label className="btn btn-xs bg-white/10 hover:bg-white/20 text-white border-0 rounded-lg px-4 py-1 flex items-center gap-1.5 cursor-pointer">
                                            <i className="fa-solid fa-camera"></i>
                                            เลือกรูปถ่ายของท่าน
                                            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                        </label>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">คำนำหน้า (ไทย) *</span></label>
                                            <select
                                                value={formData.reg_title}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    let enTitle = "Mr.";
                                                    if (val === "002") enTitle = "Mrs.";
                                                    else if (val === "003") enTitle = "Miss";
                                                    else if (val === "004") enTitle = "Other";
                                                    setFormData(prev => ({ ...prev, reg_title: val, reg_title_en: enTitle }));
                                                }}
                                                className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            >
                                                {titles.map((t) => (
                                                    <option key={t.value} value={t.value} className="bg-[#002244]">{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">Title (English) *</span></label>
                                            <select
                                                value={formData.reg_title_en}
                                                onChange={(e) => updateField("reg_title_en", e.target.value)}
                                                className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            >
                                                {titlesEn.map((t) => (
                                                    <option key={t.value} value={t.value} className="bg-[#002244]">{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ชื่อจริง (ภาษาไทย) *</span></label>
                                            <input
                                                type="text"
                                                value={formData.reg_firstname}
                                                onChange={(e) => updateField("reg_firstname", e.target.value)}
                                                placeholder="กรอกชื่อภาษาไทย"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">นามสกุล (ภาษาไทย) *</span></label>
                                            <input
                                                type="text"
                                                value={formData.reg_lastname}
                                                onChange={(e) => updateField("reg_lastname", e.target.value)}
                                                placeholder="กรอกนามสกุลภาษาไทย"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">First Name (ENG)</span></label>
                                            <input
                                                type="text"
                                                value={formData.reg_firstnameEng}
                                                onChange={(e) => updateField("reg_firstnameEng", e.target.value)}
                                                placeholder="First name in English"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">Last Name (ENG)</span></label>
                                            <input
                                                type="text"
                                                value={formData.reg_lastnameEng}
                                                onChange={(e) => updateField("reg_lastnameEng", e.target.value)}
                                                placeholder="Last name in English"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">เพศ *</span></label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateField("gender", "1")}
                                                    className={`btn flex-1 border-0 rounded-2xl text-xs font-bold transition-all ${formData.gender === "1" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white/5 text-blue-200/50 hover:bg-white/10"}`}
                                                >
                                                    ชาย
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateField("gender", "2")}
                                                    className={`btn flex-1 border-0 rounded-2xl text-xs font-bold transition-all ${formData.gender === "2" ? "bg-pink-600 text-white shadow-md shadow-pink-500/20" : "bg-white/5 text-blue-200/50 hover:bg-white/10"}`}
                                                >
                                                    หญิง
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">สัญชาติ *</span></label>
                                            <select
                                                value={formData.nationality}
                                                onChange={(e) => updateField("nationality", e.target.value)}
                                                className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            >
                                                <option value="099" className="bg-[#002244]">ไทย</option>
                                                <option value="050" className="bg-[#002244]">มาเลเซีย</option>
                                                <option value="001" className="bg-[#002244]">อเมริกัน</option>
                                                <option value="000" className="bg-[#002244]">อื่นๆ</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">เลขบัตรประจำตัวประชาชน 13 หลัก *</span></label>
                                            <input
                                                type="tel"
                                                value={formData.reg_citizenid}
                                                onChange={(e) => updateField("reg_citizenid", e.target.value.replace(/\D/g, "").slice(0, 13))}
                                                placeholder="XXXXXXXXXXXXX"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white tracking-widest focus:outline-none transition-all"
                                                maxLength={13}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">วันเกิด *</span></label>
                                            <input
                                                type="date"
                                                value={formData.reg_birth}
                                                onChange={(e) => updateField("reg_birth", e.target.value)}
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">เบอร์โทรศัพท์มือถือ *</span></label>
                                            <input
                                                type="tel"
                                                value={formData.reg_telephone}
                                                onChange={(e) => updateField("reg_telephone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                placeholder="08X-XXX-XXXX"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                maxLength={10}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">อีเมลติดต่อ</span></label>
                                            <input
                                                type="email"
                                                value={formData.reg_email}
                                                onChange={(e) => updateField("reg_email", e.target.value)}
                                                placeholder="example@email.com"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ระดับการศึกษา *</span></label>
                                            <select
                                                value={formData.reg_education}
                                                onChange={(e) => updateField("reg_education", e.target.value)}
                                                className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            >
                                                <option value="" className="bg-[#002244]">-- เลือกระดับการศึกษา --</option>
                                                {educationLevels.map((edu) => (
                                                    <option key={edu.value} value={edu.value} className="bg-[#002244]">{edu.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">สาขาวิชา / สถาบัน</span></label>
                                            <input
                                                type="text"
                                                value={formData.reg_education_section}
                                                onChange={(e) => updateField("reg_education_section", e.target.value)}
                                                placeholder="เช่น วิศวกรรมไฟฟ้า / เทคนิคยะลา"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">สภาพร่างกาย *</span></label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, reg_body_state: "0", reg_body_state_detail: "" }));
                                                }}
                                                className={`btn flex-1 border-0 rounded-2xl text-xs font-bold transition-all ${formData.reg_body_state === "0" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white/5 text-blue-200/50 hover:bg-white/10"}`}
                                            >
                                                ร่างกายปกติ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateField("reg_body_state", "1")}
                                                className={`btn flex-1 border-0 rounded-2xl text-xs font-bold transition-all ${formData.reg_body_state === "1" ? "bg-amber-600 text-white shadow-md shadow-amber-500/20" : "bg-white/5 text-blue-200/50 hover:bg-white/10"}`}
                                            >
                                                มีความพิการ
                                            </button>
                                        </div>
                                    </div>

                                    {formData.reg_body_state === "1" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="form-control"
                                        >
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">รายละเอียดความพิการ *</span></label>
                                            <input
                                                type="text"
                                                value={formData.reg_body_state_detail}
                                                onChange={(e) => updateField("reg_body_state_detail", e.target.value)}
                                                placeholder="ระบุลักษณะการเคลื่อนไหวหรือข้อจำกัดร่างกาย"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all border-amber-500/30"
                                            />
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* Step 2: Address Info */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -15 }}
                                    className="space-y-5"
                                >
                                    <h3 className="text-base font-bold text-white mb-2 pb-1 border-b border-white/10 flex items-center gap-2">
                                        <i className="fa-solid fa-map-pin text-blue-400 text-sm"></i>
                                        ที่อยู่ปัจจุบันสำหรับการติดต่อ
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">บ้านเลขที่ *</span></label>
                                            <input
                                                type="text"
                                                value={formData.reg_address_no}
                                                onChange={(e) => updateField("reg_address_no", e.target.value)}
                                                placeholder="เช่น 123/45"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">หมู่ที่</span></label>
                                            <input
                                                type="text"
                                                value={formData.reg_address_moo}
                                                onChange={(e) => updateField("reg_address_moo", e.target.value)}
                                                placeholder="เช่น 3"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ถนน</span></label>
                                            <input
                                                type="text"
                                                value={formData.reg_address_street}
                                                onChange={(e) => updateField("reg_address_street", e.target.value)}
                                                placeholder="กรอกชื่อถนน"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ซอย</span></label>
                                            <input
                                                type="text"
                                                value={formData.reg_address_soi}
                                                onChange={(e) => updateField("reg_address_soi", e.target.value)}
                                                placeholder="กรอกชื่อซอย"
                                                className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">จังหวัด *</span></label>
                                        <select
                                            value={formData.reg_address_province}
                                            onChange={(e) => handleProvinceChange(e.target.value)}
                                            className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                        >
                                            {provinces.map((p) => (
                                                <option key={p.value} value={p.value} className="bg-[#002244]">{p.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* District field */}
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">อำเภอ / เขต *</span></label>
                                            {districts.length > 0 && formData.reg_address_district !== "อื่นๆ" ? (
                                                <select
                                                    value={formData.reg_address_district}
                                                    onChange={(e) => handleDistrictChange(e.target.value)}
                                                    className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                >
                                                    <option value="" className="bg-[#002244]">-- เลือกอำเภอ --</option>
                                                    {districts.map((d) => (
                                                        <option key={d} value={d} className="bg-[#002244]">{d}</option>
                                                    ))}
                                                    <option value="อื่นๆ" className="bg-[#002244]">อื่นๆ (ระบุเอง)</option>
                                                </select>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={formData.reg_address_district === "อื่นๆ" ? "" : formData.reg_address_district}
                                                        onChange={(e) => updateField("reg_address_district", e.target.value)}
                                                        placeholder="ระบุชื่ออำเภอ"
                                                        className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                    />
                                                    {districts.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDistrictChange("")}
                                                            className="absolute right-3 top-3.5 text-xs text-blue-300 font-bold"
                                                        >
                                                            รีเซ็ต
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Subdistrict field */}
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ตำบล / แขวง *</span></label>
                                            {subdistricts.length > 0 && formData.reg_address_subdistrict !== "อื่นๆ" ? (
                                                <select
                                                    value={formData.reg_address_subdistrict}
                                                    onChange={(e) => handleSubdistrictChange(e.target.value)}
                                                    className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                >
                                                    <option value="" className="bg-[#002244]">-- เลือกตำบล --</option>
                                                    {subdistricts.map((s) => (
                                                        <option key={s} value={s} className="bg-[#002244]">{s}</option>
                                                    ))}
                                                    <option value="อื่นๆ" className="bg-[#002244]">อื่นๆ (ระบุเอง)</option>
                                                </select>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={formData.reg_address_subdistrict === "อื่นๆ" ? "" : formData.reg_address_subdistrict}
                                                        onChange={(e) => updateField("reg_address_subdistrict", e.target.value)}
                                                        placeholder="ระบุชื่อตำบล"
                                                        className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                    />
                                                    {subdistricts.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSubdistrictChange("")}
                                                            className="absolute right-3 top-3.5 text-xs text-blue-300 font-bold"
                                                        >
                                                            รีเซ็ต
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">รหัสไปรษณีย์ *</span></label>
                                        <input
                                            type="tel"
                                            value={formData.postcode}
                                            onChange={(e) => updateField("postcode", e.target.value.replace(/\D/g, "").slice(0, 5))}
                                            placeholder="XXXXX"
                                            className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            maxLength={5}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Occupation Info */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -15 }}
                                    className="space-y-5"
                                >
                                    <h3 className="text-base font-bold text-white mb-2 pb-1 border-b border-white/10 flex items-center gap-2">
                                        <i className="fa-solid fa-briefcase text-blue-400 text-sm"></i>
                                        สถานะการทํางานปัจจุบัน
                                    </h3>

                                    <div className="form-control">
                                        <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">สถานะการทำงาน *</span></label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateField("work_state", "1")}
                                                className={`btn flex-1 border-0 rounded-2xl text-xs font-bold transition-all ${formData.work_state === "1" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white/5 text-blue-200/50 hover:bg-white/10"}`}
                                            >
                                                ทำงาน
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        work_state: "0",
                                                        work_section: "",
                                                        work_section_gov: "",
                                                        work_section_self: "",
                                                        work_salary: "",
                                                        work_position: "",
                                                        work_experience: "",
                                                        work_place: "",
                                                        work_province: "",
                                                        work_telephone: "",
                                                        work_group: "",
                                                        work_group_other: ""
                                                    }));
                                                }}
                                                className={`btn flex-1 border-0 rounded-2xl text-xs font-bold transition-all ${formData.work_state === "0" ? "bg-amber-600 text-white shadow-md shadow-amber-500/20" : "bg-white/5 text-blue-200/50 hover:bg-white/10"}`}
                                            >
                                                ว่างงาน
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sub-form: WORKING */}
                                    {formData.work_state === "1" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            <div className="form-control">
                                                <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ประเภทการทำงาน *</span></label>
                                                <select
                                                    value={formData.work_section}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            work_section: val,
                                                            work_section_gov: "",
                                                            work_section_self: ""
                                                        }));
                                                    }}
                                                    className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                >
                                                    <option value="" className="bg-[#002244]">-- เลือกประเภทธุรกิจ --</option>
                                                    <option value="1" className="bg-[#002244]">ภาคเอกชน</option>
                                                    <option value="2" className="bg-[#002244]">รัฐวิสาหกิจ</option>
                                                    <option value="3" className="bg-[#002244]">ภาครัฐ</option>
                                                    <option value="4" className="bg-[#002244]">ประกอบธุรกิจส่วนตัว / อาชีพอิสระ</option>
                                                </select>
                                            </div>

                                            {formData.work_section === "3" && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    className="form-control bg-white/5 p-4 rounded-2xl border border-white/5"
                                                >
                                                    <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">สังกัดหน่วยงานภาครัฐ *</span></label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {["civil", "police", "military", "teacher"].map((g) => {
                                                            const labelMap: { [k: string]: string } = {
                                                                civil: "ข้าราชการพลเรือน",
                                                                police: "ตำรวจ",
                                                                military: "ทหาร",
                                                                teacher: "ครู / บุคลากรศึกษา"
                                                            };
                                                            return (
                                                                <button
                                                                    key={g}
                                                                    type="button"
                                                                    onClick={() => updateField("work_section_gov", g)}
                                                                    className={`btn btn-xs border-0 text-[10px] font-bold rounded-lg py-1.5 transition-all ${formData.work_section_gov === g ? "bg-blue-600 text-white" : "bg-white/5 text-blue-200/50 hover:bg-white/10"}`}
                                                                >
                                                                    {labelMap[g]}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {formData.work_section === "4" && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    className="form-control bg-white/5 p-4 rounded-2xl border border-white/5"
                                                >
                                                    <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">รูปแบบธุรกิจอิสระ *</span></label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {["community", "farmer", "freelance"].map((s) => {
                                                            const labelMap: { [k: string]: string } = {
                                                                community: "วิสาหกิจชุมชน",
                                                                farmer: "เกษตรกร",
                                                                freelance: "รับจ้างทั่วไป"
                                                            };
                                                            return (
                                                                <button
                                                                    key={s}
                                                                    type="button"
                                                                    onClick={() => updateField("work_section_self", s)}
                                                                    className={`btn btn-xs border-0 text-[10px] font-bold rounded-lg py-1.5 transition-all ${formData.work_section_self === s ? "bg-blue-600 text-white" : "bg-white/5 text-blue-200/50 hover:bg-white/10"}`}
                                                                >
                                                                    {labelMap[s]}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}

                                            <div className="form-control">
                                                <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ช่วงรายได้เฉลี่ยต่อเดือน *</span></label>
                                                <select
                                                    value={formData.work_salary}
                                                    onChange={(e) => updateField("work_salary", e.target.value)}
                                                    className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                >
                                                    <option value="" className="bg-[#002244]">-- เลือกรายได้ --</option>
                                                    <option value="1 - 5,000 บาท" className="bg-[#002244]">1 - 5,000 บาท</option>
                                                    <option value="5,001 - 9,000 บาท" className="bg-[#002244]">5,001 - 9,000 บาท</option>
                                                    <option value="9,001 - 15,000 บาท" className="bg-[#002244]">9,001 - 15,000 บาท</option>
                                                    <option value="15,001 - 20,000 บาท" className="bg-[#002244]">15,001 - 20,000 บาท</option>
                                                    <option value="20,001 - 30,000 บาท" className="bg-[#002244]">20,001 - 30,000 บาท</option>
                                                    <option value="30,001 - 40,000 บาท" className="bg-[#002244]">30,001 - 40,000 บาท</option>
                                                    <option value="40,001 บาทขึ้นไป" className="bg-[#002244]">40,001 บาทขึ้นไป</option>
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="form-control">
                                                    <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ตำแหน่งงาน *</span></label>
                                                    <input
                                                        type="text"
                                                        value={formData.work_position}
                                                        onChange={(e) => updateField("work_position", e.target.value)}
                                                        placeholder="เช่น หัวหน้าช่าง / ช่างไฟ"
                                                        className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">อายุงาน (ปี) *</span></label>
                                                    <input
                                                        type="tel"
                                                        value={formData.work_experience}
                                                        onChange={(e) => updateField("work_experience", e.target.value.replace(/\D/g, ""))}
                                                        placeholder="กรอกเป็นตัวเลขปี เช่น 3"
                                                        className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-control">
                                                <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ชื่อสถานที่ทำงาน / บริษัท *</span></label>
                                                <input
                                                    type="text"
                                                    value={formData.work_place}
                                                    onChange={(e) => updateField("work_place", e.target.value)}
                                                    placeholder="กรอกชื่อโรงงาน/บริษัท/ร้านค้า"
                                                    className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="form-control">
                                                    <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">จังหวัดที่ทำงาน *</span></label>
                                                    <select
                                                        value={formData.work_province}
                                                        onChange={(e) => updateField("work_province", e.target.value)}
                                                        className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                    >
                                                        <option value="" className="bg-[#002244]">-- เลือกจังหวัด --</option>
                                                        <option value="ยะลา" className="bg-[#002244]">ยะลา</option>
                                                        <option value="ปัตตานี" className="bg-[#002244]">ปัตตานี</option>
                                                        <option value="นราธิวาส" className="bg-[#002244]">นราธิวาส</option>
                                                        <option value="สงขลา" className="bg-[#002244]">สงขลา</option>
                                                        <option value="อื่นๆ" className="bg-[#002244]">อื่นๆ</option>
                                                    </select>
                                                </div>
                                                <div className="form-control">
                                                    <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">เบอร์โทรศัพท์ที่ทำงาน *</span></label>
                                                    <input
                                                        type="tel"
                                                        value={formData.work_telephone}
                                                        onChange={(e) => updateField("work_telephone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                        placeholder="กรอกเบอร์โทรศัพท์"
                                                        className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                        maxLength={10}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="form-control">
                                                    <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">อาชีพ / ลักษณะงาน</span></label>
                                                    <input
                                                        type="text"
                                                        value={formData.work_occupation}
                                                        onChange={(e) => updateField("work_occupation", e.target.value)}
                                                        placeholder="เช่น ช่างไฟฟ้า / ช่างเชื่อม"
                                                        className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">เบอร์โทรสาร (Fax)</span></label>
                                                    <input
                                                        type="tel"
                                                        value={formData.work_fax}
                                                        onChange={(e) => updateField("work_fax", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                        placeholder="เบอร์แฟกซ์ที่ทำงาน (ถ้ามี)"
                                                        className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                        maxLength={10}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-control">
                                                <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">กลุ่มอุตสาหกรรม *</span></label>
                                                <select
                                                    value={formData.work_group}
                                                    onChange={(e) => updateField("work_group", e.target.value)}
                                                    className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                >
                                                    <option value="" className="bg-[#002244]">-- เลือกอุตสาหกรรม --</option>
                                                    <option value="การแปรรูปอาหาร" className="bg-[#002244]">การแปรรูปอาหาร</option>
                                                    <option value="การเกษตรและเทคโนโลยีชีวภาพ" className="bg-[#002244]">การเกษตรและเทคโนโลยีชีวภาพ</option>
                                                    <option value="ดิจิตอล" className="bg-[#002244]">ดิจิตอล</option>
                                                    <option value="ท่องเที่ยวกลุ่มรายได้ดีและท่องเที่ยวเชิงสุขภาพ" className="bg-[#002244]">ท่องเที่ยวกลุ่มรายได้ดี</option>
                                                    <option value="ยานยนต์สมัยใหม่" className="bg-[#002244]">ยานยนต์สมัยใหม่</option>
                                                    <option value="อิเล็กทรอนิกส์อัจฉริยะ" className="bg-[#002244]">อิเล็กทรอนิกส์อัจฉริยะ</option>
                                                    <option value="ขนส่งและการบิน" className="bg-[#002244]">ขนส่งและการบิน</option>
                                                    <option value="อื่นๆ" className="bg-[#002244]">อื่นๆ (ระบุเพิ่มเติม)</option>
                                                </select>
                                            </div>

                                            {formData.work_group === "อื่นๆ" && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    className="form-control"
                                                >
                                                    <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ระบุอุตสาหกรรมที่ทำงานเพิ่มเติม *</span></label>
                                                    <input
                                                        type="text"
                                                        value={formData.work_group_other}
                                                        onChange={(e) => updateField("work_group_other", e.target.value)}
                                                        placeholder="เช่น ก่อสร้าง / ค้าปลีก"
                                                        className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                    />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Sub-form: UNEMPLOYED */}
                                    {formData.work_state === "0" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            <div className="form-control">
                                                <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">สาเหตุที่ว่างงานในปัจจุบัน *</span></label>
                                                <select
                                                    value={formData.unwork_type}
                                                    onChange={(e) => updateField("unwork_type", e.target.value)}
                                                    className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                >
                                                    <option value="" className="bg-[#002244]">-- เลือกสาเหตุ --</option>
                                                    <option value="อยู่ระหว่างหางาน" className="bg-[#002244]">อยู่ระหว่างหางาน</option>
                                                    <option value="นักเรียน/นักศึกษา" className="bg-[#002244]">นักเรียน / นักศึกษา</option>
                                                    <option value="ผู้ประกันตนที่ถูกเลิกจ้าง" className="bg-[#002244]">ผู้ประกันตนที่ถูกเลิกจ้าง</option>
                                                    <option value="ผู้ต้องขัง" className="bg-[#002244]">ผู้ต้องขัง</option>
                                                    <option value="ทหารก่อนปลดประจำการ" className="bg-[#002244]">ทหารก่อนปลดประจำการ</option>
                                                    <option value="อื่นๆ" className="bg-[#002244]">อื่นๆ (ระบุเพิ่มเติม)</option>
                                                </select>
                                            </div>
                                            {formData.unwork_type === "อื่นๆ" && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    className="form-control"
                                                >
                                                    <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ระบุสาเหตุที่ว่างงานเพิ่มเติม *</span></label>
                                                    <input
                                                        type="text"
                                                        value={formData.unwork_other}
                                                        onChange={(e) => updateField("unwork_other", e.target.value)}
                                                        placeholder="เช่น ลาออกเพื่อดูแลครอบครัว"
                                                        className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                    />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* Step 4: PDPA & Apply Info */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -15 }}
                                    className="space-y-5"
                                >
                                    <h3 className="text-base font-bold text-white mb-2 pb-1 border-b border-white/10 flex items-center gap-2">
                                        <i className="fa-solid fa-clipboard-list text-blue-400 text-sm"></i>
                                        การตรวจสอบและข้อมูลการสมัคร
                                    </h3>

                                    <div className="form-control">
                                        <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ประเภทการสมัครเข้าร่วมโครงการ *</span></label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateField("register_type", "T")}
                                                className={`btn flex-1 border-0 rounded-2xl text-xs font-bold transition-all ${formData.register_type === "T" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white/5 text-blue-200/50 hover:bg-white/10"}`}
                                            >
                                                ทดสอบมาตรฐานฝีมือแรงงาน
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateField("register_type", "F")}
                                                className={`btn flex-1 border-0 rounded-2xl text-xs font-bold transition-all ${formData.register_type === "F" ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" : "bg-white/5 text-blue-200/50 hover:bg-white/10"}`}
                                            >
                                                ฝึกอบรมทักษะแรงงาน
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ช่องทางข่าวสารที่รู้จักโครงการ *</span></label>
                                            <select
                                                value={formData.info_type}
                                                onChange={(e) => updateField("info_type", e.target.value)}
                                                className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            >
                                                {infoTypes.map((i) => (
                                                    <option key={i.value} value={i.value} className="bg-[#002244]">{i.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">กลุ่มอาชีพ / สาขาอุตสาหกรรมหลักที่สนใจ *</span></label>
                                            <select
                                                value={formData.industry_desc}
                                                onChange={(e) => updateField("industry_desc", e.target.value)}
                                                className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                            >
                                                {industries.map((ind) => (
                                                    <option key={ind.value} value={ind.value} className="bg-[#002244]">{ind.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ต้องการหางานทำหลังจบการทดสอบ/ฝึกอบรมหรือไม่ *</span></label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        info_findjob: "0",
                                                        info_findjob_detail: "",
                                                        info_findjob_detail_industry: "",
                                                        info_findjob_country: ""
                                                    }));
                                                }}
                                                className={`btn flex-1 border-0 rounded-2xl text-xs font-bold transition-all ${formData.info_findjob === "0" ? "bg-blue-600 text-white shadow-md" : "bg-white/5 text-blue-200/50 hover:bg-white/10"}`}
                                            >
                                                ไม่ต้องการ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateField("info_findjob", "1")}
                                                className={`btn flex-1 border-0 rounded-2xl text-xs font-bold transition-all ${formData.info_findjob === "1" ? "bg-amber-600 text-white shadow-md shadow-amber-500/20" : "bg-white/5 text-blue-200/50 hover:bg-white/10"}`}
                                            >
                                                ต้องการหางานทำ
                                            </button>
                                        </div>
                                    </div>

                                    {formData.info_findjob === "1" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5"
                                        >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="form-control">
                                                    <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ประเภทงานที่ต้องการทำ *</span></label>
                                                    <input
                                                        type="text"
                                                        value={formData.info_findjob_detail}
                                                        onChange={(e) => updateField("info_findjob_detail", e.target.value)}
                                                        placeholder="เช่น ช่างไฟฟ้าในอาคาร"
                                                        className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">อุตสาหกรรมที่สนใจทำ *</span></label>
                                                    <input
                                                        type="text"
                                                        value={formData.info_findjob_detail_industry}
                                                        onChange={(e) => updateField("info_findjob_detail_industry", e.target.value)}
                                                        placeholder="เช่น ก่อสร้าง / อิเล็กทรอนิกส์"
                                                        className="input w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-control">
                                                <label className="label py-1"><span className="label-text text-blue-200 text-xs font-semibold">ประเทศที่ต้องการเดินทางไปทำงาน *</span></label>
                                                <select
                                                    value={formData.info_findjob_country}
                                                    onChange={(e) => updateField("info_findjob_country", e.target.value)}
                                                    className="select w-full bg-white/5 border border-white/10 focus:border-[#2563EB]/70 focus:bg-white/10 rounded-2xl text-sm text-white focus:outline-none transition-all"
                                                >
                                                    <option value="" className="bg-[#002244]">ในประเทศไทย</option>
                                                    <option value="MY" className="bg-[#002244]">มาเลเซีย (Malaysia)</option>
                                                    <option value="SG" className="bg-[#002244]">สิงคโปร์ (Singapore)</option>
                                                    <option value="JP" className="bg-[#002244]">ญี่ปุ่น (Japan)</option>
                                                    <option value="KR" className="bg-[#002244]">เกาหลีใต้ (South Korea)</option>
                                                    <option value="OT" className="bg-[#002244]">อื่นๆ</option>
                                                </select>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* PDPA Agreement */}
                                    <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 mt-4 space-y-4">
                                        <h4 className="text-xs font-bold text-blue-300 flex items-center gap-2">
                                            <i className="fa-solid fa-shield-halved text-sm"></i>
                                            ความยินยอมเกี่ยวกับข้อมูลส่วนบุคคล (PDPA)
                                        </h4>
                                        <p className="text-[10.5px] leading-relaxed text-blue-200/60 text-justify">
                                            ข้าพเจ้ายินยอมให้กรมพัฒนาฝีมือแรงงาน เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของข้าพเจ้า (รวมถึงข้อมูลประวัติการศึกษา อาชีพ และรูปถ่าย) เพื่อใช้ประโยชน์ในการให้บริการโครงการพัฒนาทักษะวิชาชีพ การวิเคราะห์สถิติ การบูรณาการข้อมูลร่วมกับหน่วยงานภาครัฐ ตลอดจนการสนับสนุนการส่งเสริมโอกาสการมีงานทำ ทั้งนี้เป็นไปตามนโยบายการคุ้มครองข้อมูลส่วนบุคคลของหน่วยงาน
                                        </p>
                                        <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.info_agree === "1"}
                                                onChange={(e) => updateField("info_agree", e.target.checked ? "1" : "0")}
                                                className="checkbox checkbox-sm checkbox-primary border-white/20"
                                            />
                                            <span className="text-xs font-semibold text-white">
                                                ข้าพเจ้าได้อ่านและยอมรับข้อตกลงดังกล่าว <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form Navigation Controls */}
                        <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/10">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="btn bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-2xl px-6 py-2 transition-all text-xs font-semibold flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-chevron-left text-[10px]"></i>
                                    ย้อนกลับ
                                </button>
                            ) : (
                                <div></div>
                            )}

                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="btn bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all rounded-2xl px-8 py-2 text-xs font-semibold flex items-center gap-2"
                                >
                                    ขั้นตอนถัดไป
                                    <i className="fa-solid fa-chevron-right text-[10px]"></i>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-green-500/25 active:scale-95 transition-all text-xs sm:text-sm flex items-center gap-1.5"
                                >
                                    {loading ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-check text-sm"></i>
                                            ยืนยันการสมัครสมาชิก
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Go back to Login */}
                    <div className="text-center mt-8 pt-2">
                        <p className="text-xs sm:text-sm text-blue-200/60 font-sans">
                            มีบัญชีอยู่แล้ว?{" "}
                            <Link href="/login" className="text-yellow-400 font-bold hover:underline">
                                เข้าสู่ระบบที่นี่
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}