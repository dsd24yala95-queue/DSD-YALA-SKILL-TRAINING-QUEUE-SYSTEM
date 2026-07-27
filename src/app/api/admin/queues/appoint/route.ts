import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { queueId, appointedDate, appointedLocation } = await req.json();

        if (!queueId || !appointedDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const booking = await prisma.queueBooking.update({
            where: { id: queueId },
            data: { 
                status: "approved", // UI uses "approved" for appointed status
                appointedDate: new Date(appointedDate),
                isAcknowledged: false
            },
            include: { user: true }
        });

        // 1. Create In-App Notification
        const formattedDate = new Date(appointedDate).toLocaleDateString("th-TH", {
            year: "numeric", month: "long", day: "numeric"
        });

        await prisma.notification.create({
            data: {
                userId: booking.userId,
                title: "นัดหมายเข้ารับบริการ",
                message: `ท่านได้รับการนัดหมายสำหรับ ${booking.itemName} วันที่ ${formattedDate}. กรุณากดยืนยัน`,
                type: "appointment",
                metadata: JSON.stringify({ 
                    queueId: booking.id,
                    appointedDate: appointedDate,
                    location: appointedLocation
                })
            }
        });

        // 2. Send LINE Push Message
        if (booking.user.lineUserId && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
            try {
                // We will use the Push API
                const url = "https://api.line.me/v2/bot/message/push";
                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                };
                
                // Add a simple text message with a CTA
                // Future optimization: Use a Flex Message
                const body = {
                    to: booking.user.lineUserId,
                    messages: [
                        {
                            type: "text",
                            text: `ท่านได้รับการนัดหมายวันที่ ${formattedDate}\nรายการ: ${booking.itemName}\n\nกรุณาเข้าสู่ระบบเพื่อยืนยันการนัดหมายและเพิ่มลงปฏิทิน`
                        }
                    ]
                };

                await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
            } catch (e) {
                console.error("Failed to send LINE message", e);
            }
        }

        return NextResponse.json({ success: true, booking });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
