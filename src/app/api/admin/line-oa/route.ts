import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushMessage, generateMessageTemplate } from "@/lib/services/line-service";

// ===== GET: Fetch LINE OA Dashboard Data =====
export async function GET() {
    try {
        // 1. Stats: Total members vs linked
        const totalMembers = await prisma.user.count({ where: { role: "member" } });
        const linkedMembers = await prisma.user.count({
            where: { role: "member", lineUserId: { not: null } },
        });
        const unlinkedMembers = totalMembers - linkedMembers;
        const linkRate = totalMembers > 0 ? Math.round((linkedMembers / totalMembers) * 100) : 0;

        // 2. Linked users list
        const linkedUsers = await prisma.user.findMany({
            where: { lineUserId: { not: null } },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                lineUserId: true,
                memberId: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 200,
        });

        // 3. Recent notifications (last 200)
        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: "desc" },
            take: 200,
            include: {
                user: { select: { fullName: true, phoneNumber: true } },
            },
        });

        const notificationLogs = notifications.map((n) => ({
            id: n.id,
            userId: n.userId,
            userName: n.user?.fullName || n.user?.phoneNumber || "-",
            title: n.title,
            message: n.message,
            type: n.type,
            read: n.read,
            createdAt: n.createdAt.toISOString(),
        }));

        // 4. Auto-Reply Settings (from SystemSetting)
        let autoReplySettings = null;
        const setting = await prisma.systemSetting.findUnique({
            where: { key: "line_auto_reply" },
        });
        if (setting) {
            try {
                autoReplySettings = JSON.parse(setting.value);
            } catch {}
        }

        return NextResponse.json({
            stats: { totalMembers, linkedMembers, unlinkedMembers, linkRate },
            linkedUsers,
            notifications: notificationLogs,
            autoReplySettings,
        });
    } catch (error: any) {
        console.error("LINE OA GET Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// ===== POST: Broadcast Message =====
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, target, template, message, title } = body;

        if (action !== "broadcast") {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        if (!message?.trim()) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Find target users with lineUserId
        let whereClause: any = { lineUserId: { not: null } };

        if (target === "training") {
            // Users who have training bookings
            const trainingUserIds = await prisma.queueBooking.findMany({
                where: { bookingType: "training" },
                select: { userId: true },
                distinct: ["userId"],
            });
            const ids = trainingUserIds.map((b) => b.userId);
            whereClause = { ...whereClause, id: { in: ids } };
        } else if (target === "testing") {
            const testingUserIds = await prisma.queueBooking.findMany({
                where: { bookingType: "test" },
                select: { userId: true },
                distinct: ["userId"],
            });
            const ids = testingUserIds.map((b) => b.userId);
            whereClause = { ...whereClause, id: { in: ids } };
        }

        const targetUsers = await prisma.user.findMany({
            where: whereClause,
            select: { id: true, lineUserId: true, fullName: true },
        });

        let sent = 0;
        let failed = 0;
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

        if (!token) {
            return NextResponse.json({ error: "LINE_CHANNEL_ACCESS_TOKEN not configured" }, { status: 500 });
        }

        for (const user of targetUsers) {
            if (!user.lineUserId) continue;

            try {
                let msgPayload;

                if (template === "text") {
                    msgPayload = { type: "text" as const, text: message };
                } else {
                    // Use Flex Message template
                    const appUrl = process.env.NEXTAUTH_URL || "https://dsd-yala-skill-training-queue-system.onrender.com";
                    const color = template === "announcement" ? "#2563EB" : template === "enrollment" ? "#059669" : "#D97706";
                    const label = template === "announcement" ? "ข่าวประชาสัมพันธ์" : template === "enrollment" ? "เปิดรับสมัคร" : "แจ้งเตือนทั่วไป";

                    msgPayload = {
                        type: "flex" as const,
                        altText: title || message.substring(0, 40),
                        contents: {
                            type: "bubble",
                            header: {
                                type: "box",
                                layout: "vertical",
                                backgroundColor: color,
                                contents: [
                                    { type: "text", text: `📢 ${label}`, color: "#FFFFFF", weight: "bold", size: "lg", align: "center" },
                                    { type: "text", text: "สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา", color: "#FFFFFFCC", size: "xs", align: "center", margin: "xs" },
                                ],
                            },
                            body: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    { type: "text", text: title || "ประกาศจาก สพร.24 ยะลา", weight: "bold", size: "sm", wrap: true },
                                    { type: "text", text: message, size: "xs", color: "#64748B", margin: "sm", wrap: true },
                                ],
                            },
                            footer: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    {
                                        type: "button",
                                        action: { type: "uri", label: "ดูรายละเอียด", uri: `${appUrl}/news` },
                                        style: "primary",
                                        color: color,
                                    },
                                ],
                            },
                        },
                    };
                }

                const response = await fetch("https://api.line.me/v2/bot/message/push", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        to: user.lineUserId,
                        messages: [msgPayload],
                    }),
                });

                if (response.ok) {
                    sent++;
                } else {
                    failed++;
                    console.error(`Failed to send to ${user.lineUserId}:`, await response.text());
                }
            } catch (err) {
                failed++;
                console.error(`Error sending to ${user.lineUserId}:`, err);
            }
        }

        // Log broadcast as notification for audit
        try {
            await prisma.systemSetting.upsert({
                where: { key: "last_broadcast" },
                update: {
                    value: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        target,
                        template,
                        message: message.substring(0, 200),
                        sent,
                        failed,
                    }),
                },
                create: {
                    key: "last_broadcast",
                    value: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        target,
                        template,
                        message: message.substring(0, 200),
                        sent,
                        failed,
                    }),
                },
            });
        } catch {}

        return NextResponse.json({ success: true, sent, failed, total: targetUsers.length });
    } catch (error: any) {
        console.error("LINE OA POST Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// ===== PUT: Update Auto-Reply Settings =====
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { autoReplySettings } = body;

        if (!autoReplySettings) {
            return NextResponse.json({ error: "Missing autoReplySettings" }, { status: 400 });
        }

        await prisma.systemSetting.upsert({
            where: { key: "line_auto_reply" },
            update: { value: JSON.stringify(autoReplySettings) },
            create: { key: "line_auto_reply", value: JSON.stringify(autoReplySettings) },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("LINE OA PUT Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// ===== DELETE: Unlink LINE User ID =====
export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { lineUserId: null },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("LINE OA DELETE Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
