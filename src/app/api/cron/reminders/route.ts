import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Security: Vercel sends an Authorization header with the CRON_SECRET
// For local testing, we can bypass or pass the secret in the header.
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        // Fetch all confirmed bookings that have an appointed date
        const bookings = await prisma.queueBooking.findMany({
            where: {
                status: "confirmed",
                appointedDate: { not: null }
            },
            include: { user: true }
        });

        const results = {
            d3_reminders_sent: 0,
            d0_reminders_sent: 0,
            errors: [] as string[]
        };

        for (const booking of bookings) {
            if (!booking.appointedDate) continue;

            const aptDate = new Date(booking.appointedDate);
            const aptDateStart = new Date(aptDate);
            aptDateStart.setHours(0, 0, 0, 0);

            // Calculate diff in days
            const diffTime = aptDateStart.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const formattedDate = aptDate.toLocaleDateString("th-TH", {
                year: "numeric", month: "long", day: "numeric",
                hour: "2-digit", minute: "2-digit"
            });

            if (diffDays === 3) {
                // Check if D-3 reminder was already sent
                const exists = await checkNotificationSent(booking.userId, booking.id, "reminder_d3");
                if (!exists) {
                    await sendReminder(
                        booking, 
                        "reminder_d3", 
                        "แจ้งเตือน: ใกล้ถึงวันนัดหมายของท่าน", 
                        `อีก 3 วันจะถึงกำหนดนัดหมาย ${booking.itemName} ของท่าน ในวันที่ ${formattedDate} กรุณาเตรียมตัวให้พร้อม`
                    );
                    results.d3_reminders_sent++;
                }
            } else if (diffDays === 0) {
                // Check if D-0 reminder was already sent
                const exists = await checkNotificationSent(booking.userId, booking.id, "reminder_d0");
                if (!exists) {
                    await sendReminder(
                        booking, 
                        "reminder_d0", 
                        "แจ้งเตือน: วันนี้ท่านมีนัดหมาย", 
                        `วันนี้ท่านมีกำหนดนัดหมาย ${booking.itemName} เวลา ${formattedDate} กรุณามาติดต่อเจ้าหน้าที่ ณ สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา`
                    );
                    results.d0_reminders_sent++;
                }
            }
        }

        return NextResponse.json({ success: true, ...results });
    } catch (error: any) {
        console.error("Cron Reminder Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper to check if a notification of a specific type was already created for this queue
async function checkNotificationSent(userId: string, queueId: string, type: string) {
    const existing = await prisma.notification.findFirst({
        where: {
            userId: userId,
            type: type,
            metadata: { contains: queueId } // A simple text match for the queueId in the JSON metadata
        }
    });
    return !!existing;
}

// Helper to create in-app notification and push to LINE
async function sendReminder(booking: any, type: string, title: string, textMessage: string) {
    // 1. In-App Notification
    await prisma.notification.create({
        data: {
            userId: booking.userId,
            title: title,
            message: textMessage,
            type: type,
            metadata: JSON.stringify({ queueId: booking.id })
        }
    });

    // 2. LINE Push Message
    if (booking.user?.lineUserId && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
        try {
            const url = "https://api.line.me/v2/bot/message/push";
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
            };
            const body = {
                to: booking.user.lineUserId,
                messages: [{ type: "text", text: `[${title}]\n\n${textMessage}` }]
            };
            await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
        } catch (e) {
            console.error("Failed to send LINE reminder", e);
        }
    }
}
