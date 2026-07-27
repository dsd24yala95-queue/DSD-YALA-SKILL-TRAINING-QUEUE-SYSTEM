import React, { useState } from 'react';
import { parseProfileJson, buildProfileJson } from "@/lib/jsonEngine";

const SOUTHERN_ADDRESS_DB: Record<string, Record<string, Record<string, string>>> = {
  "95": {
    "เมืองยะลา": { "สะเตง": "95000", "สะเตงนอก": "95000", "บุดี": "95000", "เปาะเส้ง": "95000", "ลิดล": "95000", "ยะลา": "95000", "ท่าสาป": "95000", "หน้าถ้ำ": "95000", "ตาเซะ": "95000", "พร่อน": "95000", "บันนังสาเรง": "95000", "ลำใหม่": "95160", "ลำพะยา": "95160" },
    "ยะหา": { "ยะหา": "95120", "บาโร๊ะ": "95120", "ปะแต": "95120", "กาตอง": "95120", "ละแอ": "95120", "ตาชี": "95120", "บาโงยซิแน": "95120" },
    "บันนังสตา": { "บันนังสตา": "95130", "บาเจาะ": "95130", "เขื่อนบางลาง": "95130", "ตลิ่งชัน": "95130", "ถ้ำทะลุ": "95130", "ตาเนาะปูเต๊ะ": "95130" },
    "เบตง": { "เบตง": "95110", "ยะรม": "95110", "อัยเยอร์เวง": "95110", "ตาเนาะแมเราะ": "95110", "ธารน้ำทิพย์": "95110" },
    "รามัน": { "กายูบอเกาะ": "95140", "โกตาบารู": "95140", "กาลูปัง": "95140", "กาลอ": "95140", "บาลอ": "95140", "บาโงย": "95140", "ท่าธง": "95140", "เนินงาม": "95140", "วังพญา": "95140", "ตะโละหะลอ": "95140", "อาซ่อง": "95140", "บือมัง": "95140" },
    "ธารโต": { "ธารโต": "95150", "คีรีเขต": "95150", "แม่หวาด": "95150", "บ้านแหร": "95150" },
    "กรงปินัง": { "กรงปินัง": "95000", "สะเอะ": "95000", "ห้วยกระทิง": "95000", "ปุโรง": "95000" },
    "กาบัง": { "กาบัง": "95120", "บาละ": "95120" }
  },
  "94": {
    "เมืองปัตตานี": { "สะบารัง": "94000", "อาโนรู": "94000", "จะบังติกอ": "94000", "บานา": "94000", "รูสะมิแล": "94000", "ตะลุโบะ": "94000", "ปูยุด": "94000", "บาราโหม": "94000", "กะมิยอ": "94000", "คลองมานิง": "94000", "ปะกาฮะรัง": "94000" },
    "โคกโพธิ์": { "โคกโพธิ์": "94120", "นาประดู่": "94180", "ปากล่อ": "94120", "ช้างให้ตก": "94120", "ทุ่งพลา": "94180" },
    "ยะรัง": { "ยะรัง": "94160", "ประจัน": "94160", "ระแว้ง": "94160", "กระโด": "94160" },
    "หนองจิก": { "ตุยง": "94170", "บ่อทอง": "94170", "บางเขา": "94170" },
    "สายบุรี": { "ตะลุบัน": "94110", "ปะเสยะวอ": "94110" },
    "ยะหริ่ง": { "ยามู": "94150", "ตะโละกาโปร์": "94150" },
    "ปะนาเระ": { "ปะนาเระ": "94130" },
    "มายอ": { "มายอ": "94140" },
    "ทุ่งยางแดง": { "ตะโละแมะนา": "94140" },
    "ไม้แก่น": { "ไทรทอง": "94220" },
    "กะพ้อ": { "ปล่องหอย": "94230" },
    "แม่ลาน": { "แม่ลาน": "94180" }
  },
  "96": {
    "เมืองนราธิวาส": { "บางนาค": "96000", "ลำภู": "96000", "กะลุวอ": "96000", "กะลุวอเหนือ": "96000", "มะนังตายอ": "96000", "โคกเคียน": "96000" },
    "ตากใบ": { "เจ๊ะเห": "96110", "ไพรวัน": "96110", "ศาลาใหม่": "96110" },
    "บาเจาะ": { "บาเจาะ": "96170", "ลุโบะสาวอ": "96170" },
    "ยี่งอ": { "ยี่งอ": "96180", "ลุโบะบายะ": "96180" },
    "ระแงะ": { "ตันหยงมัส": "96130", "บองอ": "96130" },
    "รือเสาะ": { "รือเสาะ": "96150", "รือเสาะออก": "96150" },
    "ศรีสาคร": { "ศรีสาคร": "96210" },
    "แว้ง": { "แว้ง": "96160", "โละจูด": "96160" },
    "สุคิริน": { "สุคิริน": "96190" },
    "สุไหงโก-ลก": { "สุไหงโก-ลก": "96120", "ปาเสมัส": "96120" },
    "สุไหงปาดี": { "ปะลุรู": "96140" },
    "จะแนะ": { "จะแนะ": "96220" },
    "เจาะไอร้อง": { "จวบ": "96130" }
  }
};

