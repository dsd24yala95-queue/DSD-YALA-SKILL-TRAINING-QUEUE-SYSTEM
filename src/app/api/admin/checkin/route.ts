import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkStaffAuth } from "@/lib/auth-guard";

export async function POST(req: Request) {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const { idCard } = body;

        if (!idCard || typeof idCard !== "string" || !idCard.trim()) {
            return NextResponse.json({ error: "กรุณาระบุเลขบัตรประชาชนหรือเบอร์โทรศัพท์" }, { status: 400 });
        }

        const cleanSearchTerm = idCard.replace(/[^0-9]/g, "");
        if (!cleanSearchTerm) {
            return NextResponse.json({ error: "รูปแบบเลขบัตรประชาชนหรือเบอร์โทรศัพท์ไม่ถูกต้อง" }, { status: 400 });
        }

        // Find user by phone
        const user = await prisma.user.findFirst({
            where: {
                phoneNumber: cleanSearchTerm
            }
        });

        let targetUser = user;

        if (!targetUser) {
            // Search in profileJson manually if idCard isn't populated
            const users = await prisma.user.findMany();
            const matchedUser = users.find(u => {
                if (u.phoneNumber === cleanSearchTerm) return true;
                if (u.profileJson) {
                    try {
                        const j = JSON.parse(u.profileJson);
                        if (j.reg_citizenid === cleanSearchTerm) return true;
                        if (j.reg_telephone === cleanSearchTerm) return true;
                    } catch (e) {}
                }
                return false;
            });
            
            if (!matchedUser) {
                return NextResponse.json({ error: "ไม่พบผู้ใช้งานด้วยข้อมูลนี้" }, { status: 404 });
            }
            targetUser = matchedUser;
        }

        // Find today's bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const booking = await prisma.queueBooking.findFirst({
            where: {
                userId: targetUser.id,
                status: {
                    in: ["pending", "approved", "confirmed"]
                },
                bookingDate: {
                    gte: today,
                    lt: tomorrow
                }
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        if (!booking) {
            return NextResponse.json({ error: "ไม่พบคิวที่ทำการจองไว้สำหรับวันนี้" }, { status: 404 });
        }

        // Update status to checked_in
        const updatedBooking = await prisma.queueBooking.update({
            where: { id: booking.id },
            data: { status: "checked_in" }
        });

        // Add a notification for the user
        await prisma.notification.create({
            data: {
                userId: targetUser.id,
                title: "รายงานตัวสำเร็จ",
                message: `คุณได้รายงานตัวสำหรับ ${booking.itemName} แล้ว กรุณารอเรียกคิวที่หน้างาน`
            }
        });

        return NextResponse.json({ success: true, booking: updatedBooking, user: targetUser });
    } catch (error: any) {
        console.error("Check-in error:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
    }
}
