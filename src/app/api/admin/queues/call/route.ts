import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/queues/call — Admin calls a member's queue
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { queueId, userId, queueNumber, itemName } = body;

        if (!queueId || !userId) {
            return NextResponse.json({ error: "Missing queueId or userId" }, { status: 400 });
        }

        // Check if there's already an unread queue_call notification for this queue
        const existing = await prisma.notification.findFirst({
            where: {
                userId,
                type: "queue_call",
                read: false,
                metadata: { contains: queueId }
            }
        });

        let callCount = 1;
        let finalNotification;

        if (existing) {
            // Parse existing metadata to increment callCount
            try {
                const meta = JSON.parse(existing.metadata || "{}");
                callCount = (meta.callCount || 1) + 1;
            } catch (e) {}

            // Update existing notification: bump callCount + reset createdAt to "now"
            finalNotification = await prisma.notification.update({
                where: { id: existing.id },
                data: {
                    read: false,
                    metadata: JSON.stringify({
                        queueId,
                        queueNumber,
                        itemName,
                        callCount,
                        calledAt: new Date().toISOString()
                    })
                }
            });
        } else {
            // Create a new queue_call notification
            finalNotification = await prisma.notification.create({
                data: {
                    userId,
                    title: "ถึงคิวของท่านแล้ว!",
                    message: `กรุณาไปติดต่อเจ้าหน้าที่ที่จุดให้บริการ`,
                    type: "queue_call",
                    read: false,
                    metadata: JSON.stringify({
                        queueId,
                        queueNumber,
                        itemName,
                        callCount: 1,
                        calledAt: new Date().toISOString()
                    })
                }
            });
        }

        // Fetch User to check lineUserId
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lineUserId: true, fullName: true }
        });

        // Send LINE Flex Message
        if (user?.lineUserId && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
            try {
                const url = "https://api.line.me/v2/bot/message/push";
                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                };
                
                // Blue Card Design Flex Message
                const flexMessage = {
                    type: "flex",
                    altText: `ถึงคิวของคุณแล้ว: คิวที่ ${queueNumber}`,
                    contents: {
                        type: "bubble",
                        header: {
                            type: "box",
                            layout: "vertical",
                            backgroundColor: "#2563EB", // Blue-600
                            contents: [
                                {
                                    type: "text",
                                    text: "ถึงคิวของคุณแล้ว!",
                                    color: "#FFFFFF",
                                    weight: "bold",
                                    size: "xl",
                                    align: "center"
                                }
                            ]
                        },
                        body: {
                            type: "box",
                            layout: "vertical",
                            spacing: "md",
                            contents: [
                                {
                                    type: "text",
                                    text: `คิวหมายเลข: ${queueNumber}`,
                                    weight: "bold",
                                    size: "xxl",
                                    color: "#1E3A8A",
                                    align: "center"
                                },
                                {
                                    type: "text",
                                    text: `คุณ ${user.fullName || "ผู้เข้ารับบริการ"}`,
                                    size: "md",
                                    color: "#475569",
                                    align: "center"
                                },
                                {
                                    type: "text",
                                    text: `รายการ: ${itemName || "-"}`,
                                    size: "sm",
                                    color: "#64748B",
                                    wrap: true,
                                    align: "center"
                                }
                            ]
                        },
                        footer: {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "button",
                                    style: "primary",
                                    color: "#2563EB",
                                    action: {
                                        type: "uri",
                                        label: "เปิดระบบ",
                                        uri: process.env.NEXT_PUBLIC_SITE_URL || "https://dsd-yala.vercel.app/"
                                    }
                                }
                            ]
                        }
                    }
                };

                const bodyPayload = {
                    to: user.lineUserId,
                    messages: [flexMessage]
                };

                await fetch(url, { method: "POST", headers, body: JSON.stringify(bodyPayload) });
            } catch (e) {
                console.error("Failed to send LINE Flex message", e);
            }
        }

        // --- NEW: Near Queue Warning ---
        // Find the current booking to get its itemId
        const currentBooking = await prisma.queueBooking.findUnique({
            where: { id: queueId }
        });

        if (currentBooking) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const nearQueueNumber = queueNumber + 5;
            
            const nearBooking = await prisma.queueBooking.findFirst({
                where: {
                    itemId: currentBooking.itemId,
                    bookingDate: { gte: today, lt: tomorrow },
                    queueNumber: nearQueueNumber,
                    status: { in: ["pending", "approved", "checked_in"] }
                },
                include: { user: true }
            });

            if (nearBooking?.user?.lineUserId && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
                try {
                    const url = "https://api.line.me/v2/bot/message/push";
                    const headers = {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                    };
                    
                    const nearFlexMessage = {
                        type: "flex",
                        altText: "แจ้งเตือน: ใกล้ถึงคิวของคุณแล้ว!",
                        contents: {
                            type: "bubble",
                            header: {
                                type: "box",
                                layout: "vertical",
                                backgroundColor: "#F59E0B", // Amber-500
                                contents: [
                                    {
                                        type: "text",
                                        text: "เตรียมตัวให้พร้อม!",
                                        color: "#FFFFFF",
                                        weight: "bold",
                                        size: "xl",
                                        align: "center"
                                    }
                                ]
                            },
                            body: {
                                type: "box",
                                layout: "vertical",
                                spacing: "md",
                                contents: [
                                    {
                                        type: "text",
                                        text: `อีก 5 คิวจะถึงคิวของคุณ`,
                                        weight: "bold",
                                        size: "lg",
                                        color: "#B45309",
                                        align: "center"
                                    },
                                    {
                                        type: "text",
                                        text: `คิวของคุณ: ${nearQueueNumber}`,
                                        size: "xl",
                                        weight: "bold",
                                        color: "#1E293B",
                                        align: "center"
                                    },
                                    {
                                        type: "text",
                                        text: `รายการ: ${nearBooking.itemName}`,
                                        size: "sm",
                                        color: "#64748B",
                                        wrap: true,
                                        align: "center"
                                    },
                                    {
                                        type: "text",
                                        text: `กรุณากลับมายังบริเวณจุดรอรับบริการ`,
                                        size: "xs",
                                        color: "#EF4444",
                                        wrap: true,
                                        align: "center",
                                        margin: "lg"
                                    }
                                ]
                            }
                        }
                    };

                    await fetch(url, { 
                        method: "POST", 
                        headers, 
                        body: JSON.stringify({
                            to: nearBooking.user.lineUserId,
                            messages: [nearFlexMessage]
                        }) 
                    });
                } catch (e) {
                    console.error("Failed to send Near Queue LINE message", e);
                }
            }
        }

        return NextResponse.json({ success: true, callCount, notification: finalNotification });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
