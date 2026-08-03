import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized — กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
            return NextResponse.json({ error: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
        }

        const userId = session.user.id;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
        }

        // If currentPassword is provided, verify it (unless user was forced via mustChangePassword with default)
        if (currentPassword) {
            const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                return NextResponse.json({ error: "รหัสผ่านเดิมไม่ถูกต้อง" }, { status: 400 });
            }
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                mustChangePassword: false, // Password updated, clear flag!
            },
        });

        return NextResponse.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย" });
    } catch (error: any) {
        console.error("[change-password POST] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to change password" }, { status: 500 });
    }
}
