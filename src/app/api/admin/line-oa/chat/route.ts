import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkStaffAuth } from "@/lib/auth-guard";

// GET: Fetch all active LINE chat sessions and messages
export async function GET() {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const sessions = await prisma.lineChatSession.findMany({
            orderBy: { lastMessageAt: "desc" },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" }
                }
            }
        });

        return NextResponse.json({ sessions });
    } catch (error: any) {
        console.error("GET Admin Line Chat Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Admin sends a reply message to LINE User via Push Message API
export async function POST(req: Request) {
    try {
        const { errorResponse, user: staffUser } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const { sessionId, message } = body;

        if (!sessionId || !message || typeof message !== "string" || !message.trim()) {
            return NextResponse.json({ error: "กรุณาระบุ sessionId และข้อความตอบกลับ" }, { status: 400 });
        }

        const session = await prisma.lineChatSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            return NextResponse.json({ error: "ไม่พบเซสชันการสนทนา" }, { status: 404 });
        }

        const senderName = staffUser?.fullName || "เจ้าหน้าที่ สพร.24 ยะลา";

        // Save Admin Chat Message to Database
        const newMessage = await prisma.lineChatMessage.create({
            data: {
                sessionId: session.id,
                sender: "admin",
                senderName,
                message: message.trim(),
                read: true
            }
        });

        // Update Session Metadata (Reset unreadCount)
        await prisma.lineChatSession.update({
            where: { id: session.id },
            data: {
                lastMessage: `[แอดมิน] ${message.trim()}`,
                lastMessageAt: new Date(),
                unreadCount: 0
            }
        });

        // Send Push Message to LINE User if accessToken is available
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (token && session.lineUserId) {
            try {
                const res = await fetch("https://api.line.me/v2/bot/message/push", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        to: session.lineUserId,
                        messages: [{ type: "text", text: message.trim() }]
                    })
                });

                if (!res.ok) {
                    const errText = await res.text();
                    console.error("LINE Push Message Error:", errText);
                }
            } catch (pushErr) {
                console.error("Failed to push LINE message:", pushErr);
            }
        }

        return NextResponse.json({ success: true, message: newMessage });
    } catch (error: any) {
        console.error("POST Admin Line Chat Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
