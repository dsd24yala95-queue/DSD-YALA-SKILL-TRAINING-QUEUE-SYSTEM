import { prisma } from "@/lib/prisma";

interface SendCsatCardOptions {
    bookingId: string;
    userId: string;
    lineUserId: string;
    bookingType: string;
    itemName: string;
}

// ─── Build LINE CSAT Flex Message Card ───────────────────────────────────────
function buildCsatFlexCard(bookingId: string, itemName: string, bookingType: string) {
    const typeLabel = bookingType === "training" ? "🎓 หลักสูตรฝึกอบรม" : "📋 การทดสอบมาตรฐาน";
    const today = new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Star buttons (1–5)
    const starButtons = [1, 2, 3, 4, 5].map((star) => ({
        type: "button",
        action: {
            type: "postback",
            label: "⭐".repeat(star),
            data: `csat:${bookingId}:${star}`,
            displayText: `ให้คะแนน ${star} ดาว`,
        },
        style: star >= 4 ? "primary" : "secondary",
        color: star >= 4 ? "#06C755" : "#6B7280",
        height: "sm",
        flex: 1,
        margin: "xs",
    }));

    return {
        type: "flex",
        altText: "⭐ แบบสอบถามความพึงพอใจการบริการ สพร.24 ยะลา",
        contents: {
            type: "bubble",
            size: "mega",
            header: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "⭐ แบบสอบถามความพึงพอใจ",
                        weight: "bold",
                        size: "lg",
                        color: "#FFFFFF",
                    },
                    {
                        type: "text",
                        text: "สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา",
                        size: "sm",
                        color: "#D1FAE5",
                    },
                ],
                backgroundColor: "#06C755",
                paddingAll: "20px",
            },
            body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                contents: [
                    {
                        type: "text",
                        text: "ขอบคุณที่ใช้บริการครับ/ค่ะ 🙏",
                        weight: "bold",
                        size: "md",
                        color: "#111827",
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        contents: [
                            {
                                type: "text",
                                text: `${typeLabel}`,
                                size: "sm",
                                color: "#4B5563",
                            },
                            {
                                type: "text",
                                text: `📚 ${itemName}`,
                                size: "sm",
                                color: "#111827",
                                weight: "bold",
                                wrap: true,
                            },
                            {
                                type: "text",
                                text: `📅 ${today}`,
                                size: "sm",
                                color: "#6B7280",
                            },
                        ],
                        backgroundColor: "#F9FAFB",
                        cornerRadius: "md",
                        paddingAll: "12px",
                    },
                    {
                        type: "separator",
                    },
                    {
                        type: "text",
                        text: "คุณพึงพอใจการบริการของเราในระดับใด?",
                        size: "sm",
                        color: "#374151",
                        weight: "bold",
                    },
                    {
                        type: "box",
                        layout: "horizontal",
                        spacing: "xs",
                        contents: starButtons,
                    },
                    {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                            { type: "text", text: "น้อยมาก", size: "xxs", color: "#9CA3AF", flex: 1 },
                            { type: "text", text: "ดีเยี่ยม", size: "xxs", color: "#06C755", flex: 0, align: "end" },
                        ],
                    },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "กดเลือกคะแนนด้านบนเพื่อส่งแบบสอบถาม",
                        size: "xs",
                        color: "#9CA3AF",
                        align: "center",
                    },
                ],
            },
        },
    };
}

// ─── Main Function: Create CSAT Record + Send LINE Flex Card ──────────────────
export async function sendCsatCard(opts: SendCsatCardOptions): Promise<void> {
    const { bookingId, userId, lineUserId, bookingType, itemName } = opts;
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!accessToken) {
        console.warn("[CSAT] LINE_CHANNEL_ACCESS_TOKEN not set, skipping CSAT push.");
        return;
    }

    try {
        // 1. Create CsatSurvey record in DB (idempotent via upsert)
        await (prisma as any).csatSurvey.upsert({
            where: { bookingId },
            update: {},
            create: {
                bookingId,
                userId,
                lineUserId,
                bookingType,
                itemName,
                status: "sent",
            },
        });

        // 2. Build Flex Card
        const flexCard = buildCsatFlexCard(bookingId, itemName, bookingType);

        // 3. Push to LINE user
        const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                to: lineUserId,
                messages: [flexCard],
            }),
        });

        if (!lineRes.ok) {
            const errText = await lineRes.text();
            console.error("[CSAT] LINE Push failed:", errText);
        } else {
            console.log(`[CSAT] Sent CSAT card to ${lineUserId} for booking ${bookingId}`);
        }
    } catch (error) {
        console.error("[CSAT] Error sending CSAT card:", error);
    }
}
