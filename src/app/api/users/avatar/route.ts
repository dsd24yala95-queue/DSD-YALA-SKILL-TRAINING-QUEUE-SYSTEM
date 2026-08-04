export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { uploadToSupabaseBucket } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized — กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const targetUserId = (formData.get("userId") as string) || session.user.id;

        if (!file) {
            return NextResponse.json({ error: "กรุณาเลือกไฟล์รูปภาพที่ต้องการอัปโหลด" }, { status: 400 });
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, GIF, HEIC)" }, { status: 400 });
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "ขนาดไฟล์รูปภาพต้องไม่เกิน 10MB" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const extension = file.name.split(".").pop() || "png";
        const filename = `avatar_${targetUserId}_${Date.now()}.${extension}`;

        const uploadResult = await uploadToSupabaseBucket(buffer, "avatars", filename, file.type);

        if (uploadResult.error || !uploadResult.url) {
            return NextResponse.json({ error: uploadResult.error || "เกิดข้อผิดพลาดในการอัปโหลดไปยัง Supabase Cloud Storage" }, { status: 500 });
        }

        const avatarUrl = uploadResult.url;

        // Update profileImage in database
        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { profileImage: avatarUrl },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                profileImage: true,
            }
        });

        return NextResponse.json({
            success: true,
            message: "อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว",
            avatarUrl,
            user: updatedUser
        });
    } catch (error: any) {
        console.error("[Avatar Upload API Error]:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
