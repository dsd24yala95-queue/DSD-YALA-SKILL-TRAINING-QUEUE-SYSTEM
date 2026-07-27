import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { idCard } = await req.json();

        if (!idCard) {
            return NextResponse.json({ error: "กรุณาระบุเลขบัตรประชาชนหรือเบอร์โทร" }, { status: 400 });
        }

        // Find user by phone (the schema doesn't have idCard as direct field, we search by phone first)
        const user = await prisma.user.findFirst({
            where: {
                phoneNumber: idCard
            }
        });

        if (!user) {
            // Search in profileJson manually if idCard isn't populated
            const users = await prisma.user.findMany();
            const matchedUser = users.find(u => {
                if (u.phoneNumber === idCard) return true;
                if (u.profileJson) {
                    try {
                        const j = JSON.parse(u.profileJson);
                        if (j.reg_citizenid === idCard) return true;
                        if (j.reg_telephone === idCard) return true;
                    } catch (e) {}
                }
                return false;
            });
            
            if (!matchedUser) {
                return NextResponse.json({ error: "ไม่พบผู้ใช้งานด้วยข้อมูลนี้" }, { status: 404 });
            }
            // Use the matched user
            var targetUser = matchedUser;
        } else {
            var targetUser = user;
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
