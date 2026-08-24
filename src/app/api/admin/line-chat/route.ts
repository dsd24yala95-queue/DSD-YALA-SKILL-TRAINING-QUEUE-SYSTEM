import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===== GET: Fetch Active Conversations & Chat History =====
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get("sessionId");

        if (sessionId) {
            // Fetch specific chat session messages
            const session = await prisma.lineChatSession.findUnique({
                where: { id: sessionId },
            });

            if (!session) {
                return NextResponse.json({ error: "Session not found" }, { status: 404 });
            }

            // Reset unread count for admin
            await prisma.lineChatSession.update({
                where: { id: sessionId },
                data: { unreadCount: 0 },
            });

            // Mark unread messages as read
            await prisma.lineChatMessage.updateMany({
                where: { sessionId, read: false },
                data: { read: true },
            });

            const messages = await prisma.lineChatMessage.findMany({
                where: { sessionId },
                orderBy: { createdAt: "asc" },
            });

            // Get bound user details if available
            const boundUser = await prisma.user.findUnique({
                where: { lineUserId: session.lineUserId },
                select: {
                    id: true,
                    fullName: true,
                    phoneNumber: true,
                    memberId: true,
                    profileImage: true,
                    role: true,
                },
            });

            return NextResponse.json({
                session,
                messages,
                boundUser,
            });
        }

        // Fetch all active LINE chat sessions
        const sessions = await prisma.lineChatSession.findMany({
            orderBy: { lastMessageAt: "desc" },
            take: 100,
        });

        // Also fetch total unread count across all sessions
        const totalUnread = sessions.reduce((sum, s) => sum + s.unreadCount, 0);

        return NextResponse.json({
            sessions,
            totalUnread,
        });
    } catch (error: any) {
        console.error("LINE Chat GET Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// ===== POST: Send Admin Reply Message to LINE =====
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sessionId, message, adminName } = body;

        if (!sessionId || !message?.trim()) {
            return NextResponse.json({ error: "sessionId and message are required" }, { status: 400 });
        }

        const session = await prisma.lineChatSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) {
            return NextResponse.json({ error: "LINE_CHANNEL_ACCESS_TOKEN is missing" }, { status: 500 });
        }

        // Push message to LINE Messaging API
        const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                to: session.lineUserId,
                messages: [{ type: "text", text: message.trim() }],
            }),
        });

        if (!lineRes.ok) {
            const errData = await lineRes.json().catch(() => ({ message: "Failed to send message to LINE" }));
            console.error("LINE Push Error:", errData);
            return NextResponse.json({ error: errData.message || "ไม่สามารถส่งข้อความไปยัง LINE ได้" }, { status: 500 });
        }

        // Save admin message to database
        const createdMessage = await prisma.lineChatMessage.create({
            data: {
                sessionId: session.id,
                sender: "admin",
                senderName: adminName || "เจ้าหน้าที่ สพร.24 ยะลา",
                message: message.trim(),
                read: true,
            },
        });

        // Update session last message
        await prisma.lineChatSession.update({
            where: { id: session.id },
            data: {
                lastMessage: message.trim(),
                lastMessageAt: new Date(),
                unreadCount: 0,
            },
        });

        return NextResponse.json({ success: true, message: createdMessage });
    } catch (error: any) {
        console.error("LINE Chat POST Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
