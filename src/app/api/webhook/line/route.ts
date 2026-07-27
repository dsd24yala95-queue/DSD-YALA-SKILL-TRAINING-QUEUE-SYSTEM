import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const signature = req.headers.get("x-line-signature");
        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 401 });
        }

        const body = await req.json();

        // LINE sends an array of events
        if (body.events && body.events.length > 0) {
            for (const event of body.events) {
                // We only handle text messages for now
                if (event.type === "message" && event.message.type === "text") {
                    const userId = event.source.userId;
                    const text = event.message.text;
                    const replyToken = event.replyToken;

                    // Simple echo and ID helper
                    let replyText = `สวัสดีครับ ระบบได้รับข้อความของคุณแล้ว: "${text}"`;
                    
                    if (text === "ID" || text === "id" || text === "ไอดี") {
                        replyText = `LINE User ID ของคุณคือ:\n${userId}\n\nคุณสามารถนำ ID นี้ไปกรอกในหน้าโปรไฟล์เพื่อรับการแจ้งเตือนจากระบบได้ครับ`;
                    }

                    // Send reply back to user
                    await replyToLine(replyToken, replyText);
                }
            }
        }

        // Return 200 OK so LINE knows we received the webhook
        return NextResponse.json({ status: "success" });
    } catch (error) {
        console.error("LINE Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

async function replyToLine(replyToken: string, text: string) {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) return;

    try {
        await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                replyToken: replyToken,
                messages: [{ type: "text", text: text }]
            })
        });
    } catch (error) {
        console.error("Error replying to LINE:", error);
    }
}
