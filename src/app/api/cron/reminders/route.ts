import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushMessage } from "@/lib/services/line-service";

// Security: Vercel / Cloud Provider sends an Authorization header with the CRON_SECRET
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

        // Fetch all confirmed/approved bookings that have an appointed date
        const bookings = await prisma.queueBooking.findMany({
            where: {
                status: { in: ["approved", "confirmed"] },
                appointedDate: { not: null }
            },
            include: { user: true }
        });

        const results = {
            d3_reminders_sent: 0,
            d1_reminders_sent: 0,
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
                // D-3 Reminder
                const exists = await checkNotificationSent(booking.userId, booking.id, "reminder_d3");
                if (!exists) {
                    await sendReminder(
                        booking, 
                        "reminder_d3", 
                        "📅 แจ้งเตือน: อีก 3 วันจะถึงวันนัดหมาย", 
                        `อีก 3 วันจะถึงกำหนดนัดหมาย ${booking.itemName} ในวันที่ ${formattedDate}`
                    );
                    results.d3_reminders_sent++;
                }
            } else if (diffDays === 1) {
                // D-1 Reminder (1 day before)
                const exists = await checkNotificationSent(booking.userId, booking.id, "reminder_d1");
                if (!exists) {
                    await sendReminder(
                        booking, 
                        "reminder_d1", 
                        "🚨 แจ้งเตือน: พรุ่งนี้มีนัดหมาย", 
                        `พรุ่งนี้ท่านมีกำหนดนัดหมาย ${booking.itemName} ในวันที่ ${formattedDate}`
                    );
                    results.d1_reminders_sent++;
                }
            } else if (diffDays === 0) {
                // D-0 Reminder (Today)
                const exists = await checkNotificationSent(booking.userId, booking.id, "reminder_d0");
                if (!exists) {
                    await sendReminder(
                        booking, 
                        "reminder_d0", 
                        "🔔 แจ้งเตือน: วันนี้ท่านมีนัดหมาย", 
                        `วันนี้ท่านมีกำหนดนัดหมาย ${booking.itemName} เวลา ${formattedDate} ณ สพร.24 ยะลา`
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
            metadata: { contains: queueId }
        }
    });
    return !!existing;
}

// Helper to create in-app notification and push LINE Flex Card
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

    // 2. LINE Push Flex Card
    const lineUserId = booking.user?.lineUserId;
    if (lineUserId) {
        try {
            const formattedDate = booking.appointedDate
                ? new Date(booking.appointedDate).toLocaleDateString("th-TH", {
                    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                })
                : "ตามนัดหมาย";

            await pushMessage(lineUserId, "appointment", {
                itemName: booking.itemName,
                appointedDate: formattedDate,
                location: "สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา",
                message: textMessage
            });
        } catch (e) {
            console.error("Failed to push LINE Flex reminder:", e);
        }
    }
}
