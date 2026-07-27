import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// LINE Notify via push message — looks up lineUserId from our own DB
// (Firebase was previously used but now replaced with SQLite/Prisma)
async function sendLineMessage(lineUserId: string, message: string) {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token || !lineUserId) return;
    try {
        await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                to: lineUserId,
                messages: [{ type: "text", text: message }],
            }),
        });
    } catch (e) {
        console.error("LINE push failed:", e);
    }
}

function buildMessage(messageType: string, data: any): string {
    const name = data?.itemName || "บริการ";
    const date = data?.appointedDate
        ? new Date(data.appointedDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "";
    const loc = data?.location || "สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา";

    switch (messageType) {
        case "approved":
            return `📅 แจ้งนัดหมาย\nท่านได้รับการยืนยันคิว "${name}"\nวันที่: ${date}\nสถานที่: ${loc}\n\nกรุณาเข้าระบบเพื่อรับนัดหมายและบันทึก Google Calendar`;
        case "testing":
            return `📢 เรียกคิว!\nถึงคิวของท่านแล้ว กรุณาแสดงตัวที่จุดทดสอบ "${name}"`;
        case "training":
            return `📢 เรียกคิว!\nถึงคิวของท่านแล้ว กรุณาเข้าร่วมจุดฝึกอบรม "${name}"`;
        case "completed":
            return `🎉 ผลการประเมิน\nขอแสดงความยินดี! ท่านผ่านการประเมิน "${name}" เรียบร้อยแล้ว`;
        case "failed":
            return `❌ ผลการประเมิน\nท่านไม่ผ่านการประเมิน "${name}" กรุณาติดต่อเจ้าหน้าที่เพื่อนัดหมายใหม่`;
        case "cancelled":
            return `🚫 คิวถูกยกเลิก\nคิวของท่านสำหรับ "${name}" ถูกยกเลิกแล้ว หากมีข้อสงสัยกรุณาติดต่อสำนักงาน`;
        default:
            return `แจ้งเตือนจากระบบ สพร.24 ยะลา: ${messageType}`;
    }
}

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

        // Get profileJson which may contain lineUserId
        let lineUserId: string | null = null;
        if (user.profileJson) {
            try {
                const j = JSON.parse(user.profileJson);
                lineUserId = j.lineUserId || null;
            } catch (e) {}
        }

        if (!lineUserId) {
            return NextResponse.json({ status: "skipped", reason: "No LINE ID linked" });
        }

        const message = buildMessage(messageType, data);
        await sendLineMessage(lineUserId, message);
        return NextResponse.json({ status: "success" });
    } catch (error: any) {
        console.error("Notify API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
