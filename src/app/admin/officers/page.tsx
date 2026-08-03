"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Officer {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string | null;
    role: string;
    department: string | null;
    status: string;
    mustChangePassword?: boolean;
    createdAt: string;
}

const ROLE_LABELS: { [key: string]: { label: string; badgeCls: string; icon: string } } = {
    admin: {
        label: "Super Admin",
        badgeCls: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        icon: "fa-shield-halved",
    },
    officer_training: {
        label: "เจ้าหน้าที่ฝึกอบรม",
        badgeCls: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        icon: "fa-graduation-cap",
    },
    officer_test: {
        label: "เจ้าหน้าที่ทดสอบมาตรฐาน",
        badgeCls: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
        icon: "fa-clipboard-check",
    },
    officer_registrar: {
        label: "เจ้าหน้าที่ต้อนรับ/ลงทะเบียน",
        badgeCls: "bg-teal-500/10 text-teal-600 border-teal-500/20",
        icon: "fa-id-card",
    },
};

const AVAILABLE_PERMISSIONS = [
    {
        key: "admin",
        label: "Super Admin (สิทธิ์ผู้ดูแลระบบสูงสุด)",
        desc: "สิทธิ์เต็ม สามารถจัดการเจ้าหน้าที่, สิทธิ์การใช้งาน, ออกรายงาน และเข้าถึงทุกส่วน",
        icon: "fa-shield-halved",
        color: "border-purple-200 bg-purple-50/60 text-purple-800",
    },
    {
        key: "officer_training",
        label: "เจ้าหน้าที่ฝึกอบรม",
        desc: "สิทธิ์จัดการหลักสูตรอบรมพัฒนาทักษะ และอนุมัติ/จัดการคิวฝึกอบรม",
        icon: "fa-graduation-cap",
        color: "border-blue-200 bg-blue-50/60 text-blue-800",
    },
    {
        key: "officer_test",
        label: "เจ้าหน้าที่ทดสอบมาตรฐาน",
        desc: "สิทธิ์จัดการสาขาทดสอบมาตรฐานฝีมือ และอนุมัติ/จัดการคิวการทดสอบ",
        icon: "fa-clipboard-check",
        color: "border-indigo-200 bg-indigo-50/60 text-indigo-800",
    },
    {
        key: "officer_registrar",
        label: "เจ้าหน้าที่ต้อนรับ/ลงทะเบียน",
        desc: "สิทธิ์รับรายงานตัวหน้างาน ออกคิว Walk-in และเช็กอินประชาชน",
        icon: "fa-id-card",
        color: "border-teal-200 bg-teal-50/60 text-teal-800",
    },
];