export default function FullMemberEditForm({ 
  initialData, 
  onSave, 
  onCancel, 
  saving 
}: { 
  initialData: any; 
  onSave: (data: any) => void; 
  onCancel: () => void;
  saving: boolean;
}) {
  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState<any>({
    ...parseProfileJson(initialData.profileJson || "{}")
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
        const next = { ...prev, [name]: value };
        // Handle cascading dropdowns for address
        if (name === "reg_address_province") {
            next.reg_address_district = "";
            next.reg_address_subdistrict = "";
        }
        if (name === "reg_address_district") {
            next.reg_address_subdistrict = "";
        }
        if (name === "reg_address_subdistrict") {
            const db = SOUTHERN_ADDRESS_DB[next.reg_address_province];
            if (db && db[next.reg_address_district]) {
                next.postcode = db[next.reg_address_district][value] || "";
            }
        }
        return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(buildProfileJson(formData));
  };

  const dbProvince = SOUTHERN_ADDRESS_DB[formData.reg_address_province];
  const districts = dbProvince ? Object.keys(dbProvince) : [];
  const subdistricts = (dbProvince && formData.reg_address_district && dbProvince[formData.reg_address_district]) 
        ? Object.keys(dbProvince[formData.reg_address_district]) : [];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-slate-50/50">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10 overflow-x-auto rounded-t-3xl">
        {[
            { id: 1, icon: "fa-user", label: "ข้อมูลส่วนตัว" },
            { id: 2, icon: "fa-map-location-dot", label: "ที่อยู่" },
            { id: 3, icon: "fa-graduation-cap", label: "การศึกษา" },
            { id: 4, icon: "fa-briefcase", label: "การทำงาน" },
            { id: 5, icon: "fa-star", label: "ความต้องการ" }
        ].map(tab => (
            <button 
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.id 
                    ? "text-indigo-600 border-indigo-600 bg-indigo-50/50" 
                    : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                }`}
            >
                <i className={`fa-solid ${tab.icon} mr-2`}></i> {tab.label}
            </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        
        {/* Tab 1: Personal */}
        {activeTab === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">คำนำหน้าชื่อ (TH)</label>
                        <select name="reg_title" value={formData.reg_title} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm">
                            <option value="001">นาย</option>
                            <option value="002">นาง</option>
                            <option value="003">นางสาว</option>
                            <option value="004">เด็กชาย</option>
                            <option value="005">เด็กหญิง</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Title (EN)</label>
                        <select name="reg_title_en" value={formData.reg_title_en} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm">
                            <option value="Mr.">Mr.</option>
                            <option value="Mrs.">Mrs.</option>
                            <option value="Miss">Miss</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">ชื่อ (ภาษาไทย) *</label>
                        <input required type="text" name="reg_firstname" value={formData.reg_firstname} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">นามสกุล (ภาษาไทย) *</label>
                        <input required type="text" name="reg_lastname" value={formData.reg_lastname} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">First Name (EN)</label>
                        <input type="text" name="reg_firstnameEng" value={formData.reg_firstnameEng} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Last Name (EN)</label>
                        <input type="text" name="reg_lastnameEng" value={formData.reg_lastnameEng} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">บัตรประชาชน *</label>
                        <input required type="text" maxLength={13} name="reg_citizenid" value={formData.reg_citizenid} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">วันเกิด *</label>
                        <input required type="date" name="reg_birth" value={formData.reg_birth} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">เพศ</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm">
                            <option value="1">ชาย</option>
                            <option value="2">หญิง</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">สภาพร่างกาย</label>
                        <select name="reg_body_state" value={formData.reg_body_state} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm">
                            <option value="0">ปกติ</option>
                            <option value="1">ความพิการ</option>
                        </select>
                    </div>
                    {formData.reg_body_state === "1" && (
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-600 mb-1 block">ระบุความพิการ</label>
                            <input type="text" name="reg_body_state_detail" value={formData.reg_body_state_detail} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">เบอร์โทรศัพท์ *</label>
                        <input required type="text" maxLength={10} name="reg_telephone" value={formData.reg_telephone} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">อีเมล</label>
                        <input type="email" name="reg_email" value={formData.reg_email} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                </div>
            </div>
        )}

        {/* Tab 2: Address */}
        {activeTab === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">บ้านเลขที่</label>
                        <input type="text" name="reg_address_no" value={formData.reg_address_no} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">หมู่ที่</label>
                        <input type="text" name="reg_address_moo" value={formData.reg_address_moo} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">ซอย</label>
                        <input type="text" name="reg_address_soi" value={formData.reg_address_soi} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">ถนน</label>
                        <input type="text" name="reg_address_street" value={formData.reg_address_street} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">จังหวัด</label>
                        <select name="reg_address_province" value={formData.reg_address_province} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm">
                            <option value="">เลือกจังหวัด</option>
                            <option value="94">ปัตตานี</option>
                            <option value="95">ยะลา</option>
                            <option value="96">นราธิวาส</option>
                            <option value="90">สงขลา</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">อำเภอ</label>
                        {districts.length > 0 ? (
                            <select name="reg_address_district" value={formData.reg_address_district} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm">
                                <option value="">เลือกอำเภอ</option>
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        ) : (
                            <input type="text" name="reg_address_district" value={formData.reg_address_district} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" placeholder="โปรดพิมพ์ชื่ออำเภอ" />
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">ตำบล</label>
                        {subdistricts.length > 0 ? (
                            <select name="reg_address_subdistrict" value={formData.reg_address_subdistrict} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm">
                                <option value="">เลือกตำบล</option>
                                {subdistricts.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        ) : (
                            <input type="text" name="reg_address_subdistrict" value={formData.reg_address_subdistrict} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" placeholder="โปรดพิมพ์ชื่อตำบล" />
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">รหัสไปรษณีย์</label>
                        <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" />
                    </div>
                </div>
            </div>
        )}

        {/* Tab 3: Education */}
        {activeTab === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">ระดับการศึกษา</label>
                        <select name="reg_education" value={formData.reg_education} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm">
                            <option value="">เลือกระดับการศึกษา</option>
                            <option value="01">ไม่ได้รับการศึกษา</option>
                            <option value="02">ประถมศึกษา</option>
                            <option value="03">มัธยมศึกษาตอนต้น</option>
                            <option value="04">มัธยมศึกษาตอนปลาย</option>
                            <option value="05">ปวช.</option>
                            <option value="06">ปวส./ปวท.</option>
                            <option value="07">ปริญญาตรี</option>
                            <option value="08">สูงกว่าปริญญาตรี</option>
                            <option value="09">อื่นๆ</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">สาขาวิชา</label>
                        <input type="text" name="reg_education_section" value={formData.reg_education_section} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm" placeholder="เช่น บริหารธุรกิจ, ช่างยนต์" />
                    </div>
                </div>
            </div>
        )}

        {/* Tab 4: Work */}
        {activeTab === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">สถานะการทำงาน</label>
                    <select name="work_state" value={formData.work_state} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm">
                        <option value="0">ว่างงาน</option>
                        <option value="1">ทำงานแล้ว</option>
                    </select>
                </div>

                {formData.work_state === "1" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                        <div className="md:col-span-2 text-sm font-bold text-slate-800 border-b pb-2">รายละเอียดการทำงาน</div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">สถานะการประกอบอาชีพ</label>
                            <select name="work_section" value={formData.work_section} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm">
                                <option value="">เลือก...</option>
                                <option value="1">นายจ้าง</option>
                                <option value="2">ลูกจ้างรัฐบาล</option>
                                <option value="3">ลูกจ้างเอกชน</option>
                                <option value="4">ประกอบธุรกิจส่วนตัว</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">รายได้เฉลี่ย/เดือน</label>
                            <select name="work_salary" value={formData.work_salary} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm">
                                <option value="">เลือก...</option>
                                <option value="1 - 5,000 บาท">1 - 5,000 บาท</option>
                                <option value="5,001 - 9,000 บาท">5,001 - 9,000 บาท</option>
                                <option value="9,001 - 15,000 บาท">9,001 - 15,000 บาท</option>
                                <option value="15,001 - 20,000 บาท">15,001 - 20,000 บาท</option>
                                <option value="20,001 - 30,000 บาท">20,001 - 30,000 บาท</option>
                                <option value="30,001 - 40,000 บาท">30,001 - 40,000 บาท</option>
                                <option value="40,001 บาทขึ้นไป">40,001 บาทขึ้นไป</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">อาชีพหลัก</label>
                            <input type="text" name="work_occupation" value={formData.work_occupation} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">ตำแหน่ง</label>
                            <input type="text" name="work_position" value={formData.work_position} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-600 mb-1 block">สถานที่ทำงาน/บริษัท</label>
                            <input type="text" name="work_place" value={formData.work_place} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm" />
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <label className="text-xs font-bold text-slate-600 mb-1 block">ประเภทการว่างงาน</label>
                        <select name="unwork_type" value={formData.unwork_type} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm">
                            <option value="">เลือก...</option>
                            <option value="กำลังศึกษาอยู่">กำลังศึกษาอยู่</option>
                            <option value="จบการศึกษาใหม่">จบการศึกษาใหม่</option>
                            <option value="ถูกเลิกจ้าง">ถูกเลิกจ้าง</option>
                            <option value="ผู้พ้นโทษ">ผู้พ้นโทษ</option>
                            <option value="ผู้ผ่านการบำบัดยาเสพติด">ผู้ผ่านการบำบัดยาเสพติด</option>
                        </select>
                    </div>
                )}
            </div>
        )}

        {/* Tab 5: Needs */}
        {activeTab === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">ความต้องการด้านอาชีพ</label>
                    <select name="info_findjob" value={formData.info_findjob} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-white text-sm">
                        <option value="0">ต้องการฝึกอาชีพ/ทดสอบมาตรฐาน</option>
                        <option value="1">ต้องการหางานทำ</option>
                    </select>
                </div>
                {formData.info_findjob === "1" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">ประเภทงานที่สนใจ</label>
                            <input type="text" name="info_findjob_detail" value={formData.info_findjob_detail} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">อุตสาหกรรมที่สนใจ</label>
                            <input type="text" name="info_findjob_detail_industry" value={formData.info_findjob_detail_industry} onChange={handleChange} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm" />
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 p-4 bg-white border-t border-slate-200 rounded-b-3xl">
          <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">ยกเลิก</button>
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex justify-center items-center gap-2">
              {saving ? <span className="loading loading-spinner loading-sm"></span> : <i className="fa-solid fa-floppy-disk"></i>} บันทึกข้อมูล
          </button>
      </div>
    </form>
  );
}
