import re

with open("src/app/admin/members/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add states
state_addition = """    const [selected, setSelected] = useState<Member | null>(null);
    const [editMember, setEditMember] = useState<Member | null>(null);
    const [deleteMember, setDeleteMember] = useState<Member | null>(null);
    const [saving, setSaving] = useState(false);"""
content = content.replace("    const [selected, setSelected] = useState<Member | null>(null);", state_addition)

# 2. Add handlers before useEffect
handlers = """
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editMember) return;
        setSaving(true);
        try {
            const resUser = await fetch(`/api/users?id=${editMember.id}`);
            const userDb = await resUser.json();
            let parsed = {};
            if (userDb.profileJson) {
                try { parsed = JSON.parse(userDb.profileJson); } catch(e){}
            }
            
            const newProfile = {
                ...parsed,
                reg_firstname: editMember.reg_firstname,
                reg_lastname: editMember.reg_lastname,
                reg_email: editMember.reg_email,
                reg_telephone: editMember.reg_telephone,
                reg_citizenid: editMember.reg_citizenid,
            };
            
            const fullName = `${resolveTitle(editMember.reg_title || "")}${editMember.reg_firstname} ${editMember.reg_lastname}`.trim();

            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editMember.id,
                    fullName,
                    phoneNumber: editMember.reg_telephone,
                    email: editMember.reg_email,
                    profileJson: JSON.stringify(newProfile)
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
"""
content = content.replace("    const loadMembers = useCallback(async () => {", handlers + "\n    const loadMembers = useCallback(async () => {")

# 3. Add Edit and Delete Modals to the end, and buttons to the detail modal.
buttons = """
                        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                            <button onClick={() => { setEditMember(selected); setSelected(null); }} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                                <i className="fa-solid fa-pen-to-square"></i> แก้ไข
                            </button>
                            <button onClick={() => { setDeleteMember(selected); setSelected(null); }} className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                                <i className="fa-solid fa-trash"></i> ลบ
                            </button>
                        </div>
                    </motion.div>
"""
content = content.replace("                    </motion.div>\n                </div>\n            )}", buttons + "                </div>\n            )}")

modals = """
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
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1">ชื่อ</label>
                                    <input required type="text" value={editMember.reg_firstname || ""} onChange={e => setEditMember({...editMember, reg_firstname: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-slate-50" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1">นามสกุล</label>
                                    <input required type="text" value={editMember.reg_lastname || ""} onChange={e => setEditMember({...editMember, reg_lastname: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-slate-50" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">รหัสบัตรประชาชน</label>
                                <input required type="text" value={editMember.reg_citizenid || ""} onChange={e => setEditMember({...editMember, reg_citizenid: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-slate-50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">เบอร์โทรศัพท์</label>
                                <input required type="text" value={editMember.reg_telephone || ""} onChange={e => setEditMember({...editMember, reg_telephone: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-slate-50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">อีเมล</label>
                                <input type="email" value={editMember.reg_email || ""} onChange={e => setEditMember({...editMember, reg_email: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-slate-50" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditMember(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all">ยกเลิก</button>
                                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2">
                                    {saving ? <span className="loading loading-spinner loading-xs"></span> : <i className="fa-solid fa-floppy-disk"></i>} บันทึก
                                </button>
                            </div>
                        </form>
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
"""

content = content.replace("        </div>\n    );\n}\n", modals + "        </div>\n    );\n}\n")

with open("src/app/admin/members/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
