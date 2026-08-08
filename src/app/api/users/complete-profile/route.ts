import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized — กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();
        const { phoneNumber, profileImage } = body;

        // Validation
        if (!phoneNumber || typeof phoneNumber !== "string") {
            return NextResponse.json({ error: "กรุณาระบุเบอร์โทรศัพท์ 10 หลัก" }, { status: 400 });
        }

        const cleanedPhone = phoneNumber.replace(/\D/g, "");
        if (!/^0\d{9}$/.test(cleanedPhone)) {
            return NextResponse.json({ error: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก (เช่น 0812345678)" }, { status: 400 });
        }

        const updateData: any = {
            phoneNumber: cleanedPhone,
        };

        if (profileImage && typeof profileImage === "string" && profileImage.trim()) {
            updateData.profileImage = profileImage.trim();
        }

        // Update User Profile in Prisma DB
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                profileImage: true,
                idCard: true,
                role: true,
            }
        });

        return NextResponse.json({
            success: true,
            message: "อัปเดตข้อมูลโปรไฟล์สมบูรณ์แล้ว",
            user: updatedUser
        });
    } catch (error: any) {
        console.error("Complete Profile API Error:", error);
        return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
    }
}
