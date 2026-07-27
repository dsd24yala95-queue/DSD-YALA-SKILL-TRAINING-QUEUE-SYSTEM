import re

with open("src/app/admin/members/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Expand Member Interface
new_member_interface = """interface Member {
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
}"""

content = re.sub(r'interface Member \{.*?profileImage\?: string;\s*\}', new_member_interface, content, flags=re.DOTALL)

# 2. Expand handleEditSubmit
old_handle_edit = r'const handleEditSubmit = async \(e: React\.FormEvent\) => \{.*?setSaving\(false\);\s*\};'

new_handle_edit = """const handleEditSubmit = async (e: React.FormEvent) => {
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
                reg_title: editMember.reg_title,
                reg_firstname: editMember.reg_firstname,
                reg_lastname: editMember.reg_lastname,
                reg_title_en: editMember.reg_title_en,
                reg_firstnameEng: editMember.reg_firstnameEng,
                reg_lastnameEng: editMember.reg_lastnameEng,
                reg_citizenid: editMember.reg_citizenid,
                reg_birth: editMember.reg_birth,
                reg_telephone: editMember.reg_telephone,
                reg_email: editMember.reg_email,
                reg_education: editMember.reg_education,
                reg_education_section: editMember.reg_education_section,
                reg_body_state: editMember.reg_body_state,
                reg_body_state_detail: editMember.reg_body_state_detail,
                reg_address_no: editMember.reg_address_no,
                reg_address_moo: editMember.reg_address_moo,
                reg_address_street: editMember.reg_address_street,
                reg_address_soi: editMember.reg_address_soi,
                reg_address_province: editMember.reg_address_province,
                reg_address_district: editMember.reg_address_district,
                reg_address_subdistrict: editMember.reg_address_subdistrict,
            };
            
            const fullName = `${resolveTitle(editMember.reg_title || "001")}${editMember.reg_firstname} ${editMember.reg_lastname}`.trim();

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
    };"""

content = re.sub(old_handle_edit, new_handle_edit, content, flags=re.DOTALL)

# 3. Replace Modal JSX
# Find the start of the modal: {/* Edit Modal */} or just look for the form.
old_modal_start = r'<div className="flex items-center justify-between mb-5">.*?<h2 className="text-base font-black text-slate-800 flex items-center gap-2">'
# We will just replace the form inside the motion.div
# First let's find the exact block of the form

old_form_regex = r'<form onSubmit=\{handleEditSubmit\}.*?</form>'

new_form = """<form onSubmit={handleEditSubmit} className="space-y-6">
                            {/* Personal Info */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2"><i className="fa-solid fa-user text-indigo-400 mr-2"></i> ข้อมูลส่วนตัว</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">คำนำหน้าชื่อ</label>
                                        <select value={editMember.reg_title || "001"} onChange={e => setEditMember({...editMember, reg_title: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white">
                                            <option value="001">นาย</option>
                                            <option value="002">นาง</option>
                                            <option value="003">นางสาว</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">เลขบัตรประจำตัวประชาชน</label>
                                        <input required type="text" maxLength={13} value={editMember.reg_citizenid || ""} onChange={e => setEditMember({...editMember, reg_citizenid: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">ชื่อ (ภาษาไทย)</label>
                                        <input required type="text" value={editMember.reg_firstname || ""} onChange={e => setEditMember({...editMember, reg_firstname: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">นามสกุล (ภาษาไทย)</label>
                                        <input required type="text" value={editMember.reg_lastname || ""} onChange={e => setEditMember({...editMember, reg_lastname: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">วันเกิด</label>
                                        <input type="date" value={editMember.reg_birth || ""} onChange={e => setEditMember({...editMember, reg_birth: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">สภาพร่างกาย</label>
                                        <select value={editMember.reg_body_state || "0"} onChange={e => setEditMember({...editMember, reg_body_state: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white">
                                            <option value="0">ปกติ</option>
                                            <option value="1">ความพิการ</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2"><i className="fa-solid fa-phone text-emerald-400 mr-2"></i> ข้อมูลติดต่อ</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">เบอร์โทรศัพท์</label>
                                        <input required type="text" maxLength={10} value={editMember.reg_telephone || ""} onChange={e => setEditMember({...editMember, reg_telephone: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">อีเมล</label>
                                        <input type="email" value={editMember.reg_email || ""} onChange={e => setEditMember({...editMember, reg_email: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Address Info */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2"><i className="fa-solid fa-map-location-dot text-amber-400 mr-2"></i> ที่อยู่</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">บ้านเลขที่</label>
                                        <input type="text" value={editMember.reg_address_no || ""} onChange={e => setEditMember({...editMember, reg_address_no: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">หมู่ที่</label>
                                        <input type="text" value={editMember.reg_address_moo || ""} onChange={e => setEditMember({...editMember, reg_address_moo: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">ตรอก/ซอย</label>
                                        <input type="text" value={editMember.reg_address_soi || ""} onChange={e => setEditMember({...editMember, reg_address_soi: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">ถนน</label>
                                        <input type="text" value={editMember.reg_address_street || ""} onChange={e => setEditMember({...editMember, reg_address_street: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">จังหวัด</label>
                                        <select value={editMember.reg_address_province || "95"} onChange={e => setEditMember({...editMember, reg_address_province: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white">
                                            <option value="94">ปัตตานี</option>
                                            <option value="95">ยะลา</option>
                                            <option value="96">นราธิวาส</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">อำเภอ</label>
                                        <input type="text" value={editMember.reg_address_district || ""} onChange={e => setEditMember({...editMember, reg_address_district: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">ตำบล</label>
                                        <input type="text" value={editMember.reg_address_subdistrict || ""} onChange={e => setEditMember({...editMember, reg_address_subdistrict: e.target.value})} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-100 py-3">
                                <button type="button" onClick={() => setEditMember(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all">ยกเลิก</button>
                                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2">
                                    {saving ? <span className="loading loading-spinner loading-xs"></span> : <i className="fa-solid fa-floppy-disk"></i>} บันทึก
                                </button>
                            </div>
                        </form>"""

content = re.sub(old_form_regex, new_form, content, flags=re.DOTALL)

# Let's make the motion.div scrollable
old_motion_div = r'<motion\.div\s+initial=\{\{\s*scale:\s*0\.95,\s*opacity:\s*0\s*\}\}\s+animate=\{\{\s*scale:\s*1,\s*opacity:\s*1\s*\}\}\s+className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative"'

new_motion_div = """<motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto" """

content = re.sub(old_motion_div, new_motion_div, content, flags=re.DOTALL)


with open("src/app/admin/members/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
