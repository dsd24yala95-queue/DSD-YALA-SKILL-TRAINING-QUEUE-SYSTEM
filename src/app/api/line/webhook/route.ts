import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// LINE Webhook handler
export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get("x-line-signature");
        const channelSecret = process.env.LINE_CHANNEL_SECRET;
        const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

        // Verify Signature (if secret is configured)
        if (channelSecret && signature) {
            const hash = crypto.createHmac("SHA256", channelSecret).update(bodyText).digest("base64");
            if (hash !== signature) {
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        const body = JSON.parse(bodyText);

        // LINE sends an array of events
        if (body.events && body.events.length > 0) {
            for (const event of body.events) {
                // We only care about text messages
                if (event.type === "message" && event.message.type === "text") {
                    const text = event.message.text.trim();
                    const lineUserId = event.source.userId;
                    const replyToken = event.replyToken;

                    // Regex to check if text is a 10-digit Thai phone number
                    const phoneRegex = /^0\d{9}$/;

                    if (phoneRegex.test(text)) {
                        // Lookup user by phone
                        const user = await prisma.user.findUnique({
                            where: { phoneNumber: text }
                        });

                        let replyText = "";

                        if (user) {
                            // Bind LINE User ID
                            await prisma.user.update({
                                where: { id: user.id },
                                data: { lineUserId: lineUserId }
                            });
                            replyText = "✅ เชื่อมต่อบัญชีสำเร็จ ระบบจะแจ้งเตือนคิวและการนัดหมายผ่านช่องทางนี้ครับ";
                        } else {
                            replyText = "❌ ไม่พบเบอร์โทรศัพท์นี้ในระบบ\nกรุณาลงทะเบียนผ่านเว็บไซต์ก่อนทำการเชื่อมต่อบัญชีครับ";
                        }

                        // Send reply
                        if (accessToken) {
                            await sendLineReply(replyToken, replyText, accessToken);
                        }
                    } else {
                        // Fallback text
                        // You can customize this or ignore it.
                        if (accessToken) {
                            await sendLineReply(
                                replyToken, 
                                "ระบบจองคิว DSD Yala ยินดีต้อนรับ\n\nเพื่อรับการแจ้งเตือนคิว กรุณาพิมพ์เบอร์โทรศัพท์ 10 หลักของคุณที่ลงทะเบียนไว้ในระบบ เพื่อเชื่อมต่อบัญชีครับ", 
                                accessToken
                            );
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("LINE Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper to send reply message back to LINE
async function sendLineReply(replyToken: string, text: string, accessToken: string) {
    const url = "https://api.line.me/v2/bot/message/reply";
    const body = {
        replyToken: replyToken,
        messages: [{ type: "text", text: text }]
    };

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        console.error("Failed to send LINE reply:", await res.text());
    }
}
