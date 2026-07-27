import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/notifications/active-call?userId=xxx
// Returns the active unread queue_call notification for polling by Member client
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ call: null });
        }

        const notification = await prisma.notification.findFirst({
            where: {
                userId,
                type: "queue_call",
                read: false
            },
            orderBy: { createdAt: "desc" }
        });

        if (!notification) {
            return NextResponse.json({ call: null });
        }

        let meta: any = {};
        try {
            meta = JSON.parse(notification.metadata || "{}");
        } catch (e) {}

        return NextResponse.json({
            call: {
                id: notification.id,
                queueNumber: meta.queueNumber,
                itemName: meta.itemName,
                callCount: meta.callCount || 1,
                calledAt: meta.calledAt || notification.createdAt
            }
        });
    } catch (error: any) {
        return NextResponse.json({ call: null });
    }
}