export default function AdminOfficersPage() {
    const [officers, setOfficers] = useState<Officer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("all");

    // Modal state for Add/Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Officer | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<string[]>(["officer_training"]);
    const [form, setForm] = useState({
        fullName: "",
        phoneNumber: "",
        email: "",
        password: "",
        department: "ฝ่ายฝึกอบรมพัฒนาทักษะ",
    });
    const [saving, setSaving] = useState(false);

    // Reset Password Modal
    const [resetTarget, setResetTarget] = useState<Officer | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [resetting, setResetting] = useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<Officer | null>(null);

    const loadOfficers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/officers");
            if (!res.ok) throw new Error("Failed to load officers");
            const data = await res.json();
            setOfficers(data);
        } catch (e: any) {
            toast.error("ไม่สามารถโหลดรายชื่อเจ้าหน้าที่ได้");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOfficers();
    }, [loadOfficers]);

    const toggleRolePermission = (key: string) => {
        if (key === "admin") {
            if (selectedRoles.includes("admin")) {
                setSelectedRoles(["officer_training"]);
            } else {
                setSelectedRoles(["admin", "officer_training", "officer_test", "officer_registrar"]);
            }
            return;
        }

        let nextRoles = [...selectedRoles];
        if (nextRoles.includes(key)) {
            nextRoles = nextRoles.filter((r) => r !== key);
            // If admin was checked but we uncheck a sub-role, uncheck admin
            nextRoles = nextRoles.filter((r) => r !== "admin");
        } else {
            nextRoles.push(key);
        }

        if (nextRoles.length === 0) {
            nextRoles = ["officer_training"];
        }

        setSelectedRoles(nextRoles);
    };

    const openAddModal = () => {
        setEditTarget(null);
        setSelectedRoles(["officer_training"]);
        setForm({
            fullName: "",
            phoneNumber: "",
            email: "",
            password: "",
            department: "ฝ่ายฝึกอบรมพัฒนาทักษะ",
        });
        setModalOpen(true);
    };

    const openEditModal = (officer: Officer) => {
        setEditTarget(officer);
        const roles = officer.role
            ? officer.role.split(",").map((r) => r.trim())
            : ["officer_training"];
        setSelectedRoles(roles);
        setForm({
            fullName: officer.fullName || "",
            phoneNumber: officer.phoneNumber || "",
            email: officer.email || "",
            password: "",
            department: officer.department || "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.fullName || !form.phoneNumber) {
            toast.error("กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์");
            return;
        }

        if (selectedRoles.length === 0) {
            toast.error("กรุณากำหนดสิทธิ์การใช้งานอย่างน้อย 1 สิทธิ์");
            return;
        }

        if (!editTarget && !form.password) {
            toast.error("กรุณากำหนดรหัสผ่านแรกเข้าสำหรับเจ้าหน้าที่ใหม่");
            return;
        }

        const roleString = selectedRoles.includes("admin")
            ? "admin"
            : selectedRoles.join(",");

        setSaving(true);
        try {
            const endpoint = "/api/admin/officers";
            const method = editTarget ? "PUT" : "POST";
            const payload = editTarget
                ? { id: editTarget.id, ...form, role: roleString }
                : { ...form, role: roleString };

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save officer");

            toast.success(editTarget ? "อัปเดตข้อมูลและสิทธิ์เจ้าหน้าที่สำเร็จ" : "เพิ่มเจ้าหน้าที่ใหม่เรียบร้อยแล้ว");
            setModalOpen(false);
            loadOfficers();
        } catch (e: any) {
            toast.error(e.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (officer: Officer) => {
        const nextStatus = officer.status === "active" ? "inactive" : "active";
        try {
            const res = await fetch("/api/admin/officers", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: officer.id, status: nextStatus }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            toast.success(`เปลี่ยนสถานะเป็น ${nextStatus === "active" ? "ใช้งานปกติ" : "ระงับใช้งาน"} เรียบร้อย`);
            loadOfficers();
        } catch {
            toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
        }
    };

    const handleQuickResetDefault = async (officer: Officer) => {
        if (!confirm(`คุณต้องการรีเซ็ตรหัสผ่านของ ${officer.fullName} เป็น "1234567890" และบังคับเปลี่ยนรหัสเมื่อเข้าสู่ระบบครั้งแรกใช่หรือไม่?`)) return;

        const tId = toast.loading("กำลังรีเซ็ตรหัสผ่านเป็น 1234567890...");
        try {
            const res = await fetch("/api/admin/officers", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: officer.id, resetDefaultPassword: true }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Reset password failed");
            toast.success(`รีเซ็ตรหัสผ่านให้ ${officer.fullName} เป็น 1234567890 เรียบร้อย! (บังคับเปลี่ยนรหัสในการ Login ครั้งแรก)`, { id: tId });
            loadOfficers();
        } catch (e: any) {
            toast.error(e.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน", { id: tId });
        }
    };

    const handleResetPasswordSubmit = async () => {
        if (!resetTarget || !newPassword) {
            toast.error("กรุณากรอกรหัสผ่านใหม่");
            return;
        }
        setResetting(true);
        try {
            const res = await fetch("/api/admin/officers", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: resetTarget.id, password: newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Reset password failed");
            toast.success(`รีเซ็ตรหัสผ่านให้ ${resetTarget.fullName} สำเร็จแล้ว (บังคับเปลี่ยนเมื่อ Login)`, { id: data.id });
            setResetTarget(null);
            setNewPassword("");
            loadOfficers();
        } catch (e: any) {
            toast.error(e.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
        } finally {
            setResetting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`/api/admin/officers?id=${deleteTarget.id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete");
            toast.success("ลบบัญชีเจ้าหน้าที่สำเร็จ");
            setDeleteTarget(null);
            loadOfficers();
        } catch (e: any) {
            toast.error(e.message || "เกิดข้อผิดพลาดในการลบบัญชี");
        }
    };

    // Filter logic
    const filteredOfficers = officers.filter((o) => {
        const matchSearch =
            (o.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
            (o.phoneNumber || "").includes(search) ||
            (o.email || "").toLowerCase().includes(search.toLowerCase()) ||
            (o.department || "").toLowerCase().includes(search.toLowerCase());

        const matchRole = filterRole === "all" || o.role === filterRole;
        return matchSearch && matchRole;
    });

    const superAdminCount = officers.filter((o) => o.role === "admin").length;
    const trainingCount = officers.filter((o) => o.role === "officer_training").length;
    const testCount = officers.filter((o) => o.role === "officer_test").length;
    const registrarCount = officers.filter((o) => o.role === "officer_registrar").length;

    const avatarGradients = [
        "from-purple-500 to-indigo-600",
        "from-blue-500 to-cyan-600",
        "from-[#6366F1] to-[#8B5CF6]",
        "from-emerald-500 to-teal-600",
    ];

    return (
        <div className="p-4 sm:p-6 bg-[#f8fafc] min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <i className="fa-solid fa-user-shield text-indigo-600"></i>
                        จัดการเจ้าหน้าที่ (Officer Management)
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        จัดการสิทธิ์ บัญชีผู้ใช้ การกำหนดฝ่ายงาน และสถานะเจ้าหน้าที่ สพร.24 ยะลา
                    </p>
                </div>

                <button
                    onClick={openAddModal}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 shrink-0"
                >
                    <i className="fa-solid fa-user-plus"></i> เพิ่มเจ้าหน้าที่ใหม่
                </button>
            </div>

            {/* Summary Counter Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
                {[
                    { label: "เจ้าหน้าที่ทั้งหมด", value: officers.length, icon: "fa-users-gear", color: "from-slate-700 to-slate-800" },
                    { label: "Super Admin", value: superAdminCount, icon: "fa-shield-halved", color: "from-purple-500 to-indigo-600" },
                    { label: "ฝ่ายฝึกอบรม", value: trainingCount, icon: "fa-graduation-cap", color: "from-blue-500 to-indigo-500" },
                    { label: "ฝ่ายทดสอบมาตรฐาน", value: testCount, icon: "fa-clipboard-check", color: "from-indigo-500 to-purple-500" },
                    { label: "ฝ่ายต้อนรับ/ลงทะเบียน", value: registrarCount, icon: "fa-id-card", color: "from-teal-500 to-emerald-600" },
                ].map((c, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-sm text-white text-sm shrink-0`}>
                            <i className={`fa-solid ${c.icon}`}></i>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl font-black text-slate-800">{c.value}</p>
                            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 leading-tight">{c.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Role Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล, ฝ่ายงาน..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <span className="text-xs font-bold text-slate-500 shrink-0">กรองสิทธิ์:</span>
                    {[
                        { id: "all", label: "ทั้งหมด" },
                        { id: "admin", label: "Super Admin" },
                        { id: "officer_training", label: "ฝึกอบรม" },
                        { id: "officer_test", label: "ทดสอบมาตรฐาน" },
                        { id: "officer_registrar", label: "ลงทะเบียน" },
                    ].map((r) => (
                        <button
                            key={r.id}
                            onClick={() => setFilterRole(r.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                filterRole === r.id
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Officer Table */}
            {loading ? (
                <div className="py-24 flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg text-indigo-600"></span>
                    <p className="text-xs text-slate-400 font-medium">กำลังโหลดรายชื่อเจ้าหน้าที่...</p>
                </div>
            ) : filteredOfficers.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 py-16 text-center text-slate-400 p-4">
                    <i className="fa-solid fa-user-slash text-4xl mb-3 block opacity-30"></i>
                    <p className="text-sm font-semibold mb-3">ไม่พบข้อมูลเจ้าหน้าที่ตามเงื่อนไข</p>
                    <button onClick={openAddModal} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm">
                        + เพิ่มเจ้าหน้าที่ใหม่
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-4 px-5">เจ้าหน้าที่</th>
                                    <th className="py-4 px-4">ฝ่ายงาน / ตำแหน่ง</th>
                                    <th className="py-4 px-4">ระดับสิทธิ์ (Role)</th>
                                    <th className="py-4 px-4 text-center">สถานะใช้งาน</th>
                                    <th className="py-4 px-4 text-right">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredOfficers.map((o, idx) => {
                                    const roleInfo = ROLE_LABELS[o.role] || {
                                        label: o.role,
                                        badgeCls: "bg-slate-100 text-slate-600",
                                        icon: "fa-user",
                                    };
                                    const gradCls = avatarGradients[idx % avatarGradients.length];

                                    return (
                                        <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Officer Name & Contacts */}
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradCls} flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0`}>
                                                        {o.fullName ? o.fullName.charAt(0) : "A"}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 leading-snug">{o.fullName}</p>
                                                        <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                            <span><i className="fa-solid fa-phone text-slate-400 mr-1"></i>{o.phoneNumber}</span>
                                                            {o.email && <span className="truncate max-w-[150px]"><i className="fa-regular fa-envelope text-slate-400 mr-1"></i>{o.email}</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Department */}
                                            <td className="py-3.5 px-4 font-semibold text-slate-700">
                                                {o.department || "—"}
                                            </td>

                                            {/* Role Badges */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(o.role || "").split(",").map((rKey) => {
                                                        const key = rKey.trim();
                                                        const rInfo = ROLE_LABELS[key] || {
                                                            label: key,
                                                            badgeCls: "bg-slate-100 text-slate-600 border-slate-200",
                                                            icon: "fa-user",
                                                        };
                                                        return (
                                                            <span
                                                                key={key}
                                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${rInfo.badgeCls}`}
                                                            >
                                                                <i className={`fa-solid ${rInfo.icon}`}></i>
                                                                {rInfo.label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>

                                            {/* Status Switch & Must Change Password Badge */}
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        onClick={() => handleToggleStatus(o)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold transition-all ${
                                                            o.status === "active"
                                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-400/20 hover:bg-emerald-500/20"
                                                                : "bg-rose-500/10 text-rose-500 border-rose-400/20 hover:bg-rose-500/20"
                                                        }`}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full ${o.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                                                        {o.status === "active" ? "ใช้งานปกติ" : "ระงับใช้งาน"}
                                                    </button>
                                                    {o.mustChangePassword && (
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                            <i className="fa-solid fa-triangle-exclamation text-[9px]"></i>
                                                            รอเปลี่ยนรหัสผ่าน
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleQuickResetDefault(o)}
                                                        className="px-2 py-1 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 transition-all text-[11px] font-bold flex items-center gap-1"
                                                        title="รีเซ็ตรหัสผ่านเป็น 1234567890 ทันที"
                                                    >
                                                        <i className="fa-solid fa-rotate-left text-amber-600"></i>
                                                        <span>รีเซ็ต 1234567890</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(o)}
                                                        className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all text-xs"
                                                        title="แก้ไขข้อมูล"
                                                    >
                                                        <i className="fa-solid fa-pen"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => setResetTarget(o)}
                                                        className="p-1.5 rounded-xl border border-amber-200 text-amber-600 hover:bg-amber-50 transition-all text-xs"
                                                        title="กำหนดรหัสผ่านใหม่เอง"
                                                    >
                                                        <i className="fa-solid fa-key"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(o)}
                                                        className="p-1.5 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all text-xs"
                                                        title="ลบบัญชี"
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ➕ Add / Edit Officer Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-7 my-8">
                            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                                <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                                    <i className="fa-solid fa-user-shield text-indigo-600"></i>
                                    {editTarget ? "✏️ แก้ไขข้อมูลเจ้าหน้าที่" : "➕ เพิ่มเจ้าหน้าที่ใหม่"}
                                </h2>
                                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>

                            <div className="space-y-4 text-xs">
                                <div>
                                    <label className="font-bold text-slate-600 block mb-1">ชื่อ-นามสกุล <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="เช่น นายสมชาย ใจดี"
                                        value={form.fullName}
                                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="font-bold text-slate-600 block mb-1">เบอร์โทรศัพท์ (ใช้ล็อกอิน) <span className="text-rose-500">*</span></label>
                                        <input
                                            type="tel"
                                            placeholder="08XXXXXXXX"
                                            value={form.phoneNumber}
                                            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-600 block mb-1">อีเมลเจ้าหน้าที่</label>
                                        <input
                                            type="email"
                                            placeholder="officer@dsd.go.th"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                        />
                                    </div>
                                </div>

                                {!editTarget && (
                                    <div>
                                        <label className="font-bold text-slate-600 block mb-1">รหัสผ่านแรกเข้า <span className="text-rose-500">*</span></label>
                                        <input
                                            type="password"
                                            placeholder="อย่างน้อย 6 ตัวอักษร"
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="font-bold text-slate-600 block mb-1">ฝ่ายงาน / ตำแหน่ง</label>
                                    <input
                                        type="text"
                                        placeholder="เช่น ฝ่ายฝึกอบรมพัฒนาทักษะ สพร.24 ยะลา"
                                        value={form.department}
                                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="font-bold text-slate-700 block">
                                            สิทธิ์การใช้งาน (กำหนดสิทธิ์ด้วยเช็คบ็อกซ์) <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-[10px] text-indigo-600 font-semibold">
                                            เลือกได้มากกว่า 1 สิทธิ์
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/60 max-h-56 overflow-y-auto">
                                        {AVAILABLE_PERMISSIONS.map((p) => {
                                            const isChecked = selectedRoles.includes(p.key);
                                            return (
                                                <label
                                                    key={p.key}
                                                    onClick={() => toggleRolePermission(p.key)}
                                                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                                        isChecked
                                                            ? `${p.color} border-indigo-400 shadow-sm`
                                                            : "border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600"
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {}} // Handled by onClick on container label
                                                        className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400 cursor-pointer shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 font-bold text-xs">
                                                            <i className={`fa-solid ${p.icon} text-indigo-600`}></i>
                                                            <span>{p.label}</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 font-normal mt-0.5 leading-relaxed">
                                                            {p.desc}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                    ยกเลิก
                                </button>
                                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20 active:scale-95">
                                    {saving ? "กำลังบันทึก..." : "💾 บันทึกข้อมูลเจ้าหน้าที่"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🔑 Reset Password Modal */}
            <AnimatePresence>
                {resetTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
                            <h2 className="text-base font-black text-slate-800 mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-key text-amber-500"></i>
                                รีเซ็ตรหัสผ่านเจ้าหน้าที่
                            </h2>
                            <p className="text-xs text-slate-500 mb-4">
                                กำหนดรหัสผ่านใหม่ให้แก่ <strong className="text-slate-800">{resetTarget.fullName}</strong>
                            </p>

                            <div className="mb-4">
                                <label className="text-xs font-bold text-slate-600 block mb-1">รหัสผ่านใหม่</label>
                                <input
                                    type="password"
                                    placeholder="กรอกรหัสผ่านใหม่"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setResetTarget(null)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                                    ยกเลิก
                                </button>
                                <button onClick={handleResetPasswordSubmit} disabled={resetting} className="flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20">
                                    {resetting ? "กำลังรีเซ็ต..." : "🔑 บันทึกรหัสผ่านใหม่"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🗑️ Delete Confirm Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3 text-xl">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                            </div>
                            <h2 className="text-base font-black text-slate-800 mb-1">ยืนยันการลบบัญชีเจ้าหน้าที่</h2>
                            <p className="text-xs text-slate-500 mb-5">
                                คุณต้องการลบบัญชีของ <strong className="text-slate-800">{deleteTarget.fullName}</strong> หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                                    ยกเลิก
                                </button>
                                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20">
                                    ลบบัญชี
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
