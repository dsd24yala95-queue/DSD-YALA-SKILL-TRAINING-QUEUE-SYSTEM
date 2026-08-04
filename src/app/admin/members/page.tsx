"use client";

import React, { useState, useEffect, useCallback } from "react";
import FullMemberEditForm from '@/components/admin/FullMemberEditForm';

import { motion } from "framer-motion";
import { toast } from "sonner";

interface Member {
    id: string;
    role: string;
    reg_firstname?: string;
    reg_lastname?: string;
    reg_title?: string;
    fullName?: string;
    reg_email?: string;
    reg_telephone?: string;
    reg_citizenid?: string;
    reg_firstnameEng?: string;
    reg_lastnameEng?: string;
    reg_title_en?: string;
    reg_birth?: string;
    reg_education?: string;
    reg_education_section?: string;
    reg_body_state?: string;
    reg_body_state_detail?: string;
    reg_address_no?: string;
    reg_address_moo?: string;
    reg_address_street?: string;
    reg_address_soi?: string;
    reg_address_province?: string;
    reg_address_district?: string;
    reg_address_subdistrict?: string;
    createdAt?: string;
    profileImage?: string;
}

function resolveTitle(code: string) {
    if (code === "001") return "นาย";
    if (code === "002") return "นาง";
    if (code === "003") return "นางสาว";
    return "";
}

function formatName(m: Member) {
    if (m.fullName) return m.fullName;
    if (m.reg_firstname) return `${resolveTitle(m.reg_title || "")}${m.reg_firstname} ${m.reg_lastname || ""}`.trim();
    return "ไม่ระบุชื่อ";
}

