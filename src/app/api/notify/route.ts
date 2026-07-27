import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushMessage } from "@/lib/services/line-service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { memberId, messageType, data } = body;

        if (!memberId || !messageType) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        // Find user in SQLite db
        const user = await prisma.user.findUnique({ where: { id: memberId } })
            ?? await prisma.user.findFirst({ where: { memberId } });

        if (!user) {
            return NextResponse.json({ status: "skipped", reason: "User not found" });
        }

        // Get lineUserId from User table or profileJson
        let lineUserId: string | null = user.lineUserId || null;
        if (!lineUserId && user.profileJson) {
            try {
                const j = JSON.parse(user.profileJson);
                lineUserId = j.lineUserId || null;
            } catch (e) {}
        }

        if (!lineUserId) {
            return NextResponse.json({ status: "skipped", reason: "No LINE ID linked" });
        }

        // Send Rich LINE Flex Message via line-service
        const result = await pushMessage(lineUserId, messageType, data || {});
        return NextResponse.json({ status: result.success ? "success" : "failed", error: result.error });
    } catch (error: any) {
        console.error("Notify API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
