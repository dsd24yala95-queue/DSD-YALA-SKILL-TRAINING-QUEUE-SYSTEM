"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";

export default function ContactPage() {
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        subject: "สอบถามการจองคิวอบรม/ทดสอบ",
        message: ""
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
            toast.error("กรุณากรอกชื่อ เบอร์โทรศัพท์ และข้อความให้ครบถ้วน");
            return;
        }

        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            toast.success("ส่งข้อความสอบถามเรียบร้อยแล้ว! เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด");
            setForm({
                name: "",
                phone: "",
                email: "",
                subject: "สอบถามการจองคิวอบรม/ทดสอบ",
                message: ""
            });
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Topbar Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-6 border-b border-slate-200 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
                            <Link href="/" className="hover:underline">หน้าหลัก</Link>
                            <span>/</span>
                            <span>ติดต่อเรา</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">ติดต่อสอบถาม สพร.24 ยะลา</h1>
                        <p className="text-xs text-slate-500 mt-1">สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา กรมพัฒนาฝีมือแรงงาน กระทรวงแรงงาน</p>
                    </div>
                    <Link href="/" className="btn btn-sm bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold gap-2">
                        <i className="fa-solid fa-arrow-left"></i> กลับหน้าหลัก
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left 5 Cols: Contact Information Cards */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Address Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-lg font-bold">
                                <i className="fa-solid fa-location-dot"></i>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-800">ที่ตั้งหน่วยงาน</h3>
                            <p className="text-xs text-slate-600 leading-relaxed font-sans">
                                สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา<br />
                                142 หมู่ 1 ถนนสุขยางค์ ตำบลสะเตงนอก อำเภอเมืองยะลา จังหวัดยะลา 95000
                            </p>
                            <a
                                href="https://maps.app.goo.gl/brFvnbXxdL2M5cdk9"
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-xs bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl px-3 py-1 font-bold inline-flex items-center gap-1.5 mt-2"
                            >
                                <i className="fa-solid fa-map-location-dot"></i>
                                เปิดแผนที่นำทาง Google Maps
                            </a>
                        </motion.div>

                        {/* Phone & Office Hours */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-lg font-bold">
                                <i className="fa-solid fa-phone-volume"></i>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-800">โทรศัพท์ & เวลาทำการ</h3>
                            <div className="space-y-2 text-xs text-slate-600">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-phone text-blue-500"></i>
                                    <span className="font-semibold text-slate-700">โทรศัพท์:</span>
                                    <a href="tel:073212000" className="text-blue-600 font-bold hover:underline">073-212-000</a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-print text-slate-400"></i>
                                    <span className="font-semibold text-slate-700">โทรสาร (Fax):</span>
                                    <span>073-212-001</span>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                    <i className="fa-regular fa-clock text-amber-500"></i>
                                    <span className="font-semibold text-slate-700">เวลาทำการ:</span>
                                    <span>จันทร์ - ศุกร์ (08.30 - 16.30 น.)</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Social Online Channels */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg font-bold">
                                <i className="fa-solid fa-comments"></i>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-800">ช่องทางออนไลน์</h3>
                            <div className="flex flex-col gap-2">
                                <a
                                    href="https://www.facebook.com/profile.php?id=100069260137622"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="fa-brands fa-facebook text-blue-600 text-lg"></i>
                                        <span className="text-xs font-bold text-slate-700">Facebook สพร.24 ยะลา</span>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-xs text-slate-300 group-hover:text-blue-500"></i>
                                </a>
                                <a
                                    href="https://line.me/R/ti/p/@522kafif"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="fa-brands fa-line text-emerald-500 text-lg"></i>
                                        <span className="text-xs font-bold text-slate-700">LINE Official Account (@522kafif)</span>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-xs text-slate-300 group-hover:text-emerald-500"></i>
                                </a>
                                <a
                                    href="https://www.youtube.com/@สพร24ยะลา"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="fa-brands fa-youtube text-rose-600 text-lg"></i>
                                        <span className="text-xs font-bold text-slate-700">YouTube สพร.24 ยะลา</span>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-xs text-slate-300 group-hover:text-rose-500"></i>
                                </a>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right 7 Cols: Quick Inquiry Form */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm"
                        >
                            <div className="mb-6 pb-4 border-b border-slate-100">
                                <h3 className="text-xl font-black text-slate-800">ส่งข้อความสอบถามเจ้าหน้าที่</h3>
                                <p className="text-xs text-slate-500 mt-1">กรอกข้อมูลเพื่อส่งข้อความสอบถามรายละเอียดการรับสมัคร หรือปัญหาการใช้งานระบบ</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label py-1"><span className="label-text text-xs font-bold text-slate-700">ชื่อ - นามสกุล *</span></label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="ระบุชื่อผู้ติดต่อ"
                                            className="input input-bordered w-full bg-slate-50 border-slate-200 text-sm text-slate-800 rounded-2xl focus:bg-white focus:outline-none"
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label py-1"><span className="label-text text-xs font-bold text-slate-700">เบอร์โทรศัพท์ติดต่อ *</span></label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                                            placeholder="08X-XXX-XXXX"
                                            className="input input-bordered w-full bg-slate-50 border-slate-200 text-sm text-slate-800 rounded-2xl focus:bg-white focus:outline-none"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>

                                <div className="form-control">
                                    <label className="label py-1"><span className="label-text text-xs font-bold text-slate-700">หัวข้อเรื่องที่สอบถาม *</span></label>
                                    <select
                                        value={form.subject}
                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                        className="select select-bordered w-full bg-slate-50 border-slate-200 text-sm text-slate-800 rounded-2xl focus:bg-white focus:outline-none"
                                    >
                                        <option value="สอบถามการจองคิวอบรม/ทดสอบ">สอบถามการจองคิวอบรม / ทดสอบมาตรฐาน</option>
                                        <option value="สอบถามผลการทดสอบฝีมือ">สอบถามผลการทดสอบฝีมือแรงงาน</option>
                                        <option value="แจ้งปัญหาการใช้งานระบบ">แจ้งปัญหาการใช้งานระบบ</option>
                                        <option value="อื่นๆ">อื่นๆ</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label py-1"><span className="label-text text-xs font-bold text-slate-700">รายละเอียดข้อความ *</span></label>
                                    <textarea
                                        rows={4}
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        placeholder="กรอกรายละเอียดเรื่องที่ต้องการสอบถาม..."
                                        className="textarea textarea-bordered w-full bg-slate-50 border-slate-200 text-sm text-slate-800 rounded-2xl focus:bg-white focus:outline-none"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full border-0 rounded-2xl font-bold py-3 text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-paper-plane text-xs"></i>
                                            ส่งข้อความสอบถามเจ้าหน้าที่
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