export default function AdminMembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Member | null>(null);
    const [editMember, setEditMember] = useState<Member | null>(null);
    const [deleteMember, setDeleteMember] = useState<Member | null>(null);
    const [saving, setSaving] = useState(false);
    const [walkInModalOpen, setWalkInModalOpen] = useState(false);
    const [walkInSaving, setWalkInSaving] = useState(false);
    const [walkInForm, setWalkInForm] = useState({
        title: "001",
        fullName: "",
        phoneNumber: "",
        citizenId: "",
        email: "",
        education: "ปริญญาตรี",
    });

    const handleWalkInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walkInForm.fullName || !walkInForm.phoneNumber) {
            toast.error("กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์");
            return;
        }

        setWalkInSaving(true);
        try {
            const res = await fetch("/api/admin/walkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(walkInForm),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to register walk-in member");

            toast.success(`ลงทะเบียนสมาชิก Walk-in สำเร็จ (${data.user.fullName})`);
            setWalkInModalOpen(false);
            setWalkInForm({
                title: "001",
                fullName: "",
                phoneNumber: "",
                citizenId: "",
                email: "",
                education: "ปริญญาตรี",
            });
            loadMembers();
        } catch (err: any) {
            toast.error(err.message || "เกิดข้อผิดพลาดในการลงทะเบียน Walk-in");
        } finally {
            setWalkInSaving(false);
        }
    };


    const handleEditSubmit = async (newProfileJsonStr: string) => {
        if (!editMember) return;
        setSaving(true);
        try {
            const parsed = JSON.parse(newProfileJsonStr);
            
            const resolveTitle = (code: string) => {
                if (code === "001") return "นาย";
                if (code === "002") return "นาง";
                if (code === "003") return "นางสาว";
                return "";
            };
            const fullName = `${resolveTitle(parsed.reg_title || "")}${parsed.reg_firstname} ${parsed.reg_lastname}`.trim();

            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editMember.id,
                    fullName,
                    phoneNumber: parsed.reg_telephone,
                    email: parsed.reg_email,
                    profileJson: newProfileJsonStr
                })
            });
            if (res.ok) {
                toast.success("แก้ไขข้อมูลสำเร็จ");
                setEditMember(null);
                loadMembers();
            } else {
                toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
            }
        } catch (e) {
            toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSubmit = async () => {
        if (!deleteMember) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/users?id=${deleteMember.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("ลบสมาชิกสำเร็จ");
                setDeleteMember(null);
                loadMembers();
            } else {
                toast.error("เกิดข้อผิดพลาดในการลบ");
            }
        } catch (e) {
            toast.error("เกิดข้อผิดพลาดในการลบ");
        } finally {
            setSaving(false);
        }
    };

    const loadMembers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users?role=member");
            if (!res.ok) throw new Error("Failed to load members");
            const list: Member[] = await res.json();
            
            // Map Prisma data to expected format if needed
            const formattedList = list.map((u: any) => {
                let parsedProfile = {};
                try {
                    if (u.profileJson) parsedProfile = JSON.parse(u.profileJson);
                } catch(e) {}
                
                return {
                    id: u.id,
                    role: u.role,
                    fullName: u.fullName,
                    reg_telephone: u.phoneNumber,
                    ...parsedProfile
                } as Member;
            });

            formattedList.sort((a, b) => {
                const nameA = a.reg_firstname || a.fullName || "";
                const nameB = b.reg_firstname || b.fullName || "";
                return nameA.localeCompare(nameB, "th");
            });
            setMembers(formattedList);
        } catch {
            toast.error("ไม่สามารถโหลดข้อมูลสมาชิกได้");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadMembers(); }, [loadMembers]);

    const filtered = members.filter(m => {
        if (!search) return true;
        const name = formatName(m).toLowerCase();
        return name.includes(search.toLowerCase()) ||
            (m.reg_email || "").includes(search) ||
            (m.reg_telephone || "").includes(search) ||
            (m.reg_citizenid || "").includes(search) ||
            m.id.includes(search);
    });

    const avatarColor = (i: number) => {
        const colors = [
            "from-blue-400 to-indigo-600",
            "from-purple-400 to-pink-500",
            "from-emerald-400 to-teal-600",
            "from-amber-400 to-orange-500",
            "from-rose-400 to-red-500",
        ];
        return colors[i % colors.length];
    };

    return (
        <div className="p-4 sm:p-6 bg-[#f8fafc] min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <i className="fa-solid fa-users text-indigo-600"></i>
                        จัดการสมาชิก (Member Management)
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">รายชื่อและข้อมูลสมาชิกทั้งหมดในระบบ ({members.length} คน)</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadMembers} className="flex items-center gap-2 px-4.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <i className="fa-solid fa-rotate-right"></i> รีเฟรช
                    </button>
                    <button
                        onClick={() => setWalkInModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95 shrink-0"
                    >
                        <i className="fa-solid fa-user-plus"></i> ลงทะเบียน Walk-in
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                    type="text"
                    placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล, บัตรประชาชน..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm sm:text-base rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 text-slate-800 font-medium"
                />
            </div>

            {/* Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
                {[
                    { label: "สมาชิกทั้งหมด", value: members.length, icon: "fa-users", color: "text-blue-600 bg-blue-50 border-blue-200/60" },
                    { label: "ผลการค้นหา", value: filtered.length, icon: "fa-filter", color: "text-indigo-600 bg-indigo-50 border-indigo-200/60" },
                    { label: "มีอีเมล", value: members.filter(m => m.reg_email).length, icon: "fa-envelope", color: "text-emerald-600 bg-emerald-50 border-emerald-200/60" },
                    { label: "มีเบอร์โทร", value: members.filter(m => m.reg_telephone).length, icon: "fa-phone", color: "text-amber-600 bg-amber-50 border-amber-200/60" },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-base shrink-0 ${s.color}`}>
                            <i className={`fa-solid ${s.icon}`}></i>
                        </div>
                        <div>
                            <p className="text-2xl sm:text-3xl font-black text-slate-800 leading-none mb-0.5">{s.value}</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="text-sm font-medium text-slate-500">กำลังโหลดรายชื่อสมาชิก...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 py-20 text-center text-slate-400 p-4">
                    <i className="fa-solid fa-user-slash text-4xl mb-3 block opacity-30"></i>
                    <p className="text-base font-semibold">ไม่พบสมาชิกที่ตรงกับเงื่อนไข</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider">
                                    <th className="px-6 py-4 w-16 text-center">ลำดับ</th>
                                    <th className="px-6 py-4">ข้อมูลสมาชิก</th>
                                    <th className="px-6 py-4">ข้อมูลติดต่อ</th>
                                    <th className="px-6 py-4">รหัสบัตรประชาชน</th>
                                    <th className="px-6 py-4 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filtered.map((m, i) => (
                                    <motion.tr 
                                        key={m.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                                        className="hover:bg-slate-50/80 transition-colors group"
                                    >
                                        <td className="px-6 py-4 text-center font-bold text-slate-500 text-sm">
                                            {i + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3.5">
                                                {(() => {
                                                    const avatarUrl = (m as any).profileImage || m.profileImage || (m as any).profileImageUrl;
                                                    const isValid = avatarUrl && typeof avatarUrl === "string" && (avatarUrl.startsWith("http") || avatarUrl.startsWith("/"));

                                                    return (
                                                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${avatarColor(i)} flex items-center justify-center text-white font-black text-base shadow-sm shrink-0 overflow-hidden`}>
                                                            {isValid ? (
                                                                <img src={avatarUrl} alt={formatName(m)} className="w-full h-full object-cover" />
                                                            ) : (
                                                                (m.reg_firstname || m.fullName || "?").charAt(0)
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                                <div className="min-w-0">
                                                    <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">{formatName(m)}</p>
                                                    <p className="text-xs font-mono text-slate-500 truncate w-36 md:w-auto mt-0.5">{m.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 space-y-1">
                                            {m.reg_telephone ? (
                                                <p className="text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-2">
                                                    <i className="fa-solid fa-phone text-slate-400 w-3.5"></i> {m.reg_telephone}
                                                </p>
                                            ) : <span className="text-xs text-slate-400">-</span>}
                                            {m.reg_email && (
                                                <p className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2 truncate max-w-[180px] lg:max-w-[220px]">
                                                    <i className="fa-solid fa-envelope text-slate-400 w-3.5"></i> <span className="truncate">{m.reg_email}</span>
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs sm:text-sm font-mono font-bold text-slate-700">
                                            {m.reg_citizenid || "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => setSelected(m)} className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all text-sm shadow-sm" title="ดูรายละเอียด">
                                                    <i className="fa-solid fa-eye"></i>
                                                </button>
                                                <button onClick={() => setEditMember(m)} className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center transition-all text-sm shadow-sm" title="แก้ไข">
                                                    <i className="fa-solid fa-pen-to-square"></i>
                                                </button>
                                                <button onClick={() => setDeleteMember(m)} className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all text-sm shadow-sm" title="ลบ">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-black text-slate-800">ข้อมูลสมาชิก</h2>
                            <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
                                <i className="fa-solid fa-xmark text-xs"></i>
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                                {(selected.reg_firstname || selected.fullName || "?").charAt(0)}
                            </div>
                            <div>
                                <p className="font-black text-slate-800 text-lg leading-tight">{formatName(selected)}</p>
                                <p className="text-xs text-slate-400 mt-0.5">รหัสสมาชิก: {selected.id}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: "บัตรประชาชน", value: selected.reg_citizenid, icon: "fa-id-card" },
                                { label: "เบอร์โทร", value: selected.reg_telephone, icon: "fa-phone" },
                                { label: "อีเมล", value: selected.reg_email, icon: "fa-envelope" },
                                { label: "จังหวัด", value: selected.reg_address_province, icon: "fa-location-dot" },
                                { label: "วันที่ลงทะเบียน", value: selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("th-TH") : undefined, icon: "fa-calendar" },
                            ].filter(f => f.value).map((f, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                                    <i className={`fa-solid ${f.icon} text-indigo-400 w-4 text-center text-sm`}></i>
                                    <div>
                                        <p className="text-[10px] text-slate-400">{f.label}</p>
                                        <p className="text-sm font-semibold text-slate-700">{f.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                            <button onClick={() => { setEditMember(selected); setSelected(null); }} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                                <i className="fa-solid fa-pen-to-square"></i> แก้ไข
                            </button>
                            <button onClick={() => { setDeleteMember(selected); setSelected(null); }} className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                                <i className="fa-solid fa-trash"></i> ลบ
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Edit Modal */}
            {editMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setEditMember(null)}>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                                <i className="fa-solid fa-pen-to-square text-indigo-500"></i> แก้ไขข้อมูลสมาชิก
                            </h2>
                            <button onClick={() => setEditMember(null)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
                                <i className="fa-solid fa-xmark text-xs"></i>
                            </button>
                        </div>
                        <div className="h-[80vh]">
                              <FullMemberEditForm 
                                  initialData={editMember} 
                                  onSave={handleEditSubmit} 
                                  onCancel={() => setEditMember(null)} 
                                  saving={saving} 
                              />
                          </div>
                    </motion.div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteMember(null)}>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <i className="fa-solid fa-trash text-red-500 text-2xl"></i>
                        </div>
                        <h3 className="font-black text-slate-800 text-lg mb-2">ยืนยันการลบสมาชิก</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            คุณต้องการลบข้อมูลนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteMember(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all">ยกเลิก</button>
                            <button onClick={handleDeleteSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all flex justify-center items-center gap-2">
                                {saving ? <span className="loading loading-spinner loading-xs"></span> : <i className="fa-solid fa-trash"></i>} ยืนยันการลบ
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* 🚶‍♂️ Walk-in Member Registration Modal */}
            {walkInModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-7 my-8"
                    >
                        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                            <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                                <i className="fa-solid fa-user-plus text-indigo-600"></i>
                                ลงทะเบียนสมาชิก Walk-in หน้างาน
                            </h2>
                            <button onClick={() => setWalkInModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <form onSubmit={handleWalkInSubmit} className="space-y-3.5 text-xs">
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="font-bold text-slate-600 block mb-1">คำนำหน้า</label>
                                    <select
                                        value={walkInForm.title}
                                        onChange={(e) => setWalkInForm({ ...walkInForm, title: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    >
                                        <option value="001">นาย</option>
                                        <option value="002">นาง</option>
                                        <option value="003">นางสาว</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="font-bold text-slate-600 block mb-1">ชื่อ-นามสกุล <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="เช่น สมชาย ใจดี"
                                        value={walkInForm.fullName}
                                        onChange={(e) => setWalkInForm({ ...walkInForm, fullName: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-600 block mb-1">เบอร์โทรศัพท์ <span className="text-rose-500">*</span></label>
                                    <input
                                        type="tel"
                                        placeholder="08XXXXXXXX"
                                        value={walkInForm.phoneNumber}
                                        onChange={(e) => setWalkInForm({ ...walkInForm, phoneNumber: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-600 block mb-1">เลขบัตรประชาชน (13 หลัก)</label>
                                    <input
                                        type="text"
                                        maxLength={13}
                                        placeholder="1950100XXXXXX"
                                        value={walkInForm.citizenId}
                                        onChange={(e) => setWalkInForm({ ...walkInForm, citizenId: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 font-mono text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-600 block mb-1">อีเมลผู้สมัคร</label>
                                    <input
                                        type="email"
                                        placeholder="example@mail.com"
                                        value={walkInForm.email}
                                        onChange={(e) => setWalkInForm({ ...walkInForm, email: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-600 block mb-1">ระดับการศึกษา</label>
                                    <select
                                        value={walkInForm.education}
                                        onChange={(e) => setWalkInForm({ ...walkInForm, education: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    >
                                        <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น (ม.3)</option>
                                        <option value="มัธยมศึกษาตอนปลาย">มัธยมศึกษาตอนปลาย (ม.6)</option>
                                        <option value="ปวช.">ปวช.</option>
                                        <option value="ปวส.">ปวส.</option>
                                        <option value="ปริญญาตรี">ปริญญาตรี</option>
                                        <option value="สูงกว่าปริญญาตรี">สูงกว่าปริญญาตรี</option>
                                    </select>
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-400 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/60 leading-relaxed">
                                💡 <strong className="text-indigo-700">คำแนะนำ:</strong> บัญชีสมาชิกจะถูกสร้างทันที โดยผู้สมัครสามารถใช้รหัสผ่านแรกเข้าเป็นเลข 6 หลักสุดท้ายของบัตรประชาชน หรือเบอร์โทรศัพท์
                            </p>

                            <div className="flex gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setWalkInModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={walkInSaving}
                                    className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20 active:scale-95"
                                >
                                    {walkInSaving ? "กำลังลงทะเบียน..." : "💾 ลงทะเบียนสมาชิก Walk-in"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
