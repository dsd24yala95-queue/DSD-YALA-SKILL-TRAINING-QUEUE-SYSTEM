import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET /api/users/line-status?userId=xxx
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                phoneNumber: true,
                lineUserId: true,
                fullName: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            isLinked: Boolean(user.lineUserId && user.lineUserId.trim() !== ""),
            lineUserId: user.lineUserId || null,
            phoneNumber: user.phoneNumber,
        });
    } catch (error: any) {
        console.error("Error fetching LINE status:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/users/line-status (Unlink LINE Account)
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId") || (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized or missing userId" }, { status: 401 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { lineUserId: null }
        });

        return NextResponse.json({ success: true, message: "ยกเลิกการเชื่อมต่อ LINE OA เรียบร้อยแล้ว" });
    } catch (error: any) {
        console.error("Error unlinking LINE status:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
