"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import FullMemberEditForm from "@/components/admin/FullMemberEditForm";
import Link from "next/link";

interface MasterCourse {
    id: string;
    courseName: string;
    durationDays: number;
    maxSeats: number;
    currentQueue: number;
    Date?: string;
    status: string;
}

interface MasterBranch {
    id: string;
    branchName: string;
    levels: string;
    maxQueue: number;
    status: string;
}

interface UserSearchResult {
    id: string;
    fullName: string;
    phoneNumber: string;
    citizenId?: string;
    memberId?: string;
    profileImage?: string;
}

export default function AdminWalkInPage() {
    const [regMode, setRegMode] = useState<"quick" | "full">("quick");
    const [bookingType, setBookingType] = useState<"training" | "test">("training");
    
    // Master data
    const [courses, setCourses] = useState<MasterCourse[]>([]);
    const [branches, setBranches] = useState<MasterBranch[]>([]);
    const [loadingMaster, setLoadingMaster] = useState(true);

    // Selected item for queue booking
    const [selectedItemId, setSelectedItemId] = useState("");

    // Search existing user
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

    // Quick form
    const [quickForm, setQuickForm] = useState({
        title: "001",
        fullName: "",
        phoneNumber: "",
        citizenId: "",
        email: "",
        education: "ปริญญาตรี",
    });

    // Submitting state
    const [submitting, setSubmitting] = useState(false);

    // Ticket result state
    const [issuedTicket, setIssuedTicket] = useState<{
        ticketCode: string;
        user: any;
        booking: any;
    } | null>(null);

    // Load master courses & branches
    const loadMasterData = useCallback(async () => {
        setLoadingMaster(true);
        try {
            const [cRes, bRes] = await Promise.all([
                fetch("/api/master/courses"),
                fetch("/api/master/branches"),
            ]);
            if (cRes.ok) {
                const cData = await cRes.json();
                const activeC = cData.filter((c: any) => c.status === "active");
                setCourses(activeC);
                if (activeC.length > 0 && bookingType === "training") {
                    setSelectedItemId(activeC[0].id);
                }
            }
            if (bRes.ok) {
                const bData = await bRes.json();
                const activeB = bData.filter((b: any) => b.status === "active");
                setBranches(activeB);
            }
        } catch (e) {
            toast.error("ไม่สามารถโหลดข้อมูลหลักสูตร/สาขาได้");
        } finally {
            setLoadingMaster(false);
        }
    }, [bookingType]);

    useEffect(() => {
        loadMasterData();
    }, [loadMasterData]);

    useEffect(() => {
        if (bookingType === "training" && courses.length > 0) {
            setSelectedItemId(courses[0].id);
        } else if (bookingType === "test" && branches.length > 0) {
            setSelectedItemId(branches[0].id);
        }
    }, [bookingType, courses, branches]);

    // Search user by phone or citizen ID
    const handleSearchUser = async () => {
        if (!searchQuery.trim()) {
            toast.error("กรุณากรอกเบอร์โทรศัพท์ หรือเลขบัตรประชาชน");
            return;
        }
        setSearching(true);
        try {
            const res = await fetch(`/api/users?role=member`);
            if (!res.ok) throw new Error("Search failed");
            const members: any[] = await res.json();
            const q = searchQuery.trim().toLowerCase();
            const found = members.find(
                (m) =>
                    (m.phoneNumber && m.phoneNumber.includes(q)) ||
                    (m.fullName && m.fullName.toLowerCase().includes(q)) ||
                    (m.idCard && m.idCard.includes(q)) ||
                    (m.profileJson && m.profileJson.includes(q))
            );

            if (found) {
                let parsedProfile: any = {};
                try { if (found.profileJson) parsedProfile = JSON.parse(found.profileJson); } catch (e) {}
                setSelectedUser({
                    id: found.id,
                    fullName: found.fullName || `${parsedProfile.reg_firstname || ''} ${parsedProfile.reg_lastname || ''}`.trim(),
                    phoneNumber: found.phoneNumber || parsedProfile.reg_telephone || "",
                    citizenId: parsedProfile.reg_citizenid || found.idCard || "",
                    memberId: found.memberId,
                    profileImage: found.profileImage || parsedProfile.profileImage,
                });
                toast.success(`พบบัญชีสมาชิก: ${found.fullName}`);
            } else {
                setSelectedUser(null);
                toast.info("ไม่พบบัญชีในระบบ สามารถกรอกข้อมูลเพื่อลงทะเบียนใหม่ได้ทันที");
            }
        } catch (e) {
            toast.error("เกิดข้อผิดพลาดในการค้นหาสมาชิก");
        } finally {
            setSearching(false);
        }
    };

    // Quick Form Walk-in Submission
    const handleQuickSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let selectedItemName = "";
        if (bookingType === "training") {
            const c = courses.find((x) => x.id === selectedItemId);
            selectedItemName = c ? c.courseName : "";
        } else {
            const b = branches.find((x) => x.id === selectedItemId);
            selectedItemName = b ? b.branchName : "";
        }

        if (!selectedUser && (!quickForm.fullName || !quickForm.phoneNumber)) {
            toast.error("กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์");
            return;
        }

        setSubmitting(true);
        const tId = toast.loading("กำลังออกบัตรคิว Walk-in...");

        try {
            const payload: any = {
                type: bookingType,
                itemId: selectedItemId,
                itemName: selectedItemName,
            };

            if (selectedUser) {
                payload.existingUserId = selectedUser.id;
            } else {
                payload.title = quickForm.title;
                payload.fullName = quickForm.fullName;
                payload.phoneNumber = quickForm.phoneNumber;
                payload.citizenId = quickForm.citizenId;
                payload.email = quickForm.email;
                payload.education = quickForm.education;
            }

            const res = await fetch("/api/admin/walkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to process Walk-in");

            setIssuedTicket({
                ticketCode: data.ticketCode,
                user: data.user,
                booking: data.booking,
            });

            toast.success(`ออกบัตรคิว Walk-in สำเร็จ! (คิวที่: ${data.ticketCode})`, { id: tId });
        } catch (err: any) {
            toast.error(err.message || "เกิดข้อผิดพลาดในการลงทะเบียน Walk-in", { id: tId });
        } finally {
            setSubmitting(false);
        }
    };

    // Full 50-field Form Walk-in Submission
    const handleFullFormSave = async (profileJsonStr: string) => {
        let selectedItemName = "";
        if (bookingType === "training") {
            const c = courses.find((x) => x.id === selectedItemId);
            selectedItemName = c ? c.courseName : "";
        } else {
            const b = branches.find((x) => x.id === selectedItemId);
            selectedItemName = b ? b.branchName : "";
        }

        try {
            const parsed = JSON.parse(profileJsonStr);
            const resolveTitle = (code: string) => {
                if (code === "001") return "นาย";
                if (code === "002") return "นาง";
                if (code === "003") return "นางสาว";
                return "";
            };
            const fullName = `${resolveTitle(parsed.reg_title || "")}${parsed.reg_firstname || ""} ${parsed.reg_lastname || ""}`.trim();
            const phoneNumber = parsed.reg_telephone;

            if (!fullName || !phoneNumber) {
                toast.error("กรุณากรอกชื่อจริง นามสกุล และเบอร์โทรศัพท์ในฟอร์ม");
                return;
            }

            setSubmitting(true);
            const tId = toast.loading("กำลังออกบัตรคิว Walk-in (ข้อมูลเต็ม 50 ฟิลด์)...");

            const res = await fetch("/api/admin/walkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: parsed.reg_title || "001",
                    fullName,
                    phoneNumber,
                    citizenId: parsed.reg_citizenid || "",
                    email: parsed.reg_email || "",
                    education: parsed.reg_education || "",
                    profileJson: profileJsonStr,
                    type: bookingType,
                    itemId: selectedItemId,
                    itemName: selectedItemName,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to process Walk-in");

            setIssuedTicket({
                ticketCode: data.ticketCode,
                user: data.user,
                booking: data.booking,
            });

            toast.success(`ออกบัตรคิว Walk-in ข้อมูลเต็มสำเร็จ! (${data.ticketCode})`, { id: tId });
        } catch (err: any) {
            toast.error(err.message || "เกิดข้อผิดพลาดในการลงทะเบียน Walk-in");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-[#f8fafc] min-h-screen font-sans">
            {/* Top Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <i className="fa-solid fa-person-walking-arrow-right text-indigo-600"></i>
                        ระบบลงทะเบียน Walk-in หน้างาน (Reception Kiosk)
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                        ลงทะเบียนประชาชน ออกบัตรคิวอัตโนมัติ สพร.24 ยะลา
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/queue"
                        className="flex items-center gap-2 px-4.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <i className="fa-solid fa-list-check text-indigo-600"></i> จัดการลำดับคิว
                    </Link>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN: Registration & Queue Issuance Form */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Step 1: Booking Service Selection (Training vs Test) */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h2 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">1</span>
                            เลือกประเภทบริการที่ต้องการเข้ารับบริการ
                        </h2>

                        {/* Service Type Switcher */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <button
                                type="button"
                                onClick={() => setBookingType("training")}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 transition-all text-left ${
                                    bookingType === "training"
                                        ? "border-blue-500 bg-blue-50/60 text-blue-900 shadow-sm"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                                    bookingType === "training" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                                }`}>
                                    <i className="fa-solid fa-graduation-cap"></i>
                                </div>
                                <div>
                                    <p className="font-extrabold text-sm sm:text-base">ฝึกอบรมพัฒนาทักษะ</p>
                                    <p className="text-xs text-slate-500 mt-0.5">คอร์สฝึกอบรมฝีมือแรงงาน</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setBookingType("test")}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 transition-all text-left ${
                                    bookingType === "test"
                                        ? "border-indigo-500 bg-indigo-50/60 text-indigo-900 shadow-sm"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                                    bookingType === "test" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                                }`}>
                                    <i className="fa-solid fa-clipboard-check"></i>
                                </div>
                                <div>
                                    <p className="font-extrabold text-sm sm:text-base">ทดสอบมาตรฐานฝีมือ</p>
                                    <p className="text-xs text-slate-500 mt-0.5">การประเมินและทดสอบมาตรฐาน</p>
                                </div>
                            </button>
                        </div>

                        {/* Item Dropdown Selection */}
                        {loadingMaster ? (
                            <div className="py-4 text-center text-xs text-slate-400">
                                <span className="loading loading-spinner loading-xs mr-2"></span> กำลังโหลดรายการ...
                            </div>
                        ) : bookingType === "training" ? (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">เลือกหลักสูตรการฝึกอบรม</label>
                                <select
                                    value={selectedItemId}
                                    onChange={(e) => setSelectedItemId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                >
                                    {courses.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.courseName} ({c.durationDays} วัน | ว่าง {c.maxSeats - c.currentQueue}/{c.maxSeats} ที่นั่ง)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">เลือกสาขาการทดสอบมาตรฐาน</label>
                                <select
                                    value={selectedItemId}
                                    onChange={(e) => setSelectedItemId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                >
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.branchName} ({b.levels})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Member Search & Registration */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">2</span>
                                ข้อมูลผู้เข้ารับบริการ (ค้นหาบัญชีเก่า หรือ ลงทะเบียนใหม่)
                            </h2>
                        </div>

                        {/* Search Bar for Existing Member */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-5">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">🔍 ค้นหาผู้สมัครเดิมด้วย เบอร์โทร หรือ บัตรประชาชน</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="พิมพ์เบอร์โทร หรือ เลขบัตรประชาชน 13 หลัก..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={handleSearchUser}
                                    disabled={searching}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                                >
                                    {searching ? <span className="loading loading-spinner loading-xs"></span> : <i className="fa-solid fa-magnifying-glass"></i>}
                                    ค้นหา
                                </button>
                            </div>

                            {/* Found User Banner */}
                            {selectedUser && (
                                <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                            {selectedUser.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-slate-900 text-sm">{selectedUser.fullName}</p>
                                            <p className="text-xs text-slate-600 font-medium">โทร: {selectedUser.phoneNumber} | บัตรประชาชน: {selectedUser.citizenId || "—"}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUser(null)}
                                        className="text-xs text-rose-600 font-bold hover:underline"
                                    >
                                        ล้างการเลือก
                                    </button>
                                </div>
                            )}
                        </div>

                        {!selectedUser && (
                            <>
                                {/* Mode Selector: Quick vs Full 50 DSD Fields */}
                                <div className="flex bg-slate-100 p-1 rounded-2xl mb-5">
                                    <button
                                        type="button"
                                        onClick={() => setRegMode("quick")}
                                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                                            regMode === "quick"
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                        ⚡ ลงทะเบียนด่วน (6 ฟิลด์หลัก)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRegMode("full")}
                                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                                            regMode === "full"
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                        📝 กรอกข้อมูลแบบเต็ม (50 ฟิลด์ DSD)
                                    </button>
                                </div>

                                {regMode === "full" ? (
                                    <div className="h-[60vh] border border-slate-200 rounded-2xl overflow-hidden">
                                        <FullMemberEditForm
                                            initialData={{}}
                                            onSave={handleFullFormSave}
                                            onCancel={() => setRegMode("quick")}
                                            saving={submitting}
                                        />
                                    </div>
                                ) : (
                                    <form onSubmit={handleQuickSubmit} className="space-y-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">คำนำหน้า</label>
                                                <select
                                                    value={quickForm.title}
                                                    onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none"
                                                >
                                                    <option value="001">นาย</option>
                                                    <option value="002">นาง</option>
                                                    <option value="003">นางสาว</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ-นามสกุล <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="text"
                                                    placeholder="เช่น สมชาย ใจดี"
                                                    value={quickForm.fullName}
                                                    onChange={(e) => setQuickForm({ ...quickForm, fullName: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="tel"
                                                    placeholder="08XXXXXXXX"
                                                    value={quickForm.phoneNumber}
                                                    onChange={(e) => setQuickForm({ ...quickForm, phoneNumber: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">เลขบัตรประชาชน (13 หลัก)</label>
                                                <input
                                                    type="text"
                                                    maxLength={13}
                                                    placeholder="1950100XXXXXX"
                                                    value={quickForm.citizenId}
                                                    onChange={(e) => setQuickForm({ ...quickForm, citizenId: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">อีเมลผู้สมัคร</label>
                                                <input
                                                    type="email"
                                                    placeholder="example@mail.com"
                                                    value={quickForm.email}
                                                    onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">ระดับการศึกษา</label>
                                                <select
                                                    value={quickForm.education}
                                                    onChange={(e) => setQuickForm({ ...quickForm, education: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
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

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] text-white text-sm font-black transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 mt-2"
                                        >
                                            {submitting ? (
                                                <><span className="loading loading-spinner loading-sm"></span> กำลังออกบัตรคิว...</>
                                            ) : (
                                                <><i className="fa-solid fa-ticket"></i> กดออกบัตรคิว Walk-in ทันที</>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}

                        {selectedUser && (
                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={handleQuickSubmit}
                                    disabled={submitting}
                                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white text-sm font-black transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <><span className="loading loading-spinner loading-sm"></span> กำลังออกบัตรคิว...</>
                                    ) : (
                                        <><i className="fa-solid fa-ticket"></i> ออกบัตรคิว Walk-in สำหรับสมาชิกนี้ ({selectedUser.fullName})</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Issued Ticket Slip View */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm sticky top-6 text-center">
                        <h2 className="text-base font-black text-slate-800 mb-4 flex items-center justify-center gap-2">
                            <i className="fa-solid fa-receipt text-indigo-600"></i>
                            บัตรคิว Walk-in ที่ออกล่าสุด
                        </h2>

                        {issuedTicket ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden text-left"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <i className="fa-solid fa-qrcode text-8xl"></i>
                                </div>

                                <div className="text-center pb-4 border-b border-white/10 mb-4">
                                    <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold border border-indigo-400/30 mb-2">
                                        สพร.24 ยะลา · Walk-in
                                    </span>
                                    <p className="text-xs text-slate-400">หมายเลขคิวของคุณ</p>
                                    <p className="text-4xl sm:text-5xl font-black text-amber-400 tracking-wider my-2 font-mono drop-shadow">
                                        {issuedTicket.ticketCode}
                                    </p>
                                    <p className="text-xs text-indigo-200 font-semibold">{issuedTicket.booking?.itemName}</p>
                                </div>

                                <div className="space-y-2 text-xs mb-6 text-slate-300">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">ผู้ถือบัตรคิว:</span>
                                        <span className="font-bold text-white">{issuedTicket.user?.fullName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">เบอร์โทรศัพท์:</span>
                                        <span className="font-mono text-white">{issuedTicket.user?.phoneNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">เวลาออกคิว:</span>
                                        <span className="text-white">{new Date().toLocaleTimeString("th-TH")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">สถานะคิว:</span>
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">เช็กอินแล้ว</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <i className="fa-solid fa-print"></i> พิมพ์บัตรคิว
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIssuedTicket(null)}
                                        className="py-2.5 px-3 rounded-xl bg-rose-500/20 text-rose-300 font-bold text-xs hover:bg-rose-500/30 transition-all"
                                    >
                                        ปิด
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="py-16 text-slate-300 border-2 border-dashed border-slate-200 rounded-3xl p-6">
                                <i className="fa-solid fa-ticket text-5xl mb-3 block opacity-30 text-indigo-400"></i>
                                <p className="text-sm font-bold text-slate-600">ยังไม่มีการออกบัตรคิว</p>
                                <p className="text-xs text-slate-400 mt-1">เลือกประเภทบริการและกรอกข้อมูลทางด้านซ้ายเพื่อกดออกบัตรคิว Walk-in</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
