import re

with open("src/app/admin/members/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Import
import_statement = "import FullMemberEditForm from '@/components/admin/FullMemberEditForm';\n"
if "import FullMemberEditForm" not in content:
    content = re.sub(r'(import React.*?;)', r'\1\n' + import_statement, content)

# 2. Update handleEditSubmit to accept formData
old_handle_edit = r'const handleEditSubmit = async \(e: React\.FormEvent\) => \{.*?setSaving\(false\);\s*\};'

new_handle_edit = """const handleEditSubmit = async (formData: any) => {
        if (!editMember) return;
        setSaving(true);
        try {
            const fullName = `${resolveTitle(formData.reg_title || "001")}${formData.reg_firstname} ${formData.reg_lastname}`.trim();

            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editMember.id,
                    fullName,
                    phoneNumber: formData.reg_telephone,
                    email: formData.reg_email,
                    profileJson: JSON.stringify(formData)
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

# 3. Replace the Modal body with <FullMemberEditForm>
# The old form starts with <form onSubmit={handleEditSubmit} className="space-y-6">
old_form = r'<form onSubmit=\{handleEditSubmit\}.*?</form>'

new_form = """<div className="h-[80vh]">
                              <FullMemberEditForm 
                                  initialData={editMember} 
                                  onSave={handleEditSubmit} 
                                  onCancel={() => setEditMember(null)} 
                                  saving={saving} 
                              />
                          </div>"""

content = re.sub(old_form, new_form, content, flags=re.DOTALL)

# 4. Remove the title and X button from the original modal, as the new form has its own layout or we can keep it.
# Wait, FullMemberEditForm has its own Footer with Cancel/Save, so the original X button is fine, but maybe we should remove the original title to save space.
# Actually, keeping it is fine.
# Let's adjust the motion.div to not have padding, so the tabs go edge to edge.
old_motion_div = r'className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl p-6 relative max-h-\[90vh\] overflow-y-auto"'
new_motion_div = 'className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl relative overflow-hidden flex flex-col"'

content = re.sub(old_motion_div, new_motion_div, content, flags=re.DOTALL)

# Remove the title block because we want tabs at the top
old_title_block = r'<div className="flex items-center justify-between mb-5">.*?</div>'
# Wait, this might match too much.
# Let's just do it manually.

with open("src/app/admin/members/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
