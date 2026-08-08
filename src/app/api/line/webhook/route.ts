import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get("x-line-signature");
        const channelSecret = process.env.LINE_CHANNEL_SECRET;
        const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

        // Verify Signature (if channel secret is configured)
        if (channelSecret && signature) {
            const hash = crypto.createHmac("SHA256", channelSecret).update(bodyText).digest("base64");
            if (hash !== signature) {
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        const body = JSON.parse(bodyText);

        if (body.events && body.events.length > 0) {
            for (const event of body.events) {
                const lineUserId = event.source?.userId;
                if (!lineUserId) continue;

                // ─── 1. EVENT: FOLLOW (User adds LINE OA) ───────────────────
                if (event.type === "follow") {
                    const welcomeText = "👋 สวัสดีครับ! นี่คือระบบแจ้งเตือนคิว DSD ยะลา\n\nกรุณาพิมพ์เบอร์โทรศัพท์ที่ใช้สมัครคิว (10 หลัก) เพื่อเชื่อมต่อบัญชีครับ";

                    // Create/Upsert Chat Session
                    await prisma.lineChatSession.upsert({
                        where: { lineUserId },
                        update: { status: "active", updatedAt: new Date() },
                        create: {
                            lineUserId,
                            lastMessage: "เพิ่มเพื่อน LINE OA",
                            status: "active"
                        }
                    });

                    if (accessToken && event.replyToken) {
                        await sendLineReply(event.replyToken, welcomeText, accessToken);
                    }
                }

                // ─── 2. EVENT: UNFOLLOW (User blocks / unfollows) ───────────
                else if (event.type === "unfollow") {
                    // Unbind lineUserId from User table
                    await prisma.user.updateMany({
                        where: { lineUserId },
                        data: { lineUserId: null }
                    });

                    // Update Chat Session status
                    await prisma.lineChatSession.updateMany({
                        where: { lineUserId },
                        data: { status: "unfollowed", updatedAt: new Date() }
                    });
                }

                // ─── 3. EVENT: MESSAGE (Text) ────────────────────────────────
                else if (event.type === "message" && event.message?.type === "text") {
                    const text = event.message.text.trim();
                    const replyToken = event.replyToken;
                    const phoneRegex = /^0\d{9}$/;

                    // 🔹 DART 1 & 2: Check if text is a 10-digit phone number (Account Binding)
                    if (phoneRegex.test(text)) {
                        const user = await prisma.user.findUnique({
                            where: { phoneNumber: text }
                        });

                        let replyText = "";

                        if (user) {
                            // Bind account
                            await prisma.user.update({
                                where: { id: user.id },
                                data: { lineUserId }
                            });

                            // Upsert Session
                            const session = await prisma.lineChatSession.upsert({
                                where: { lineUserId },
                                update: {
                                    userName: user.fullName || "ผู้ใช้งาน",
                                    userPhone: user.phoneNumber,
                                    lastMessage: `ผูกบัญชีสำเร็จ (${text})`,
                                    lastMessageAt: new Date(),
                                    status: "active"
                                },
                                create: {
                                    lineUserId,
                                    userName: user.fullName || "ผู้ใช้งาน",
                                    userPhone: user.phoneNumber,
                                    lastMessage: `ผูกบัญชีสำเร็จ (${text})`,
                                    status: "active"
                                }
                            });

                            // Save system message log
                            await prisma.lineChatMessage.create({
                                data: {
                                    sessionId: session.id,
                                    sender: "user",
                                    senderName: user.fullName || "ผู้ใช้งาน",
                                    message: `ผูกบัญชีด้วยเบอร์โทรศัพท์: ${text}`,
                                    read: true
                                }
                            });

                            replyText = "✅ เชื่อมต่อสำเร็จแล้ว! ระบบจะแจ้งเตือนผ่านช่องทางนี้";
                        } else {
                            replyText = "❌ ไม่พบเบอร์ในระบบ กรุณาตรวจสอบเบอร์โทร หรือไปลงทะเบียนที่เว็บไซต์";
                        }

                        if (accessToken && replyToken) {
                            await sendLineReply(replyToken, replyText, accessToken);
                        }
                    }

                    // 🔹 DART 3: Normal Chat Message (Forward to Admin Live Chat)
                    else {
                        // Find user bound to this lineUserId
                        const boundUser = await prisma.user.findUnique({
                            where: { lineUserId }
                        });

                        const senderName = boundUser?.fullName || "สมาชิก LINE";
                        const userPhone = boundUser?.phoneNumber || null;

                        // Upsert Chat Session (Increment unreadCount for Admin)
                        const session = await prisma.lineChatSession.upsert({
                            where: { lineUserId },
                            update: {
                                userName: senderName,
                                userPhone: userPhone || undefined,
                                lastMessage: text,
                                lastMessageAt: new Date(),
                                unreadCount: { increment: 1 },
                                status: "active"
                            },
                            create: {
                                lineUserId,
                                userName: senderName,
                                userPhone,
                                lastMessage: text,
                                lastMessageAt: new Date(),
                                unreadCount: 1,
                                status: "active"
                            }
                        });

                        // Create Chat Message
                        await prisma.lineChatMessage.create({
                            data: {
                                sessionId: session.id,
                                sender: "user",
                                senderName,
                                message: text,
                                read: false
                            }
                        });
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
